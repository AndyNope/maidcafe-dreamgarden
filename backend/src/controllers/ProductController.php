<?php

declare(strict_types=1);

final class ProductController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    // ── Public ────────────────────────────────────────────────────────────────

    /** GET /api/products */
    public function index(): never
    {
        $stmt = $this->db->query(
            'SELECT id, name, name_en, description, description_en,
                    price, stock, delivery_days, delivery_cost, image,
                    available, sort_order
               FROM products
              WHERE available = 1
              ORDER BY sort_order ASC, id ASC'
        );
        json_response($stmt->fetchAll());
    }

    /** GET /api/products/{id} */
    public function show(int $id): never
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, name_en, description, description_en,
                    price, stock, delivery_days, delivery_cost, image,
                    available, sort_order
               FROM products WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) {
            json_response(['error' => 'Not found'], 404);
        }
        json_response($product);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /** GET /api/admin/products — all including unavailable */
    public function adminIndex(): never
    {
        $this->auth->requireAuth();
        $stmt = $this->db->query(
            'SELECT * FROM products ORDER BY sort_order ASC, id ASC'
        );
        json_response($stmt->fetchAll());
    }

    /** POST /api/admin/products */
    public function store(): never
    {
        $this->auth->requireAuth();
        $d = $this->validate(request_body());

        $stmt = $this->db->prepare(
            'INSERT INTO products
             (name, name_en, description, description_en, price, stock,
              delivery_days, delivery_cost, image, available, sort_order)
             VALUES
             (:name, :name_en, :description, :description_en, :price, :stock,
              :delivery_days, :delivery_cost, :image, :available, :sort_order)'
        );
        $stmt->execute($d);
        json_response($this->findById((int)$this->db->lastInsertId()), 201);
    }

    /** PUT /api/admin/products/{id} */
    public function update(int $id): never
    {
        $this->auth->requireAuth();
        $d = $this->validate(request_body());

        $stmt = $this->db->prepare(
            'UPDATE products SET
             name=:name, name_en=:name_en, description=:description,
             description_en=:description_en, price=:price, stock=:stock,
             delivery_days=:delivery_days, delivery_cost=:delivery_cost,
             image=:image, available=:available, sort_order=:sort_order
             WHERE id=:id'
        );
        $stmt->execute([...$d, 'id' => $id]);
        json_response($this->findById($id));
    }

    /** DELETE /api/admin/products/{id} */
    public function destroy(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
        json_response(['success' => true]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    private function validate(array $data): array
    {
        return [
            'name'          => substr(trim($data['name'] ?? ''), 0, 200),
            'name_en'       => substr(trim($data['name_en'] ?? ''), 0, 200) ?: null,
            'description'   => trim($data['description'] ?? '') ?: null,
            'description_en'=> trim($data['description_en'] ?? '') ?: null,
            'price'         => max(0, (float)($data['price'] ?? 0)),
            'stock'         => max(0, (int)($data['stock'] ?? 0)),
            'delivery_days' => max(0, (int)($data['delivery_days'] ?? 7)),
            'delivery_cost' => max(0, (float)($data['delivery_cost'] ?? 0)),
            'image'         => substr(trim($data['image'] ?? ''), 0, 500) ?: null,
            'available'     => empty($data['available']) ? 0 : 1,
            'sort_order'    => (int)($data['sort_order'] ?? 0),
        ];
    }
}
