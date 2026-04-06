<?php

declare(strict_types=1);

define('ROOT_DIR', dirname(__DIR__));

require_once ROOT_DIR . '/src/helpers.php';
require_once ROOT_DIR . '/src/Database.php';
require_once ROOT_DIR . '/src/JWT.php';
require_once ROOT_DIR . '/src/Auth.php';
require_once ROOT_DIR . '/src/Router.php';

// ── Composer autoload (Stripe, PHPMailer) ─────────────────────────────────────
if (file_exists(ROOT_DIR . '/vendor/autoload.php')) {
    require_once ROOT_DIR . '/vendor/autoload.php';
}

// ── Controllers ───────────────────────────────────────────────────────────────
require_once ROOT_DIR . '/src/Mailer.php';
require_once ROOT_DIR . '/src/controllers/AuthController.php';
require_once ROOT_DIR . '/src/controllers/PostController.php';
require_once ROOT_DIR . '/src/controllers/MemberController.php';
require_once ROOT_DIR . '/src/controllers/MenuController.php';
require_once ROOT_DIR . '/src/controllers/UploadController.php';
require_once ROOT_DIR . '/src/controllers/ProductController.php';
require_once ROOT_DIR . '/src/controllers/ShopOrderController.php';
require_once ROOT_DIR . '/src/controllers/CustomerAuthController.php';
require_once ROOT_DIR . '/src/controllers/StaffAuthController.php';
require_once ROOT_DIR . '/src/controllers/TableController.php';
require_once ROOT_DIR . '/src/controllers/EventOrderController.php';
require_once ROOT_DIR . '/src/controllers/KitchenController.php';
require_once ROOT_DIR . '/src/controllers/RevenueController.php';
require_once ROOT_DIR . '/src/controllers/UserManagerController.php';
require_once ROOT_DIR . '/src/controllers/SettingsController.php';

// ── CORS ────────────────────────────────────────────────────────────────────
$allowedOrigin = $_ENV['CORS_ORIGIN'] ?? getenv('CORS_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: {$allowedOrigin}");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
set_exception_handler(function (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
});

// Stripe webhook needs raw body — skip DB init for that route early
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
if ($uri === '/api/shop/webhook') {
    try { $db = Database::getInstance(); } catch (Throwable) { $db = null; }
    if ($db) {
        $auth    = new Auth($db);
        $shopCtrl = new ShopOrderController($db, $auth);
        $shopCtrl->webhook();
    }
    exit;
}

try {
    $db = Database::getInstance();
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['error' => 'Database unavailable. Check DB credentials in .htaccess or .env'], JSON_UNESCAPED_UNICODE);
    exit;
}

$auth   = new Auth($db);
$router = new Router();

// ── Instantiate controllers ───────────────────────────────────────────────────
$authCtrl        = new AuthController($db, $auth);
$postCtrl        = new PostController($db, $auth);
$memberCtrl      = new MemberController($db, $auth);
$menuCtrl        = new MenuController($db, $auth);
$uploadCtrl      = new UploadController($auth);
$productCtrl     = new ProductController($db, $auth);
$shopCtrl        = new ShopOrderController($db, $auth);
$customerCtrl    = new CustomerAuthController($db, $auth);
$staffCtrl       = new StaffAuthController($db, $auth);
$tableCtrl       = new TableController($db, $auth);
$eventOrderCtrl  = new EventOrderController($db, $auth);
$kitchenCtrl     = new KitchenController($db, $auth);
$revenueCtrl     = new RevenueController($db, $auth);
$userMgrCtrl     = new UserManagerController($db, $auth);
$settingsCtrl    = new SettingsController($db, $auth);

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Admin auth ────────────────────────────────────────────────────────────────
$router->post('/api/auth/login',  fn() => $authCtrl->login());
$router->post('/api/auth/logout', fn() => $authCtrl->logout());
$router->get( '/api/auth/me',     fn() => $authCtrl->me());

