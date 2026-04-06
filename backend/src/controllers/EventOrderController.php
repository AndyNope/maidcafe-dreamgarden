<?php

declare(strict_types=1);

use Stripe\Stripe;
use Stripe\Checkout\Session as CheckoutSession;

final class EventOrderController
{
    private string $stripeSecret;
    private string $webhookSecret;

    public function __construct(private PDO $db, private Auth $auth)
    {
        $this->stripeSecret  = $_ENV['STRIPE_SECRET_KEY']    ?? getenv('STRIPE_SECRET_KEY')    ?: '';
        $this->webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: '';
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    /** GET /api/app/orders?table_id=&status=open */
    public function index(): never
    {
        $this->requireStaffOrAdmin();
        $tableId = (int)($_GET['table_id'] ?? 0) ?: null;
        $status  = $_GET['status'] ?? 'open';

        $sql    = 'SELECT o.*, t.number AS table_number, t.name AS table_name, m.name AS staff_name
                     FROM event_orders o
                     LEFT JOIN restaurant_tables t ON t.id = o.table_id
                     LEFT JOIN members m ON m.id = o.staff_id
                    WHERE 1=1';
        $params = [];

        if ($tableId) { $sql .= ' AND o.table_id = ?'; $params[] = $tableId; }
        if ($status)  { $sql .= ' AND o.status = ?';   $params[] = $status; }

        $sql .= ' ORDER BY o.created_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['items'] = $this->getItems($order['id']);
        }

        json_response($orders);
    }

    /** GET /api/app/orders/{id} */
    public function show(int $id): never
    {
        $this->requireStaffOrAdmin();
        $order = $this->getOrder($id);
        if (!$order) json_response(['error' => 'Not found'], 404);
        json_response($order);
    }

    /** POST /api/app/orders — create new order for a table */
    public function store(): never
    {
        $payload = $this->requireStaffOrAdmin();
        $body    = request_body();
        $tableId = (int)($body['table_id'] ?? 0);

        // Check table exists
        $stmt = $this->db->prepare('SELECT id FROM restaurant_tables WHERE id = ? AND active = 1 LIMIT 1');
        $stmt->execute([$tableId]);
        if (!$stmt->fetch()) json_response(['error' => 'Tisch nicht gefunden'], 404);

        // Only one open order per table
        $stmt = $this->db->prepare('SELECT id FROM event_orders WHERE table_id = ? AND status = "open" LIMIT 1');
        $stmt->execute([$tableId]);
        if ($existing = $stmt->fetch()) {
            json_response($this->getOrder($existing['id']));
        }

        $staffId = ($payload['type'] ?? '') === 'staff' ? (int)$payload['sub'] : null;
        $this->db->prepare(
            'INSERT INTO event_orders (table_id, staff_id, notes) VALUES (?,?,?)'
        )->execute([$tableId, $staffId, substr(trim($body['notes'] ?? ''), 0, 1000)]);

        $id = (int)$this->db->lastInsertId();
        json_response($this->getOrder($id), 201);
    }

    /** POST /api/app/orders/{id}/items — add items to an order */
    public function addItems(int $id): never
    {
        $this->requireStaffOrAdmin();
        $body  = request_body();
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];

        $order = $this->getOrder($id);
        if (!$order || $order['status'] !== 'open') {
            json_response(['error' => 'Bestellung nicht offen'], 400);
        }

