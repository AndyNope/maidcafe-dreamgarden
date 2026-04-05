<?php

declare(strict_types=1);

final class PostController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** GET /api/posts  — public: only published; admin: all */
    public function index(): never
    {
        $isAdmin = $this->auth->guard() !== null;

        if ($isAdmin) {
            $stmt = $this->db->query(
                'SELECT id, title, title_en, slug, excerpt, excerpt_en, cover_image, published, published_at, created_at, updated_at
                 FROM posts ORDER BY created_at DESC'
            );
        } else {
            $stmt = $this->db->query(
                'SELECT id, title, title_en, slug, excerpt, excerpt_en, cover_image, published_at, created_at
                 FROM posts WHERE published = 1 ORDER BY published_at DESC'
            );
        }

        json_response($stmt->fetchAll());
    }

    /** GET /api/posts/{slug} */
    public function show(string $slug): never
    {
        $isAdmin = $this->auth->guard() !== null;

        if ($isAdmin) {
            $stmt = $this->db->prepare(
                'SELECT * FROM posts WHERE slug = ? LIMIT 1'
            );
        } else {
            $stmt = $this->db->prepare(
                'SELECT * FROM posts WHERE slug = ? AND published = 1 LIMIT 1'
            );
        }

        $stmt->execute([$slug]);
        $post = $stmt->fetch();

        if (!$post) json_response(['error' => 'Not found'], 404);

        json_response($post);
    }

    /** POST /api/posts — admin */
    public function store(): never
    {
        $this->auth->requireAuth();
        $data = $this->validate(request_body());

        $slug = $this->uniqueSlug($data['slug'] ?: slugify($data['title']));

        $stmt = $this->db->prepare(
            'INSERT INTO posts (title, title_en, slug, excerpt, excerpt_en, content, content_en, cover_image, published, published_at)
             VALUES (:title, :title_en, :slug, :excerpt, :excerpt_en, :content, :content_en, :cover_image, :published, :published_at)'
        );

        $stmt->execute([
            'title'        => $data['title'],
            'title_en'     => $data['title_en'],
            'slug'         => $slug,
            'excerpt'      => $data['excerpt'],
            'excerpt_en'   => $data['excerpt_en'],
            'content'      => $data['content'],
            'content_en'   => $data['content_en'],
            'cover_image'  => $data['cover_image'],
            'published'    => $data['published'] ? 1 : 0,
            'published_at' => $data['published'] ? date('Y-m-d H:i:s') : null,
        ]);

        $id = (int)$this->db->lastInsertId();
        json_response($this->findById($id), 201);
    }

    /** PUT /api/posts/{id} — admin */
    public function update(int $id): never
    {
        $this->auth->requireAuth();
        $this->findById($id) ?: json_response(['error' => 'Not found'], 404);

        $data = $this->validate(request_body());
        $slug = $this->uniqueSlug($data['slug'] ?: slugify($data['title']), $id);

        $stmt = $this->db->prepare(
            'UPDATE posts SET title=:title, title_en=:title_en, slug=:slug, excerpt=:excerpt, excerpt_en=:excerpt_en,
             content=:content, content_en=:content_en, cover_image=:cover_image, published=:published,
             published_at=IF(:published=1 AND published=0, NOW(), published_at)
             WHERE id=:id'
        );

        $stmt->execute([
            'title'       => $data['title'],
            'title_en'    => $data['title_en'],
            'slug'        => $slug,
            'excerpt'     => $data['excerpt'],
            'excerpt_en'  => $data['excerpt_en'],
            'content'     => $data['content'],
            'content_en'  => $data['content_en'],
            'cover_image' => $data['cover_image'],
            'published'   => $data['published'] ? 1 : 0,
            'id'          => $id,
        ]);

        json_response($this->findById($id));
    }

    /** DELETE /api/posts/{id} — admin */
    public function destroy(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);
        json_response(['message' => 'Deleted']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validate(array $body): array
    {
        if (empty(trim($body['title'] ?? ''))) {
            json_response(['error' => 'Title is required'], 422);
        }

        return [
            'title'       => trim($body['title']),
            'title_en'    => trim($body['title_en'] ?? ''),
            'slug'        => slugify(trim($body['slug'] ?? '')),
            'excerpt'     => trim($body['excerpt'] ?? ''),
            'excerpt_en'  => trim($body['excerpt_en'] ?? ''),
            'content'     => trim($body['content'] ?? ''),
            'content_en'  => trim($body['content_en'] ?? ''),
            'cover_image' => trim($body['cover_image'] ?? ''),
            'published'   => (bool)($body['published'] ?? false),
        ];
    }

    private function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM posts WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    private function uniqueSlug(string $base, ?int $excludeId = null): string
    {
        $slug  = $base ?: 'post';
        $count = 0;
        do {
            $candidate = $count === 0 ? $slug : "{$slug}-{$count}";
            $stmt = $this->db->prepare(
                'SELECT id FROM posts WHERE slug = ?' . ($excludeId !== null ? ' AND id != ?' : '') . ' LIMIT 1'
            );
            $params = $excludeId !== null ? [$candidate, $excludeId] : [$candidate];
            $stmt->execute($params);
            $exists = (bool)$stmt->fetch();
            $count++;
        } while ($exists);

        return $candidate;
    }
}
