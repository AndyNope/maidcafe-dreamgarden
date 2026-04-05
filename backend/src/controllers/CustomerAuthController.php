<?php

declare(strict_types=1);

final class CustomerAuthController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    // ── Register ──────────────────────────────────────────────────────────────

    /** POST /api/customer/register */
    public function register(): never
    {
        $body      = request_body();
        $email     = strtolower(trim($body['email'] ?? ''));
        $password  = $body['password'] ?? '';
        $firstName = substr(trim($body['first_name'] ?? ''), 0, 100);
        $lastName  = substr(trim($body['last_name']  ?? ''), 0, 100);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(['error' => 'Ungültige E-Mail-Adresse'], 400);
        }
        if (strlen($password) < 8) {
            json_response(['error' => 'Passwort muss mindestens 8 Zeichen haben'], 400);
        }

        // Check duplicate
        $stmt = $this->db->prepare('SELECT id FROM customers WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            json_response(['error' => 'E-Mail-Adresse bereits registriert'], 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare(
            'INSERT INTO customers (email, password_hash, first_name, last_name) VALUES (?,?,?,?)'
        );
        $stmt->execute([$email, $hash, $firstName, $lastName]);
        $customerId = (int)$this->db->lastInsertId();

        // Send verification email
        $token = bin2hex(random_bytes(32));
        $this->db->prepare(
            "INSERT INTO email_verifications (customer_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))"
        )->execute([$customerId, $token]);

        try {
            Mailer::sendVerification($email, $firstName ?: $email, $token);
        } catch (Throwable) {
            // Non-fatal in dev / misconfigured SMTP
        }

        json_response(['message' => 'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.'], 201);
    }

    // ── Verify email ──────────────────────────────────────────────────────────

    /** GET /api/customer/verify?token=xxx */
    public function verify(): never
    {
        $token = trim($_GET['token'] ?? '');
        if (!$token) json_response(['error' => 'Token fehlt'], 400);

        $stmt = $this->db->prepare(
            'SELECT v.customer_id FROM email_verifications v
              WHERE v.token = ? AND v.expires_at > NOW() LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if (!$row) {
            json_response(['error' => 'Link ungültig oder abgelaufen'], 400);
        }

        $this->db->prepare('UPDATE customers SET email_verified = 1 WHERE id = ?')
                 ->execute([$row['customer_id']]);
        $this->db->prepare('DELETE FROM email_verifications WHERE customer_id = ?')
                 ->execute([$row['customer_id']]);

        json_response(['message' => 'E-Mail erfolgreich bestätigt. Du kannst dich jetzt einloggen.']);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /** POST /api/customer/login */
    public function login(): never
    {
        $body  = request_body();
        $email = strtolower(trim($body['email'] ?? ''));
        $pass  = $body['password'] ?? '';

        $result = $this->auth->customerLogin($email, $pass);

        if ($result === null) {
            json_response(['error' => 'Ungültige Anmeldedaten'], 401);
        }
        if ($result === 'unverified') {
            json_response(['error' => 'Bitte bestätige zuerst deine E-Mail-Adresse'], 403);
        }

        setcookie('dg_customer_token', $result, [
            'expires'  => time() + 60 * 60 * 24 * 30,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        json_response(['token' => $result]);
    }

    /** POST /api/customer/logout */
    public function logout(): never
    {
        setcookie('dg_customer_token', '', ['expires' => time() - 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        json_response(['success' => true]);
    }

    // ── Me ────────────────────────────────────────────────────────────────────

    /** GET /api/customer/me */
    public function me(): never
    {
        $payload = $this->auth->requireCustomer();
        $stmt    = $this->db->prepare(
            'SELECT id, email, first_name, last_name, email_verified, created_at FROM customers WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$payload['sub']]);
        $customer = $stmt->fetch();
        if (!$customer) json_response(['error' => 'Not found'], 404);
        json_response($customer);
    }

    /** PUT /api/customer/me */
    public function updateMe(): never
    {
        $payload   = $this->auth->requireCustomer();
        $body      = request_body();
        $firstName = substr(trim($body['first_name'] ?? ''), 0, 100);
        $lastName  = substr(trim($body['last_name']  ?? ''), 0, 100);

        $this->db->prepare('UPDATE customers SET first_name=?, last_name=? WHERE id=?')
                 ->execute([$firstName, $lastName, $payload['sub']]);

        json_response(['success' => true]);
    }

    /** POST /api/customer/change-password */
    public function changePassword(): never
    {
        $payload    = $this->auth->requireCustomer();
        $body       = request_body();
        $oldPassword = $body['old_password'] ?? '';
        $newPassword = $body['new_password'] ?? '';

        if (strlen($newPassword) < 8) {
            json_response(['error' => 'Das neue Passwort muss mindestens 8 Zeichen haben'], 400);
        }

        $stmt = $this->db->prepare('SELECT password_hash FROM customers WHERE id = ?');
        $stmt->execute([$payload['sub']]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($oldPassword, $hash)) {
            json_response(['error' => 'Aktuelles Passwort falsch'], 401);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $this->db->prepare('UPDATE customers SET password_hash=? WHERE id=?')
                 ->execute([$newHash, $payload['sub']]);

        json_response(['success' => true]);
    }

    // ── Addresses ─────────────────────────────────────────────────────────────

    /** GET /api/customer/addresses */
    public function listAddresses(): never
    {
        $payload = $this->auth->requireCustomer();
        $stmt    = $this->db->prepare('SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id ASC');
        $stmt->execute([$payload['sub']]);
        json_response($stmt->fetchAll());
    }

    /** POST /api/customer/addresses */
    public function storeAddress(): never
    {
        $payload = $this->auth->requireCustomer();
        $d       = $this->validateAddress(request_body());

        if ($d['is_default']) {
            $this->db->prepare('UPDATE customer_addresses SET is_default=0 WHERE customer_id=?')
                     ->execute([$payload['sub']]);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO customer_addresses
             (customer_id, label, first_name, last_name, street, city, postal_code, country, is_default)
             VALUES (?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            $payload['sub'], $d['label'], $d['first_name'], $d['last_name'],
            $d['street'], $d['city'], $d['postal_code'], $d['country'], $d['is_default'],
        ]);
        $id   = (int)$this->db->lastInsertId();
        $stmt = $this->db->prepare('SELECT * FROM customer_addresses WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch(), 201);
    }

    /** PUT /api/customer/addresses/{id} */
    public function updateAddress(int $id): never
    {
        $payload = $this->auth->requireCustomer();
        $d       = $this->validateAddress(request_body());

        // Ownership check
        $stmt = $this->db->prepare('SELECT customer_id FROM customer_addresses WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row || (int)$row['customer_id'] !== (int)$payload['sub']) {
            json_response(['error' => 'Not found'], 404);
        }

        if ($d['is_default']) {
            $this->db->prepare('UPDATE customer_addresses SET is_default=0 WHERE customer_id=?')
                     ->execute([$payload['sub']]);
        }

        $this->db->prepare(
            'UPDATE customer_addresses SET label=?,first_name=?,last_name=?,street=?,city=?,postal_code=?,country=?,is_default=? WHERE id=?'
        )->execute([$d['label'],$d['first_name'],$d['last_name'],$d['street'],$d['city'],$d['postal_code'],$d['country'],$d['is_default'],$id]);

        $stmt = $this->db->prepare('SELECT * FROM customer_addresses WHERE id = ?');
        $stmt->execute([$id]);
        json_response($stmt->fetch());
    }

    /** DELETE /api/customer/addresses/{id} */
    public function deleteAddress(int $id): never
    {
        $payload = $this->auth->requireCustomer();
        $stmt    = $this->db->prepare('SELECT customer_id FROM customer_addresses WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row || (int)$row['customer_id'] !== (int)$payload['sub']) {
            json_response(['error' => 'Not found'], 404);
        }
        $this->db->prepare('DELETE FROM customer_addresses WHERE id = ?')->execute([$id]);
        json_response(['success' => true]);
    }

    // ── Password reset (request) ──────────────────────────────────────────────

    /** POST /api/customer/forgot-password */
    public function forgotPassword(): never
    {
        $email = strtolower(trim(request_body()['email'] ?? ''));
        $stmt  = $this->db->prepare('SELECT id, first_name FROM customers WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $customer = $stmt->fetch();

        // Always return success to avoid user enumeration
        if ($customer) {
            $token = bin2hex(random_bytes(32));
            $this->db->prepare(
                "INSERT INTO password_resets (customer_id, token, expires_at)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
                 ON DUPLICATE KEY UPDATE token=VALUES(token), expires_at=VALUES(expires_at)"
            )->execute([$customer['id'], $token]);
            try {
                Mailer::sendPasswordReset($email, $customer['first_name'] ?? $email, $token);
            } catch (Throwable) {}
        }

        json_response(['message' => 'Falls diese E-Mail existiert, wurde ein Link verschickt.']);
    }

    /** POST /api/customer/reset-password */
    public function resetPassword(): never
    {
        $body    = request_body();
        $token   = trim($body['token'] ?? '');
        $newPass = $body['password'] ?? '';

        if (strlen($newPass) < 8) {
            json_response(['error' => 'Passwort muss mindestens 8 Zeichen haben'], 400);
        }

        $stmt = $this->db->prepare(
            'SELECT customer_id FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Link ungültig oder abgelaufen'], 400);

        $hash = password_hash($newPass, PASSWORD_BCRYPT);
        $this->db->prepare('UPDATE customers SET password_hash=? WHERE id=?')
                 ->execute([$hash, $row['customer_id']]);
        $this->db->prepare('DELETE FROM password_resets WHERE customer_id=?')
                 ->execute([$row['customer_id']]);

        json_response(['message' => 'Passwort erfolgreich geändert.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validateAddress(array $d): array
    {
        return [
            'label'       => substr(trim($d['label']       ?? 'Home'), 0, 100),
            'first_name'  => substr(trim($d['first_name']  ?? ''), 0, 100),
            'last_name'   => substr(trim($d['last_name']   ?? ''), 0, 100),
            'street'      => substr(trim($d['street']      ?? ''), 0, 200),
            'city'        => substr(trim($d['city']        ?? ''), 0, 100),
            'postal_code' => substr(trim($d['postal_code'] ?? ''), 0, 20),
            'country'     => substr(trim($d['country']     ?? 'Schweiz'), 0, 100),
            'is_default'  => empty($d['is_default']) ? 0 : 1,
        ];
    }
}