        foreach ($items as $item) {
            $menuId = (int)($item['menu_item_id'] ?? 0);
            $qty    = max(1, (int)($item['quantity'] ?? 1));
            $guest  = substr(trim($item['assigned_guest'] ?? ''), 0, 100) ?: null;
            $notes  = substr(trim($item['notes'] ?? ''), 0, 300) ?: null;

            // Fetch price + name from menu_items if menu_item_id given
            $itemName  = substr(trim($item['item_name'] ?? ''), 0, 200);
            $unitPrice = (float)($item['unit_price'] ?? 0);
            $itemCat   = 'food';

            if ($menuId) {
                $stmt = $this->db->prepare(
                    'SELECT mi.name, mi.price, mc.name AS cat_name
                       FROM menu_items mi
                       LEFT JOIN menu_categories mc ON mc.id = mi.category_id
                      WHERE mi.id = ? AND mi.available = 1 LIMIT 1'
                );
                $stmt->execute([$menuId]);
                $menuItem = $stmt->fetch();
                if (!$menuItem) continue;
                $itemName  = $menuItem['name'];
                $unitPrice = (float)$menuItem['price'];
                // Heuristic: category name contains "Getränk" → drink
                $catLower  = strtolower($menuItem['cat_name'] ?? '');
                if (str_contains($catLower, 'getr') || str_contains($catLower, 'drink') || str_contains($catLower, 'bever')) {
                    $itemCat = 'drink';
                }
            }

            $this->db->prepare(
                'INSERT INTO event_order_items
                 (event_order_id, menu_item_id, item_name, item_category, unit_price, quantity, assigned_guest)
                 VALUES (?,?,?,?,?,?,?)'
            )->execute([$id, $menuId ?: null, $itemName, $itemCat, $unitPrice, $qty, $guest]);
        }

