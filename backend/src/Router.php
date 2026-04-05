<?php

declare(strict_types=1);

final class Router
{
    /** @var array{method:string, pattern:string, handler:callable}[] */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    private function add(string $method, string $path, callable $handler): void
    {
        // Convert {param} to named capture groups
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
        $this->routes[] = [
            'method'  => $method,
            'pattern' => "#^{$pattern}$#",
            'handler' => $handler,
        ];
    }

    public function dispatch(string $method, string $uri): never
    {
        // Strip query string just in case
        $path = strtok($uri, '?') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== strtoupper($method)) continue;
            if (!preg_match($route['pattern'], $path, $matches)) continue;

            // Extract only named parameters
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            ($route['handler'])($params);
            exit;
        }

        json_response(['error' => 'Not found'], 404);
    }
}
