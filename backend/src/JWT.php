<?php

declare(strict_types=1);

/**
 * Minimal HS256 JWT implementation — no external dependencies.
 */
final class JWT
{
    private static function b64e(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64d(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'), true) ?: '';
    }

    public static function encode(array $payload, string $secret, int $ttl = 86400): string
    {
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;

        $header    = self::b64e(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload   = self::b64e(json_encode($payload));
        $signature = self::b64e(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));

        return "{$header}.{$payload}.{$signature}";
    }

    /**
     * @return array|null  Returns decoded payload or null on failure / expiry.
     */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $sig] = $parts;

        $expected = self::b64e(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));
        if (!hash_equals($expected, $sig)) return null;

        $data = json_decode(self::b64d($payload), true);
        if (!is_array($data)) return null;
        if (isset($data['exp']) && $data['exp'] < time()) return null;

        return $data;
    }
}
