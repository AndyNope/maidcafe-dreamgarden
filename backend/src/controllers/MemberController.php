<?php

declare(strict_types=1);

final class MemberController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** GET /api/members */
    public function index(): never
    {
        $isAdmin = $this->auth->guard() !== null;
        $where   = $isAdmin ? '' : 'WHERE active = 1';

        $stmt = $this->db->query(
            "SELECT id, name, name_jp, role, description, image, theme_color, active, sort_order
             FROM members {$where} ORDER BY sort_order ASC, id ASC"
        );

        json_response($stmt->fetchAll());
    }

    /** POST /api/members — admin */
    public function store(): never
    {
        $this->auth->requireAuth();
        $data = $this->validate(request_body());

        $stmt = $this->db->prepare(
            'INSERT INTO members (name, name_jp, role, description, image, theme_color, active, sort_order)
             VALUES (:name, :name_jp, :role, :description, :image, :theme_color, :active, :sort_order)'
        );
        $stmt->execute($data);

        $id = (int)$this->db->lastInsertId();
        json_response($this->findById($id), 201);
    }

    /** PUT /api/members/{id} — admin */
    public function update(int $id): never
    {
        $this->auth->requireAuth();
        $this->findById($id) ?: json_response(['error' => 'Not found'], 404);

        $data       = $this->validate(request_body());
        $data['id'] = $id;

        $stmt = $this->db->prepare(
            'UPDATE members SET name=:name, name_jp=:name_jp, role=:role, description=:description,
             image=:image, theme_color=:theme_color, active=:active, sort_order=:sort_order
             WHERE id=:id'
        );
        $stmt->execute($data);

        json_response($this->findById($id));
    }

    /** DELETE /api/members/{id} — admin */
    public function destroy(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM members WHERE id = ?')->execute([$id]);
        json_response(['message' => 'Deleted']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validate(array $body): array
    {
        if (empty(trim($body['name'] ?? ''))) {
            json_response(['error' => 'Name is required'], 422);
        }

        $allowedRoles = ['maid', 'butler', 'manager'];
        $role         = $body['role'] ?? 'maid';
        if (!in_array($role, $allowedRoles, true)) {
            json_response(['error' => 'Invalid role'], 422);
        }

        return [
            'name'        => trim($body['name']),
            'name_jp'     => trim($body['name_jp'] ?? ''),
            'role'        => $role,
            'description' => trim($body['description'] ?? ''),
            'image'       => trim($body['image'] ?? ''),
            'theme_color' => preg_match('/^#[0-9A-Fa-f]{6}$/', $body['theme_color'] ?? '') ? $body['theme_color'] : '#FF6B9D',
            'active'      => (int)(bool)($body['active'] ?? true),
            'sort_order'  => (int)($body['sort_order'] ?? 0),
        ];
    }

    private function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM members WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
