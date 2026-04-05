<?php

declare(strict_types=1);

final class RevenueController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /**
     * GET /api/admin/revenue
     * Query params:
     *   from=YYYY-MM-DD  (default: first day of current month)
     *   to=YYYY-MM-DD    (default: today)
     *   type=shop|restaurant|all  (default: all)
     */
    public function index(): never
    {
        $this->auth->requireAuth();

        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-d');
        $type = $_GET['type'] ?? 'all';

        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) $from = date('Y-m-01');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to))   $to   = date('Y-m-d');

        $result = [
            'period' => ['from' => $from, 'to' => $to],
        ];

        if ($type === 'all' || $type === 'shop') {
            $result['shop'] = $this->shopRevenue($from, $to);
        }

        if ($type === 'all' || $type === 'restaurant') {
            $result['restaurant'] = $this->restaurantRevenue($from, $to);
        }

        if ($type === 'all') {
            $shopTotal = $result['shop']['total'] ?? 0;
            $restTotal = $result['restaurant']['total'] ?? 0;
            $result['total'] = round($shopTotal + $restTotal, 2);
        }

        json_response($result);
    }

    private function shopRevenue(string $from, string $to): array
    {
        // Summary
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) AS order_count,
                    COALESCE(SUM(total), 0) AS total,
                    COALESCE(SUM(delivery_cost), 0) AS delivery_total,
                    COALESCE(SUM(subtotal), 0) AS product_total
               FROM shop_orders
              WHERE status IN ('paid','processing','shipped','delivered')
                AND DATE(created_at) BETWEEN ? AND ?"
        );
        $stmt->execute([$from, $to]);
        $summary = $stmt->fetch();

        // By product
        $stmt2 = $this->db->prepare(
            "SELECT oi.product_name,
                    SUM(oi.quantity) AS units_sold,
                    SUM(oi.quantity * oi.unit_price) AS revenue
               FROM shop_order_items oi
               JOIN shop_orders o ON o.id = oi.order_id
              WHERE o.status IN ('paid','processing','shipped','delivered')
                AND DATE(o.created_at) BETWEEN ? AND ?
              GROUP BY oi.product_name
              ORDER BY revenue DESC"
        );
        $stmt2->execute([$from, $to]);

        // Daily breakdown
        $stmt3 = $this->db->prepare(
            "SELECT DATE(created_at) AS day,
                    COUNT(*) AS orders,
                    SUM(total) AS revenue
               FROM shop_orders
              WHERE status IN ('paid','processing','shipped','delivered')
                AND DATE(created_at) BETWEEN ? AND ?
              GROUP BY DATE(created_at)
              ORDER BY day ASC"
        );
        $stmt3->execute([$from, $to]);

        return [
            'order_count'   => (int)$summary['order_count'],
            'total'         => (float)$summary['total'],
            'delivery_total'=> (float)$summary['delivery_total'],
            'product_total' => (float)$summary['product_total'],
            'by_product'    => $stmt2->fetchAll(),
            'by_day'        => $stmt3->fetchAll(),
        ];
    }

    private function restaurantRevenue(string $from, string $to): array
    {
        // Summary of paid bills
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) AS bill_count,
                    COALESCE(SUM(b.total), 0) AS total
               FROM event_bills b
               JOIN event_orders o ON o.id = b.event_order_id
              WHERE b.payment_status = 'paid'
                AND DATE(b.created_at) BETWEEN ? AND ?"
        );
        $stmt->execute([$from, $to]);
        $summary = $stmt->fetch();

        // By payment method
        $stmt2 = $this->db->prepare(
            "SELECT b.payment_method,
                    COUNT(*) AS count,
                    SUM(b.total) AS total
               FROM event_bills b
              WHERE b.payment_status = 'paid'
                AND DATE(b.created_at) BETWEEN ? AND ?
              GROUP BY b.payment_method"
        );
        $stmt2->execute([$from, $to]);

        // Top items sold (from event_order_items that are served)
        $stmt3 = $this->db->prepare(
            "SELECT oi.item_name,
                    SUM(oi.quantity) AS qty_sold,
                    SUM(oi.quantity * oi.unit_price) AS revenue
               FROM event_order_items oi
               JOIN event_orders o ON o.id = oi.event_order_id
              WHERE oi.status = 'served'
                AND DATE(o.created_at) BETWEEN ? AND ?
              GROUP BY oi.item_name
              ORDER BY revenue DESC
              LIMIT 20"
        );
        $stmt3->execute([$from, $to]);

        // Daily breakdown
        $stmt4 = $this->db->prepare(
            "SELECT DATE(b.created_at) AS day,
                    COUNT(*) AS bills,
                    SUM(b.total) AS revenue
               FROM event_bills b
              WHERE b.payment_status = 'paid'
                AND DATE(b.created_at) BETWEEN ? AND ?
              GROUP BY DATE(b.created_at)
              ORDER BY day ASC"
        );
        $stmt4->execute([$from, $to]);

        return [
            'bill_count'     => (int)$summary['bill_count'],
            'total'          => (float)$summary['total'],
            'by_payment'     => $stmt2->fetchAll(),
            'top_items'      => $stmt3->fetchAll(),
            'by_day'         => $stmt4->fetchAll(),
        ];
    }
}