// ── Customer auth ─────────────────────────────────────────────────────────────
$router->post('/api/customer/register',       fn() => $customerCtrl->register());
$router->get( '/api/customer/verify',         fn() => $customerCtrl->verify());
$router->post('/api/customer/login',          fn() => $customerCtrl->login());
$router->post('/api/customer/logout',         fn() => $customerCtrl->logout());
$router->get( '/api/customer/me',             fn() => $customerCtrl->me());
$router->put( '/api/customer/me',             fn() => $customerCtrl->updateMe());
$router->post('/api/customer/change-password',fn() => $customerCtrl->changePassword());
$router->post('/api/customer/forgot-password',fn() => $customerCtrl->forgotPassword());
$router->post('/api/customer/reset-password', fn() => $customerCtrl->resetPassword());
$router->get( '/api/customer/addresses',      fn() => $customerCtrl->listAddresses());
$router->post('/api/customer/addresses',      fn() => $customerCtrl->storeAddress());
$router->put( '/api/customer/addresses/{id}', fn($p) => $customerCtrl->updateAddress((int)$p['id']));
$router->delete('/api/customer/addresses/{id}', fn($p) => $customerCtrl->deleteAddress((int)$p['id']));
$router->get( '/api/customer/orders',         fn() => $shopCtrl->myOrders());
$router->get( '/api/customer/orders/{id}',    fn($p) => $shopCtrl->myOrderDetail((int)$p['id']));

// ── Staff auth ────────────────────────────────────────────────────────────────
$router->post('/api/staff/login',  fn() => $staffCtrl->login());
$router->post('/api/staff/logout', fn() => $staffCtrl->logout());
$router->get( '/api/staff/me',     fn() => $staffCtrl->me());

// ── Posts — public ────────────────────────────────────────────────────────────
$router->get('/api/posts',       fn() => $postCtrl->index());
$router->get('/api/posts/{slug}',fn($p) => $postCtrl->show($p['slug']));

// ── Posts — admin ─────────────────────────────────────────────────────────────
$router->post(  '/api/posts',      fn() => $postCtrl->store());
$router->put(   '/api/posts/{id}', fn($p) => $postCtrl->update((int)$p['id']));
$router->delete('/api/posts/{id}', fn($p) => $postCtrl->destroy((int)$p['id']));

// ── Members ───────────────────────────────────────────────────────────────────
$router->get('/api/members',          fn() => $memberCtrl->index());
$router->post(  '/api/members',       fn() => $memberCtrl->store());
$router->put(   '/api/members/{id}',  fn($p) => $memberCtrl->update((int)$p['id']));
$router->delete('/api/members/{id}',  fn($p) => $memberCtrl->destroy((int)$p['id']));

// ── Menu ──────────────────────────────────────────────────────────────────────
$router->get('/api/menu',            fn() => $menuCtrl->index());
$router->get('/api/menu/categories', fn() => $menuCtrl->categories());
$router->post(  '/api/menu',              fn() => $menuCtrl->storeItem());
$router->put(   '/api/menu/{id}',         fn($p) => $menuCtrl->updateItem((int)$p['id']));
$router->delete('/api/menu/{id}',         fn($p) => $menuCtrl->destroyItem((int)$p['id']));
$router->post(  '/api/menu/categories',   fn() => $menuCtrl->storeCategory());
$router->put(   '/api/menu/categories/{id}', fn($p) => $menuCtrl->updateCategory((int)$p['id']));
$router->delete('/api/menu/categories/{id}', fn($p) => $menuCtrl->destroyCategory((int)$p['id']));

// ── Shop — products ───────────────────────────────────────────────────────────
$router->get('/api/products',        fn() => $productCtrl->index());
$router->get('/api/products/{id}',   fn($p) => $productCtrl->show((int)$p['id']));

// ── Shop — admin products ─────────────────────────────────────────────────────
$router->get(   '/api/admin/products',      fn() => $productCtrl->adminIndex());
$router->post(  '/api/admin/products',      fn() => $productCtrl->store());
$router->put(   '/api/admin/products/{id}', fn($p) => $productCtrl->update((int)$p['id']));
$router->delete('/api/admin/products/{id}', fn($p) => $productCtrl->destroy((int)$p['id']));

