<?php

declare(strict_types=1);

define('ROOT_DIR', dirname(__DIR__));

require_once ROOT_DIR . '/src/helpers.php';
require_once ROOT_DIR . '/src/Database.php';
require_once ROOT_DIR . '/src/JWT.php';
require_once ROOT_DIR . '/src/Auth.php';
require_once ROOT_DIR . '/src/Router.php';
require_once ROOT_DIR . '/src/controllers/AuthController.php';
require_once ROOT_DIR . '/src/controllers/PostController.php';
require_once ROOT_DIR . '/src/controllers/MemberController.php';
require_once ROOT_DIR . '/src/controllers/MenuController.php';
require_once ROOT_DIR . '/src/controllers/UploadController.php';

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
$db     = Database::getInstance();
$auth   = new Auth($db);
$router = new Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
$authCtrl   = new AuthController($db, $auth);
$postCtrl   = new PostController($db, $auth);
$memberCtrl = new MemberController($db, $auth);
$menuCtrl   = new MenuController($db, $auth);
$uploadCtrl = new UploadController($auth);

// Auth
$router->post('/api/auth/login',  fn() => $authCtrl->login());
$router->post('/api/auth/logout', fn() => $authCtrl->logout());
$router->get( '/api/auth/me',     fn() => $authCtrl->me());

// Posts — public
$router->get('/api/posts',       fn() => $postCtrl->index());
$router->get('/api/posts/{slug}',fn($p) => $postCtrl->show($p['slug']));

// Posts — admin
$router->post(  '/api/posts',       fn() => $postCtrl->store());
$router->put(   '/api/posts/{id}',  fn($p) => $postCtrl->update((int)$p['id']));
$router->delete('/api/posts/{id}',  fn($p) => $postCtrl->destroy((int)$p['id']));

// Members — public
$router->get('/api/members',      fn() => $memberCtrl->index());

// Members — admin
$router->post(  '/api/members',       fn() => $memberCtrl->store());
$router->put(   '/api/members/{id}',  fn($p) => $memberCtrl->update((int)$p['id']));
$router->delete('/api/members/{id}',  fn($p) => $memberCtrl->destroy((int)$p['id']));

// Menu — public
$router->get('/api/menu',            fn() => $menuCtrl->index());
$router->get('/api/menu/categories', fn() => $menuCtrl->categories());

// Menu — admin
$router->post(  '/api/menu',              fn() => $menuCtrl->storeItem());
$router->put(   '/api/menu/{id}',         fn($p) => $menuCtrl->updateItem((int)$p['id']));
$router->delete('/api/menu/{id}',         fn($p) => $menuCtrl->destroyItem((int)$p['id']));
$router->post(  '/api/menu/categories',   fn() => $menuCtrl->storeCategory());
$router->put(   '/api/menu/categories/{id}', fn($p) => $menuCtrl->updateCategory((int)$p['id']));
$router->delete('/api/menu/categories/{id}', fn($p) => $menuCtrl->destroyCategory((int)$p['id']));

// File upload — admin only
$router->post('/api/upload', fn() => $uploadCtrl->upload());

// ── Dispatch ─────────────────────────────────────────────────────────────────
$router->dispatch(
    $_SERVER['REQUEST_METHOD'],
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/'
);
