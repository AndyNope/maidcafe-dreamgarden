<?php

declare(strict_types=1);

final class Auth
{
    private PDO    $db;
    private string $secret;

    public function __construct(PDO $db)
    {
        $this->db     = $db;
        $this->secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: 'fallback_secret';
    }

    /**
     * Verify credentials and return a signed JWT on success.
     */
    public function login(string $username, string $password): ?string
    {
        // Allow a single ENV-configured admin account (no DB required)
        $envUser = $_ENV['ADMIN_USERNAME']     ?? getenv('ADMIN_USERNAME')     ?: null;
        $envHash = $_ENV['ADMIN_PASSWORD_HASH'] ?? getenv('ADMIN_PASSWORD_HASH') ?: null;

        if ($envUser && $envHash && $username === $envUser) {
            if (!password_verify($password, $envHash)) return null;
            return JWT::encode(['sub' => 0, 'user' => $username, 'role' => 'admin'], $this->secret);
        }

        // DB-based users
        $stmt = $this->db->prepare('SELECT id, password_hash FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) return null;

        return JWT::encode(['sub' => $user['id'], 'user' => $username, 'role' => 'admin'], $this->secret);
    }

    /**
     * Validate the Bearer token from the Authorization header.
     * Returns the decoded payload or null.
     */
    public function guard(): ?array
    {
        // Apache may pass the header under different keys depending on module setup
        $header = $_SERVER['HTTP_AUTHORIZATION']
               ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
               ?? (function_exists('getallheaders') ? (getallheaders()['Authorization'] ?? '') : '')
               ?? '';

        // If the Authorization header is not available (common with nginx+PHP-FPM
        // when fastcgi_param HTTP_AUTHORIZATION is not set), allow a compatibility
        // fallback from a cookie named `dg_token` set by the frontend.
        if (!str_starts_with($header, 'Bearer ')) {
            $cookieToken = $_COOKIE['dg_token'] ?? null;
            if ($cookieToken) {
                $token = $cookieToken;
                return JWT::decode($token, $this->secret);
            }
            return null;
        }

        $token = substr($header, 7);
        return JWT::decode($token, $this->secret);
    }

    /**
     * Require auth; abort with 401 if not authenticated.
     */
    public function requireAuth(): array
    {
        $payload = $this->guard();
        if ($payload === null) {
            json_response(['error' => 'Unauthorized'], 401);
        }
        return $payload;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Staff auth (members table)
    // ─────────────────────────────────────────────────────────────────────────

    public function staffLogin(string $email, string $password): ?string
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, role, staff_password_hash FROM members
              WHERE staff_email = ? AND staff_password_hash IS NOT NULL AND active = 1
              LIMIT 1'
        );
        $stmt->execute([strtolower($email)]);
        $member = $stmt->fetch();

        if (!$member || !password_verify($password, $member['staff_password_hash'])) return null;

        $this->db->prepare('UPDATE members SET staff_last_login = NOW() WHERE id = ?')
                 ->execute([$member['id']]);

        return JWT::encode([
            'sub'  => $member['id'],
            'name' => $member['name'],
            'role' => $member['role'],
            'type' => 'staff',
        ], $this->secret);
    }

    public function staffGuard(): ?array
    {
        $payload = $this->guard();
        if ($payload && ($payload['type'] ?? '') === 'staff') {
            return $payload;
        }
        // Check dedicated staff cookie
        $cookieToken = $_COOKIE['dg_staff_token'] ?? null;
        if ($cookieToken) {
            $decoded = JWT::decode($cookieToken, $this->secret);
            if ($decoded && ($decoded['type'] ?? '') === 'staff') {
                return $decoded;
            }
        }
        return null;
    }

    public function requireStaff(): array
    {
        $payload = $this->staffGuard();
        if ($payload === null) {
            json_response(['error' => 'Staff authentication required'], 401);
        }
        return $payload;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Customer auth (customers table)
    // ─────────────────────────────────────────────────────────────────────────

    public function customerLogin(string $email, string $password): ?string
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email_verified FROM customers
              WHERE email = ? LIMIT 1'
        );
        $stmt->execute([strtolower($email)]);
        $customer = $stmt->fetch();

        // Fetch hash separately to avoid timing differences
        if (!$customer) {
            password_verify($password, '$2y$10$dummyhashtopreventtimingattacks');
            return null;
        }

        $hashStmt = $this->db->prepare('SELECT password_hash FROM customers WHERE id = ?');
        $hashStmt->execute([$customer['id']]);
        $hash = $hashStmt->fetchColumn();

        if (!password_verify($password, $hash)) return null;
        if (!$customer['email_verified']) return 'unverified';

        return JWT::encode([
            'sub'        => $customer['id'],
            'first_name' => $customer['first_name'],
            'type'       => 'customer',
        ], $this->secret);
    }

    public function customerGuard(): ?array
    {
        $payload = $this->guard();
        if ($payload && ($payload['type'] ?? '') === 'customer') {
            return $payload;
        }
        $cookieToken = $_COOKIE['dg_customer_token'] ?? null;
        if ($cookieToken) {
            $decoded = JWT::decode($cookieToken, $this->secret);
            if ($decoded && ($decoded['type'] ?? '') === 'customer') {
                return $decoded;
            }
        }
        return null;
    }

    public function requireCustomer(): array
    {
        $payload = $this->customerGuard();
        if ($payload === null) {
            json_response(['error' => 'Customer authentication required'], 401);
        }
        return $payload;
    }
}
