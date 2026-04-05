<?php

declare(strict_types=1);

final class AuthController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    public function login(): never
    {
        $body = request_body();
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        if ($username === '' || $password === '') {
            json_response(['error' => 'Username and password required'], 400);
        }

        $token = $this->auth->login($username, $password);

        if ($token === null) {
            json_response(['error' => 'Invalid credentials'], 401);
        }

        json_response(['token' => $token]);
    }

    public function logout(): never
    {
        // JWT is stateless — client discards the token
        json_response(['message' => 'Logged out']);
    }

    public function me(): never
    {
        $payload = $this->auth->requireAuth();
        json_response(['username' => $payload['user'], 'role' => $payload['role']]);
    }
}