        json_response($this->getOrder($id));
    }

    /** DELETE /api/app/orders/{id}/items/{itemId} — remove a single item */
    public function removeItem(int $id, int $itemId): never
    {
        $this->requireStaffOrAdmin();

        $stmt = $this->db->prepare('SELECT event_order_id FROM event_order_items WHERE id = ?');
        $stmt->execute([$itemId]);
        $row = $stmt->fetch();
        if (!$row || (int)$row['event_order_id'] !== $id) {
            json_response(['error' => 'Not found'], 404);
        }

        $this->db->prepare('DELETE FROM event_order_items WHERE id = ?')->execute([$itemId]);
        json_response($this->getOrder($id));
    }

    /** PUT /api/app/orders/{id}/close */
    public function closeOrder(int $id): never
    {
        $this->requireStaffOrAdmin();
        $this->db->prepare("UPDATE event_orders SET status='closed' WHERE id=?")->execute([$id]);
        json_response(['success' => true]);
    }

    /** PUT /api/app/orders/{id}/cancel */
    public function cancelOrder(int $id): never
    {
        $this->requireStaffOrAdmin();
        $this->db->prepare("UPDATE event_orders SET status='cancelled' WHERE id=?")->execute([$id]);
        json_response(['success' => true]);
    }

    // ── Bill splitting + QR payment ───────────────────────────────────────────

    /**
     * POST /api/app/orders/{id}/bills
     * Body: { bills: [ { guest_name, item_ids: [1,2,...] } ] }
     */
    public function createBills(int $id): never
    {
        $this->requireStaffOrAdmin();
        $body  = request_body();
        $bills = is_array($body['bills'] ?? null) ? $body['bills'] : [];

        $order = $this->getOrder($id);
        if (!$order) json_response(['error' => 'Not found'], 404);

        $createdBills = [];

        foreach ($bills as $billData) {
            $guestName = substr(trim($billData['guest_name'] ?? 'Gast'), 0, 100);
            $itemIds   = array_map('intval', $billData['item_ids'] ?? []);
            $customTotal = isset($billData['custom_total']) ? (float)$billData['custom_total'] : null;

            // Allow bills without item_ids when custom_total is provided (e.g. equal split)
            if (empty($itemIds) && $customTotal === null) continue;

            if (!empty($itemIds)) {
                // Calculate total from selected items
                $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
                $stmt = $this->db->prepare(
                    "SELECT unit_price, quantity FROM event_order_items
                      WHERE id IN ($placeholders) AND event_order_id = ?"
                );
                $stmt->execute([...$itemIds, $id]);
                $rows  = $stmt->fetchAll();
                $total = array_reduce($rows, fn($carry, $r) => $carry + $r['unit_price'] * $r['quantity'], 0.0);
            } else {
                $total = 0.0;
            }

            // custom_total overrides the item-based calculation (used for equal splits)
            if ($customTotal !== null) {
                $total = $customTotal;
            }

            // Generate Stripe Checkout link for this guest's bill
            $checkoutUrl  = null;
            $paymentIntent = null;

            if ($this->stripeSecret && $this->stripeSecret !== 'sk_test_placeholder' && $total > 0) {
                Stripe::setApiKey($this->stripeSecret);
                $appUrl   = $_ENV['APP_URL'] ?? getenv('APP_URL') ?: 'http://localhost:5173';
                $session  = CheckoutSession::create([
                    'payment_method_types' => ['card', 'twint'],
                    'line_items' => [[
                        'price_data' => [
                            'currency'     => 'chf',
                            'unit_amount'  => (int)round($total * 100),
                            'product_data' => ['name' => "Rechnung – Tisch {$order['table_number']} – $guestName"],
                        ],
                        'quantity' => 1,
                    ]],
                    'mode'        => 'payment',
                    'success_url' => $appUrl . '/app/payment-success?bill_id={CHECKOUT_SESSION_ID}',
                    'cancel_url'  => $appUrl . '/app/orders/' . $id,
                    'locale'      => 'de',
                    'metadata'    => ['event_order_id' => (string)$id, 'guest_name' => $guestName],
                ]);
                $checkoutUrl   = $session->url;
                $paymentIntent = $session->id;
            }

            $this->db->prepare(
                'INSERT INTO event_bills
                 (event_order_id, guest_name, total, payment_status, stripe_payment_intent, stripe_checkout_url)
                 VALUES (?,?,?,?,?,?)'
            )->execute([$id, $guestName, round($total, 2), 'pending', $paymentIntent, $checkoutUrl]);

            $billId = (int)$this->db->lastInsertId();
            $createdBills[] = [
                'id'           => $billId,
                'guest_name'   => $guestName,
                'total'        => round($total, 2),
                'checkout_url' => $checkoutUrl,
            ];
        }

        json_response(['bills' => $createdBills]);
    }

    /** GET /api/app/orders/{id}/bills */
    public function getBills(int $id): never
    {
        $this->requireStaffOrAdmin();
        $stmt = $this->db->prepare('SELECT * FROM event_bills WHERE event_order_id = ? ORDER BY id ASC');
        $stmt->execute([$id]);
        json_response($stmt->fetchAll());
    }

    /** PUT /api/app/bills/{billId}/pay — mark as paid manually (cash) */
    public function markBillPaid(int $billId): never
    {
        $this->requireStaffOrAdmin();
        $body   = request_body();
        $method = in_array($body['payment_method'] ?? '', ['cash','stripe','twint','other'])
                    ? $body['payment_method'] : 'cash';

        $this->db->prepare(
            "UPDATE event_bills SET payment_status='paid', payment_method=? WHERE id=?"
        )->execute([$method, $billId]);

        json_response(['success' => true]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function requireStaffOrAdmin(): array
    {
        $payload = $this->auth->staffGuard() ?? $this->auth->guard();
        if (!$payload) {
            json_response(['error' => 'Unauthorized'], 401);
        }
        return $payload;
    }

    private function getOrder(int $id): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT o.*, t.number AS table_number, t.name AS table_name, m.name AS staff_name
               FROM event_orders o
               LEFT JOIN restaurant_tables t ON t.id = o.table_id
               LEFT JOIN members m ON m.id = o.staff_id
              WHERE o.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        if (!$order) return false;
        $order['items'] = $this->getItems($id);
        return $order;
    }

    private function getItems(int $orderId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM event_order_items WHERE event_order_id = ? ORDER BY id ASC'
        );
        $stmt->execute([$orderId]);
        return $stmt->fetchAll();
    }
}
