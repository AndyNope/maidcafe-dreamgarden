<?php

declare(strict_types=1);

final class MenuController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** GET /api/menu — full menu grouped by category */
    public function index(): never
    {
        $isAdmin = $this->auth->guard() !== null;
        $where   = $isAdmin ? '' : 'AND i.available = 1';

        $stmt = $this->db->query(
            "SELECT c.id AS cat_id, c.name AS cat_name, c.name_jp AS cat_name_jp,
                    c.icon AS cat_icon, c.sort_order AS cat_sort,
                    i.id, i.name, i.name_jp, i.description, i.price,
                    i.image, i.available, i.sort_order
             FROM menu_categories c
             LEFT JOIN menu_items i ON i.category_id = c.id {$where}
             ORDER BY c.sort_order ASC, i.sort_order ASC, i.id ASC"
        );

        $rows   = $stmt->fetchAll();
        $result = [];

        foreach ($rows as $row) {
            $catId = $row['cat_id'];
            if (!isset($result[$catId])) {
                $result[$catId] = [
                    'id'      => $catId,
                    'name'    => $row['cat_name'],
                    'name_jp' => $row['cat_name_jp'],
                    'icon'    => $row['cat_icon'],
                    'items'   => [],
                ];
            }
            if ($row['id'] !== null) {
                $result[$catId]['items'][] = [
                    'id'          => $row['id'],
                    'name'        => $row['name'],
                    'name_jp'     => $row['name_jp'],
                    'description' => $row['description'],
                    'price'       => (float)$row['price'],
                    'image'       => $row['image'],
                    'available'   => (bool)$row['available'],
                    'sort_order'  => $row['sort_order'],
                ];
            }
        }

        json_response(array_values($result));
    }

    /** GET /api/menu/categories */
    public function categories(): never
    {
        $stmt = $this->db->query(
            'SELECT * FROM menu_categories ORDER BY sort_order ASC'
        );
        json_response($stmt->fetchAll());
    }

    // ── Items ─────────────────────────────────────────────────────────────────

    /** POST /api/menu — admin */
    public function storeItem(): never
    {
        $this->auth->requireAuth();
        $data = $this->validateItem(request_body());

        $stmt = $this->db->prepare(
            'INSERT INTO menu_items (category_id, name, name_jp, description, price, image, available, sort_order)
             VALUES (:category_id, :name, :name_jp, :description, :price, :image, :available, :sort_order)'
        );
        $stmt->execute($data);

        $id = (int)$this->db->lastInsertId();
        json_response($this->findItemById($id), 201);
    }

    /** PUT /api/menu/{id} — admin */
    public function updateItem(int $id): never
    {
        $this->auth->requireAuth();
        $this->findItemById($id) ?: json_response(['error' => 'Not found'], 404);

        $data       = $this->validateItem(request_body());
        $data['id'] = $id;

        $stmt = $this->db->prepare(
            'UPDATE menu_items SET category_id=:category_id, name=:name, name_jp=:name_jp,
             description=:description, price=:price, image=:image, available=:available,
             sort_order=:sort_order WHERE id=:id'
        );
        $stmt->execute($data);

        json_response($this->findItemById($id));
    }

    /** DELETE /api/menu/{id} — admin */
    public function destroyItem(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM menu_items WHERE id = ?')->execute([$id]);
        json_response(['message' => 'Deleted']);
    }

    // ── Categories ────────────────────────────────────────────────────────────

    /** POST /api/menu/categories — admin */
    public function storeCategory(): never
    {
        $this->auth->requireAuth();
        $data = $this->validateCategory(request_body());

        $stmt = $this->db->prepare(
            'INSERT INTO menu_categories (name, name_jp, icon, sort_order) VALUES (:name, :name_jp, :icon, :sort_order)'
        );
        $stmt->execute($data);

        $id   = (int)$this->db->lastInsertId();
        $stmt = $this->db->prepare('SELECT * FROM menu_categories WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch(), 201);
    }

    /** PUT /api/menu/categories/{id} — admin */
    public function updateCategory(int $id): never
    {
        $this->auth->requireAuth();
        $data       = $this->validateCategory(request_body());
        $data['id'] = $id;

        $stmt = $this->db->prepare(
            'UPDATE menu_categories SET name=:name, name_jp=:name_jp, icon=:icon, sort_order=:sort_order WHERE id=:id'
        );
        $stmt->execute($data);

        $stmt = $this->db->prepare('SELECT * FROM menu_categories WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch());
    }

    /** DELETE /api/menu/categories/{id} — admin */
    public function destroyCategory(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM menu_categories WHERE id = ?')->execute([$id]);
        json_response(['message' => 'Deleted']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validateItem(array $body): array
    {
        if (empty(trim($body['name'] ?? ''))) {
            json_response(['error' => 'Name is required'], 422);
        }
        $price = filter_var($body['price'] ?? 0, FILTER_VALIDATE_FLOAT);
        if ($price === false || $price < 0) {
            json_response(['error' => 'Valid price is required'], 422);
        }

        return [
            'category_id' => $body['category_id'] ? (int)$body['category_id'] : null,
            'name'        => trim($body['name']),
            'name_jp'     => trim($body['name_jp'] ?? ''),
            'description' => trim($body['description'] ?? ''),
            'price'       => round($price, 2),
            'image'       => trim($body['image'] ?? ''),
            'available'   => (int)(bool)($body['available'] ?? true),
            'sort_order'  => (int)($body['sort_order'] ?? 0),
        ];
    }

    private function validateCategory(array $body): array
    {
        if (empty(trim($body['name'] ?? ''))) {
            json_response(['error' => 'Name is required'], 422);
        }

        return [
            'name'       => trim($body['name']),
            'name_jp'    => trim($body['name_jp'] ?? ''),
            'icon'       => trim($body['icon'] ?? ''),
            'sort_order' => (int)($body['sort_order'] ?? 0),
        ];
    }

    private function findItemById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM menu_items WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
