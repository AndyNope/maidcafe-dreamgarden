<?php

declare(strict_types=1);

use Stripe\Stripe;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

final class ShopOrderController
{
    private string $stripeSecret;
    private string $webhookSecret;
    private string $successUrl;
    private string $cancelUrl;

    public function __construct(private PDO $db, private Auth $auth)
    {
        $this->stripeSecret  = $_ENV['STRIPE_SECRET_KEY']    ?? getenv('STRIPE_SECRET_KEY')    ?: '';
        $this->webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: '';
        $this->successUrl    = $_ENV['STRIPE_SUCCESS_URL']   ?? getenv('STRIPE_SUCCESS_URL')   ?: 'http://localhost:5173/shop/success';
        $this->cancelUrl     = $_ENV['STRIPE_CANCEL_URL']    ?? getenv('STRIPE_CANCEL_URL')    ?: 'http://localhost:5173/cart';
    }

    // ── Create Checkout Session ───────────────────────────────────────────────

    /**
     * POST /api/shop/checkout
     * Body: { items: [{product_id, quantity}], shipping: {...}, customer_id? }
     */
    public function createCheckout(): never
    {
        $body     = request_body();
        $items    = is_array($body['items'] ?? null) ? $body['items'] : [];
        $shipping = is_array($body['shipping'] ?? null) ? $body['shipping'] : [];
        $customerId = (int)($body['customer_id'] ?? 0) ?: null;

        if (empty($items)) {
            json_response(['error' => 'Keine Artikel im Warenkorb'], 400);
        }

        // Load products and calculate totals
        $lineItems    = [];
        $orderItems   = [];
        $subtotal     = 0.0;
        $maxDelivery  = 0.0;

        foreach ($items as $item) {
            $pid = (int)($item['product_id'] ?? 0);
            $qty = max(1, (int)($item['quantity'] ?? 1));

            $stmt = $this->db->prepare(
                'SELECT id, name, price, stock, delivery_cost, available FROM products WHERE id = ? LIMIT 1'
            );
            $stmt->execute([$pid]);
            $product = $stmt->fetch();

            if (!$product || !$product['available']) {
                json_response(['error' => "Produkt #$pid nicht verfügbar"], 400);
            }
            if ($product['stock'] > 0 && $product['stock'] < $qty) {
                json_response(['error' => "Nicht genug Lagerbestand für: {$product['name']}"], 400);
            }

            $subtotal    += $product['price'] * $qty;
            $maxDelivery  = max($maxDelivery, (float)$product['delivery_cost']);

            $lineItems[]  = [
                'price_data' => [
                    'currency'     => 'chf',
                    'unit_amount'  => (int)round($product['price'] * 100),
                    'product_data' => ['name' => $product['name']],
                ],
                'quantity' => $qty,
            ];
            $orderItems[] = [
                'product_id'   => $pid,
                'product_name' => $product['name'],
                'unit_price'   => $product['price'],
                'quantity'     => $qty,
            ];
        }

        // Add delivery cost as a separate line item if applicable
        if ($maxDelivery > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency'     => 'chf',
                    'unit_amount'  => (int)round($maxDelivery * 100),
                    'product_data' => ['name' => 'Lieferkosten'],
                ],
                'quantity' => 1,
            ];
        }

        $total = $subtotal + $maxDelivery;

        // Create pending order in DB
        $orderId = $this->insertOrder($customerId, $shipping, $subtotal, $maxDelivery, $total);
        foreach ($orderItems as $oi) {
            $this->insertOrderItem($orderId, $oi);
        }

        // Create Stripe Checkout Session
        if ($this->stripeSecret && $this->stripeSecret !== 'sk_test_placeholder') {
            Stripe::setApiKey($this->stripeSecret);

            $session = CheckoutSession::create([
                'payment_method_types' => ['card', 'twint'],
                'line_items'           => $lineItems,
                'mode'                 => 'payment',
                'success_url'          => $this->successUrl . '?order_id=' . $orderId,
                'cancel_url'           => $this->cancelUrl,
                'metadata'             => ['order_id' => (string)$orderId],
                'payment_intent_data'  => ['metadata' => ['order_id' => (string)$orderId]],
                'locale'               => 'de',
            ]);

            // Save session ID
            $this->db->prepare('UPDATE shop_orders SET stripe_payment_intent = ? WHERE id = ?')
                     ->execute([$session->id, $orderId]);

            json_response(['checkout_url' => $session->url, 'order_id' => $orderId]);
        }

        // Dev/test mode without Stripe keys — immediately mark as paid
        $this->db->prepare("UPDATE shop_orders SET status='paid', stripe_payment_intent='DEV_MODE' WHERE id=?")
                 ->execute([$orderId]);

        json_response(['checkout_url' => null, 'order_id' => $orderId, 'dev_mode' => true]);
    }

    // ── Stripe Webhook ────────────────────────────────────────────────────────

    /** POST /api/shop/webhook */
    public function webhook(): never
    {
        $payload   = file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        if ($this->webhookSecret && $this->webhookSecret !== 'whsec_placeholder') {
            try {
                Stripe::setApiKey($this->stripeSecret);
                $event = Webhook::constructEvent($payload, $sigHeader, $this->webhookSecret);
            } catch (SignatureVerificationException) {
                json_response(['error' => 'Invalid signature'], 400);
            }
        } else {
            // Dev mode — parse raw JSON
            $event = json_decode($payload, true);
        }

        $type = is_array($event) ? ($event['type'] ?? '') : ($event->type ?? '');

        if ($type === 'checkout.session.completed') {
            $session  = is_array($event) ? ($event['data']['object'] ?? []) : $event->data->object;
            $orderId  = is_array($session) ? ($session['metadata']['order_id'] ?? 0) : ($session->metadata->order_id ?? 0);
            $intentId = is_array($session) ? ($session['payment_intent'] ?? '') : ($session->payment_intent ?? '');

            if ($orderId) {
                $this->db->prepare(
                    "UPDATE shop_orders SET status='paid', stripe_payment_intent=? WHERE id=?"
                )->execute([$intentId, (int)$orderId]);

                $this->maybeDecrementStock((int)$orderId);
                $this->maybeSendConfirmationEmail((int)$orderId);
            }
        }

        json_response(['received' => true]);
    }

    // ── Order queries ─────────────────────────────────────────────────────────

    /** GET /api/shop/orders/mine — customer's own orders */
    public function myOrders(): never
    {
        $customer = $this->auth->requireCustomer();

        $stmt = $this->db->prepare(
            'SELECT o.*, GROUP_CONCAT(
                CONCAT(oi.product_name," × ",oi.quantity)
                ORDER BY oi.id SEPARATOR ", "
             ) AS items_summary
               FROM shop_orders o
               LEFT JOIN shop_order_items oi ON oi.order_id = o.id
              WHERE o.customer_id = ?
              GROUP BY o.id
              ORDER BY o.created_at DESC'
        );
        $stmt->execute([$customer['sub']]);
        json_response($stmt->fetchAll());
    }

    /** GET /api/shop/orders/mine/{id} */
    public function myOrderDetail(int $id): never
    {
        $customer = $this->auth->requireCustomer();
        $order    = $this->getOrderWithItems($id);
        if (!$order || (int)$order['customer_id'] !== (int)$customer['sub']) {
            json_response(['error' => 'Not found'], 404);
        }
        json_response($order);
    }

    /** GET /api/admin/shop/orders — admin all orders */
    public function adminIndex(): never
    {
        $this->auth->requireAuth();
        $stmt = $this->db->query(
            'SELECT o.*, GROUP_CONCAT(
                CONCAT(oi.product_name," × ",oi.quantity)
                ORDER BY oi.id SEPARATOR ", "
             ) AS items_summary
               FROM shop_orders o
               LEFT JOIN shop_order_items oi ON oi.order_id = o.id
              GROUP BY o.id
              ORDER BY o.created_at DESC'
        );
        json_response($stmt->fetchAll());
    }

    /** GET /api/admin/shop/orders/{id} */
    public function adminShow(int $id): never
    {
        $this->auth->requireAuth();
        $order = $this->getOrderWithItems($id);
        if (!$order) json_response(['error' => 'Not found'], 404);
        json_response($order);
    }

    /** PUT /api/admin/shop/orders/{id}/status */
    public function updateStatus(int $id): never
    {
        $this->auth->requireAuth();
        $status = trim(request_body()['status'] ?? '');
        $allowed = ['pending','paid','processing','shipped','delivered','cancelled'];
        if (!in_array($status, $allowed, true)) {
            json_response(['error' => 'Invalid status'], 400);
        }
        $this->db->prepare('UPDATE shop_orders SET status=? WHERE id=?')->execute([$status, $id]);
        json_response(['success' => true]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function insertOrder(?int $customerId, array $s, float $subtotal, float $delivery, float $total): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO shop_orders
             (customer_id, shipping_first_name, shipping_last_name,
              shipping_street, shipping_city, shipping_postal_code, shipping_country,
              subtotal, delivery_cost, total)
             VALUES (?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            $customerId,
            substr($s['first_name'] ?? '', 0, 100),
            substr($s['last_name']  ?? '', 0, 100),
            substr($s['street']     ?? '', 0, 200),
            substr($s['city']       ?? '', 0, 100),
            substr($s['postal_code'] ?? '', 0, 20),
            substr($s['country']    ?? 'Schweiz', 0, 100),
            round($subtotal, 2),
            round($delivery, 2),
            round($total, 2),
        ]);
        return (int)$this->db->lastInsertId();
    }

    private function insertOrderItem(int $orderId, array $item): void
    {
        $this->db->prepare(
            'INSERT INTO shop_order_items (order_id, product_id, product_name, unit_price, quantity)
             VALUES (?,?,?,?,?)'
        )->execute([$orderId, $item['product_id'], $item['product_name'], $item['unit_price'], $item['quantity']]);
    }

    private function getOrderWithItems(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM shop_orders WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        if (!$order) return false;

        $stmt2 = $this->db->prepare('SELECT * FROM shop_order_items WHERE order_id = ?');
        $stmt2->execute([$id]);
        $order['items'] = $stmt2->fetchAll();
        return $order;
    }

    private function maybeDecrementStock(int $orderId): void
    {
        $stmt = $this->db->prepare('SELECT product_id, quantity FROM shop_order_items WHERE order_id = ?');
        $stmt->execute([$orderId]);
        foreach ($stmt->fetchAll() as $item) {
            if ($item['product_id']) {
                $this->db->prepare(
                    'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ? AND stock > 0'
                )->execute([$item['quantity'], $item['product_id']]);
                // Mark as unavailable if stock reaches 0
                $this->db->prepare(
                    'UPDATE products SET available = 0 WHERE id = ? AND stock = 0'
                )->execute([$item['product_id']]);
            }
        }
    }

    private function maybeSendConfirmationEmail(int $orderId): void
    {
        try {
            $order = $this->getOrderWithItems($orderId);
            if (!$order || !$order['customer_id']) return;

            $stmt = $this->db->prepare('SELECT email, first_name, last_name FROM customers WHERE id = ?');
            $stmt->execute([$order['customer_id']]);
            $customer = $stmt->fetch();
            if (!$customer) return;

            Mailer::sendOrderConfirmation(
                $customer['email'],
                trim($customer['first_name'] . ' ' . $customer['last_name']),
                $order
            );
        } catch (Throwable) {
            // Non-fatal — email failure should not break the webhook response
        }
    }
}
