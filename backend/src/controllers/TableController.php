<?php

declare(strict_types=1);

final class TableController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** GET /api/tables — staff + admin */
    public function index(): never
    {
        $payload = $this->auth->staffGuard() ?? $this->auth->guard();
        if (!$payload) json_response(['error' => 'Unauthorized'], 401);

        $stmt = $this->db->query(
            'SELECT t.*,
                    eo.id       AS open_order_id,
                    eo.status   AS open_order_status,
                    m.name      AS staff_name
               FROM restaurant_tables t
               LEFT JOIN event_orders eo
                      ON eo.table_id = t.id AND eo.status = "open"
               LEFT JOIN members m ON m.id = eo.staff_id
              WHERE t.active = 1
              ORDER BY t.sort_order ASC, t.number ASC'
        );
        json_response($stmt->fetchAll());
    }

    /** GET /api/admin/tables — admin all */
    public function adminIndex(): never
    {
        $this->auth->requireAuth();
        $stmt = $this->db->query('SELECT * FROM restaurant_tables ORDER BY sort_order ASC, number ASC');
        json_response($stmt->fetchAll());
    }

    /** POST /api/admin/tables */
    public function store(): never
    {
        $this->auth->requireAuth();
        $d = $this->validate(request_body());

        $stmt = $this->db->prepare(
            'INSERT INTO restaurant_tables (number, name, seats, active, sort_order)
             VALUES (:number, :name, :seats, :active, :sort_order)'
        );
        $stmt->execute($d);
        $id = (int)$this->db->lastInsertId();
        json_response($this->findById($id), 201);
    }

    /** PUT /api/admin/tables/{id} */
    public function update(int $id): never
    {
        $this->auth->requireAuth();
        $d = $this->validate(request_body());

        $this->db->prepare(
            'UPDATE restaurant_tables SET number=:number, name=:name, seats=:seats, active=:active, sort_order=:sort_order WHERE id=:id'
        )->execute([...$d, 'id' => $id]);

        json_response($this->findById($id));
    }

    /** DELETE /api/admin/tables/{id} */
    public function destroy(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM restaurant_tables WHERE id = ?')->execute([$id]);
        json_response(['success' => true]);
    }

    private function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM restaurant_tables WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    private function validate(array $d): array
    {
        return [
            'number'     => (int)($d['number'] ?? 0),
            'name'       => substr(trim((string)($d['name'] ?? '')), 0, 100) ?: null,
            'seats'      => max(1, (int)($d['seats']  ?? 4)),
            'active'     => empty($d['active']) ? 0 : 1,
            'sort_order' => (int)($d['sort_order'] ?? 0),
        ];
    }
}
