<?php

declare(strict_types=1);

final class SettingsController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** GET /api/admin/settings/stripe/status — check if Stripe is configured */
    public function stripeStatus(): never
    {
        $this->auth->requireAuth();
        $key = $_ENV['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY') ?: '';
        $webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: '';
        $pubKey = $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? getenv('STRIPE_PUBLISHABLE_KEY') ?: '';

        $isLive      = str_starts_with($key, 'sk_live_');
        $isTest      = str_starts_with($key, 'sk_test_') && $key !== 'sk_test_placeholder';
        $configured  = $isLive || $isTest;
        $webhookOk   = !empty($webhookSecret) && $webhookSecret !== 'whsec_placeholder';

        json_response([
            'configured'        => $configured,
            'mode'              => $isLive ? 'live' : ($isTest ? 'test' : 'not_set'),
            'webhook_configured'=> $webhookOk,
            'publishable_key'   => $configured ? ($pubKey ?: null) : null,
        ]);
    }

    /** GET /api/admin/settings/menu/default_category */
    public function getDefaultCategory(): never
    {
        $this->ensureTable();
        $stmt = $this->db->prepare('SELECT v FROM app_settings WHERE k = ? LIMIT 1');
        $stmt->execute(['default_menu_category']);
        $val = $stmt->fetchColumn();
        if (!$val) {
            json_response(['default_category' => null]);
        }
        $id = (int)$val;
        $stmt = $this->db->prepare('SELECT * FROM menu_categories WHERE id = ?');
        $stmt->execute([$id]);
        $cat = $stmt->fetch();
        json_response(['default_category' => $cat ?: null]);
    }

    /** PUT /api/admin/settings/menu/default_category */
    public function setDefaultCategory(): never
    {
        $this->auth->requireAuth();
        $data = request_body();
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        if ($id <= 0) json_response(['error' => 'Invalid id'], 422);

        $stmt = $this->db->prepare('SELECT id FROM menu_categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) json_response(['error' => 'Category not found'], 404);

        $this->ensureTable();
        $up = $this->db->prepare('INSERT INTO app_settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
        $up->execute(['default_menu_category', (string)$id]);
        json_response(['default_category_id' => $id]);
    }

    private function ensureTable(): void
    {
        $this->db->exec("CREATE TABLE IF NOT EXISTS app_settings (
            k VARCHAR(100) PRIMARY KEY,
            v TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }
}