// ── Shop — checkout + orders ──────────────────────────────────────────────────
$router->post('/api/shop/checkout',             fn() => $shopCtrl->createCheckout());
$router->get( '/api/admin/shop/orders',         fn() => $shopCtrl->adminIndex());
$router->get( '/api/admin/shop/orders/{id}',    fn($p) => $shopCtrl->adminShow((int)$p['id']));
$router->put( '/api/admin/shop/orders/{id}/status', fn($p) => $shopCtrl->updateStatus((int)$p['id']));

// ── Tables ────────────────────────────────────────────────────────────────────
$router->get(   '/api/tables',            fn() => $tableCtrl->index());
$router->get(   '/api/admin/tables',      fn() => $tableCtrl->adminIndex());
$router->post(  '/api/admin/tables',      fn() => $tableCtrl->store());
$router->put(   '/api/admin/tables/{id}', fn($p) => $tableCtrl->update((int)$p['id']));
$router->delete('/api/admin/tables/{id}', fn($p) => $tableCtrl->destroy((int)$p['id']));

// ── Event orders (staff app) ──────────────────────────────────────────────────
$router->get(  '/api/app/orders',                   fn() => $eventOrderCtrl->index());
$router->get(  '/api/app/orders/{id}',              fn($p) => $eventOrderCtrl->show((int)$p['id']));
$router->post( '/api/app/orders',                   fn() => $eventOrderCtrl->store());
$router->post( '/api/app/orders/{id}/items',        fn($p) => $eventOrderCtrl->addItems((int)$p['id']));
$router->delete('/api/app/orders/{id}/items/{itemId}', fn($p) => $eventOrderCtrl->removeItem((int)$p['id'], (int)$p['itemId']));
$router->put(  '/api/app/orders/{id}/close',        fn($p) => $eventOrderCtrl->closeOrder((int)$p['id']));
$router->put(  '/api/app/orders/{id}/cancel',       fn($p) => $eventOrderCtrl->cancelOrder((int)$p['id']));
$router->post( '/api/app/orders/{id}/bills',        fn($p) => $eventOrderCtrl->createBills((int)$p['id']));
$router->get(  '/api/app/orders/{id}/bills',        fn($p) => $eventOrderCtrl->getBills((int)$p['id']));
$router->put(  '/api/app/bills/{billId}/pay',       fn($p) => $eventOrderCtrl->markBillPaid((int)$p['billId']));

// ── Kitchen ───────────────────────────────────────────────────────────────────
$router->get('/api/kitchen/items',                         fn() => $kitchenCtrl->items());
$router->put('/api/kitchen/items/{id}/status',             fn($p) => $kitchenCtrl->updateItemStatus((int)$p['id']));
$router->put('/api/kitchen/menu-items/{id}/sold-out',      fn($p) => $kitchenCtrl->toggleMenuItemAvailability((int)$p['id']));

// ── Admin: Revenue ────────────────────────────────────────────────────────────
$router->get('/api/admin/revenue', fn() => $revenueCtrl->index());

// ── Admin: User management ────────────────────────────────────────────────────
$router->get(   '/api/admin/customers',                     fn() => $userMgrCtrl->listCustomers());
$router->delete('/api/admin/customers/{id}',                fn($p) => $userMgrCtrl->deleteCustomer((int)$p['id']));
$router->get(   '/api/admin/staff',                         fn() => $userMgrCtrl->listStaff());
$router->post(  '/api/admin/staff/{id}/credentials',        fn($p) => $userMgrCtrl->setStaffCredentials((int)$p['id']));
$router->delete('/api/admin/staff/{id}/credentials',        fn($p) => $userMgrCtrl->revokeStaffCredentials((int)$p['id']));

// ── Admin settings: menu default category ───────────────────────────────────
$router->get('/api/admin/settings/menu/default_category', fn() => $settingsCtrl->getDefaultCategory());
$router->put('/api/admin/settings/menu/default_category', fn() => $settingsCtrl->setDefaultCategory());
$router->put(   '/api/admin/members/{id}/role',             fn($p) => $userMgrCtrl->updateMemberRole((int)$p['id']));

// ── File upload ───────────────────────────────────────────────────────────────
$router->post('/api/upload', fn() => $uploadCtrl->upload());

// ── Dispatch ─────────────────────────────────────────────────────────────────
$router->dispatch(
    $_SERVER['REQUEST_METHOD'],
    $uri
);
