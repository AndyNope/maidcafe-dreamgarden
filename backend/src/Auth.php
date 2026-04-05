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
        if (!str_starts_with($header, 'Bearer ')) return null;

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
}
