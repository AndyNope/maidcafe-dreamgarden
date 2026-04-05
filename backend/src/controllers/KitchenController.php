<?php

declare(strict_types=1);

final class KitchenController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /**
     * GET /api/kitchen/items
     * Returns all non-cancelled items from open orders — food + drink only.
     * Optional: ?category=food|drink
     */
    public function items(): never
    {
        $this->requireStaffOrAdmin();

        $category = $_GET['category'] ?? null;
        $sql = "SELECT oi.*, o.id AS order_id, t.number AS table_number, t.name AS table_name,
                       m.name AS staff_name
                  FROM event_order_items oi
                  JOIN event_orders o ON o.id = oi.event_order_id
                  LEFT JOIN restaurant_tables t ON t.id = o.table_id
                  LEFT JOIN members m ON m.id = o.staff_id
                 WHERE o.status = 'open'
                   AND oi.status != 'cancelled'
                   AND oi.item_category IN ('food','drink')";

        $params = [];
        if ($category && in_array($category, ['food','drink'], true)) {
            $sql .= ' AND oi.item_category = ?';
            $params[] = $category;
        }

        $sql .= ' ORDER BY oi.id ASC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        json_response($stmt->fetchAll());
    }

    /**
     * PUT /api/kitchen/items/{id}/status
     * Body: { status: 'preparing'|'ready'|'served'|'cancelled', cancel_note?: string }
     */
    public function updateItemStatus(int $id): never
    {
        $this->requireStaffOrAdmin();
        $body   = request_body();
        $status = $body['status'] ?? '';
        $allowed = ['pending','preparing','ready','served','cancelled'];

        if (!in_array($status, $allowed, true)) {
            json_response(['error' => 'Ungültiger Status'], 400);
        }

        $cancelNote = null;
        if ($status === 'cancelled') {
            $cancelNote = substr(trim($body['cancel_note'] ?? ''), 0, 300) ?: 'Storniert';
        }

        $this->db->prepare('UPDATE event_order_items SET status=?, cancel_note=? WHERE id=?')
                 ->execute([$status, $cancelNote, $id]);

        // If cancelled and item has a menu_item_id, optionally mark sold out
        if ($status === 'cancelled' && !empty($body['mark_sold_out']) && !empty($body['menu_item_id'])) {
            $menuItemId = (int)$body['menu_item_id'];
            $this->db->prepare('UPDATE menu_items SET available=0 WHERE id=?')
                     ->execute([$menuItemId]);
        }

        json_response(['success' => true]);
    }

    /**
     * PUT /api/kitchen/menu-items/{id}/sold-out
     * Body: { available: 0|1 }
     */
    public function toggleMenuItemAvailability(int $id): never
    {
        $this->requireStaffOrAdmin();
        $available = empty(request_body()['available']) ? 0 : 1;
        $this->db->prepare('UPDATE menu_items SET available=? WHERE id=?')
                 ->execute([$available, $id]);
        json_response(['success' => true]);
    }

    private function requireStaffOrAdmin(): array
    {
        $payload = $this->auth->staffGuard() ?? $this->auth->guard();
        if (!$payload) {
            json_response(['error' => 'Unauthorized'], 401);
        }
        return $payload;
    }
}
