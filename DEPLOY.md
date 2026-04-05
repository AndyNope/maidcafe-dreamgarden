Deploy Runbook — MaidCafe DreamGarden
Generated: 2026-04-06

Overview
--------
This repository ships a static frontend build in `frontend/dist/` together with backend PHP files under `dist/api/` after `npm run build` (postbuild copies backend files). The backend requires Composer packages (Stripe, PHPMailer) and a MySQL/MariaDB database.

Pre-deploy checklist
--------------------
- Production `.env` values (on the server or in your deployment tool):
  - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET` (secure random)
  - `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (bcrypt hash)
  - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_NAME`
  - `APP_URL` (frontend URL)
- Backup production DB before applying migrations.

Files to upload
---------------
- Upload `frontend/dist/` root contents to your HTTP document root (e.g., `/var/www/html/`)
  - `index.html`, `assets/`, `api/`, `uploads/`
- Do NOT upload `backend/vendor/` from local (install composer dependencies on the server instead).

Server-side steps (example for Debian/Ubuntu + Apache)
------------------------------------------------------
1. Backup DB:

```bash
mysqldump -u root -p your_db_name > ~/backup_$(date +%F).sql
```

2. Stop webserver (if needed):

```bash
sudo systemctl stop apache2
```

3. Upload frontend `dist/` contents to `/var/www/html/` (or your chosen docroot). Ensure `dist/api/index.php` and `dist/api/.htaccess` are placed under `/var/www/html/api/`.

4. Install PHP dependencies (run in `/var/www/html` where `composer.json` lives). If your deployment used `dist/` copy of backend, you should run composer in the backend source dir (not in `dist/api` unless composer.json is present there). Example:

```bash
cd /var/www/html
# if you have the backend sources and composer.json here:
composer install --no-dev --optimize-autoloader
```

If you don't have composer.json on the server, copy `backend/composer.json` to `/var/www/html` before running `composer install`.

5. Set permissions for uploads directory:

```bash
sudo mkdir -p /var/www/html/uploads
sudo chown -R www-data:www-data /var/www/html/uploads
sudo chmod 775 /var/www/html/uploads
```

6. Import DB migrations

- Put the migration files from `database/migrations/` on the server (e.g. `/tmp/migrations/`). Run them in order. Example:

```bash
mysql -u root -p your_db_name < /tmp/migrations/2026-04-06_add_shop_and_event_tables.sql
mysql -u root -p your_db_name < /tmp/migrations/2026-04-06_add_foreign_keys.sql
```

If you use a migration tool (Flyway, Liquibase, Phinx), prefer that flow.

7. Configure environment (example Apache with envvars in a systemd drop-in or with a .env parsed by PHP).

8. Start webserver:

```bash
sudo systemctl start apache2
```

9. Verify

- Visit the frontend URL and open the Shop, Account pages.
- Check `/api/products` returns JSON.
- Check email sending by triggering a customer registration and inspecting SMTP (or your production SMTP provider logs).
- If using Stripe, test a small payment in test mode.

Rollback
--------
- Restore DB:

```bash
mysql -u root -p your_db_name < ~/backup_YYYY-MM-DD.sql
```

- Restore previous files from your backup or previous release.

Notes
-----
- Never commit secrets to GitHub. Use environment variables or your hosting provider's secret store.
- On containerized deployments (Docker), build an image where `composer install` is run during build; keep vendor out of git.

If you want, I can also generate a simple shell deploy script (`deploy.sh`) that automates the above for a straightforward SSH+rsync target. Tell me the server layout (docroot, DB user) and I will scaffold it.
