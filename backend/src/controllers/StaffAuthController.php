<?php

declare(strict_types=1);

final class StaffAuthController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** POST /api/staff/login */
    public function login(): never
    {
        $body  = request_body();
        $email = strtolower(trim($body['email'] ?? ''));
        $pass  = $body['password'] ?? '';

        $token = $this->auth->staffLogin($email, $pass);
        if (!$token) {
            json_response(['error' => 'Ungültige Anmeldedaten'], 401);
        }

        setcookie('dg_staff_token', $token, [
            'expires'  => time() + 60 * 60 * 12, // 12-hour session
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        json_response(['token' => $token]);
    }

    /** POST /api/staff/logout */
    public function logout(): never
    {
        setcookie('dg_staff_token', '', ['expires' => time() - 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        json_response(['success' => true]);
    }

    /** GET /api/staff/me */
    public function me(): never
    {
        $payload = $this->auth->requireStaff();

        $stmt = $this->db->prepare(
            'SELECT id, name, name_jp, role, image FROM members WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$payload['sub']]);
        $member = $stmt->fetch();
        if (!$member) json_response(['error' => 'Not found'], 404);

        json_response($member);
    }
}
