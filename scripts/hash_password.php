#!/usr/bin/env php
<?php
/**
 * CLI helper: generate a bcrypt password hash for the admin account.
 *
 * Usage:  php scripts/hash_password.php
 *   Then paste the output into .env as ADMIN_PASSWORD_HASH=<hash>
 */

echo "Enter password: ";
$password = trim(fgets(STDIN));

if (strlen($password) < 8) {
    fwrite(STDERR, "Error: Password must be at least 8 characters.\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
echo "\nADMIN_PASSWORD_HASH={$hash}\n";
echo "\nAdd this line to your .env file.\n";
