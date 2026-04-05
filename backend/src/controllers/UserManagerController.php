<?php

declare(strict_types=1);

final class UserManagerController
{
    public function __construct(private PDO $db, private Auth $auth) {}

    /** GET /api/admin/customers — list all customer accounts */
    public function listCustomers(): never
    {
        $this->auth->requireAuth();
        $stmt = $this->db->query(
            'SELECT id, email, first_name, last_name, email_verified, created_at FROM customers ORDER BY created_at DESC'
        );
        json_response($stmt->fetchAll());
    }

    /** DELETE /api/admin/customers/{id} — delete customer account */
    public function deleteCustomer(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare('DELETE FROM customers WHERE id = ?')->execute([$id]);
        json_response(['success' => true]);
    }

    /** GET /api/admin/staff — list all members with staff login info */
    public function listStaff(): never
    {
        $this->auth->requireAuth();
        $stmt = $this->db->query(
            'SELECT id, name, role, staff_email, staff_last_login, active FROM members ORDER BY sort_order ASC, id ASC'
        );
        json_response($stmt->fetchAll());
    }

    /**
     * POST /api/admin/staff/{id}/credentials
     * Body: { email, password }
     * Sets (or resets) staff login credentials for a member.
     */
    public function setStaffCredentials(int $id): never
    {
        $this->auth->requireAuth();
        $body  = request_body();
        $email = strtolower(trim($body['email'] ?? ''));
        $pass  = $body['password'] ?? '';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(['error' => 'Ungültige E-Mail-Adresse'], 400);
        }
        if (strlen($pass) < 8) {
            json_response(['error' => 'Passwort muss mindestens 8 Zeichen haben'], 400);
        }

        // Unique email check (among other staff)
        $stmt = $this->db->prepare('SELECT id FROM members WHERE staff_email = ? AND id != ? LIMIT 1');
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            json_response(['error' => 'E-Mail bereits von einem anderen Mitglied verwendet'], 409);
        }

        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $this->db->prepare(
            'UPDATE members SET staff_email=?, staff_password_hash=? WHERE id=?'
        )->execute([$email, $hash, $id]);

        json_response(['success' => true]);
    }

    /**
     * DELETE /api/admin/staff/{id}/credentials
     * Revoke staff login access (keep member record).
     */
    public function revokeStaffCredentials(int $id): never
    {
        $this->auth->requireAuth();
        $this->db->prepare(
            'UPDATE members SET staff_email=NULL, staff_password_hash=NULL, staff_last_login=NULL WHERE id=?'
        )->execute([$id]);
        json_response(['success' => true]);
    }

    /**
     * PUT /api/admin/members/{id}/role
     * Body: { role: 'maid'|'butler'|'manager'|'helfer' }
     */
    public function updateMemberRole(int $id): never
    {
        $this->auth->requireAuth();
        $role    = trim(request_body()['role'] ?? '');
        $allowed = ['maid','butler','manager','helfer'];
        if (!in_array($role, $allowed, true)) {
            json_response(['error' => 'Ungültige Rolle'], 400);
        }
        $this->db->prepare('UPDATE members SET role=? WHERE id=?')->execute([$role, $id]);
        json_response(['success' => true]);
    }
}
