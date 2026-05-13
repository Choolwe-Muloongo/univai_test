<?php

namespace App\Support;

class SessionToken
{
    public static function issue(array $user): string
    {
        $payload = [
            'user' => $user,
            'exp' => now()->addHours(12)->timestamp,
        ];

        $encodedPayload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $encodedPayload, self::signingKey());

        return $encodedPayload.'.'.$signature;
    }

    public static function userFromToken(?string $token): ?array
    {
        if (!$token || !str_contains($token, '.')) {
            return null;
        }

        [$encodedPayload, $signature] = explode('.', $token, 2);
        $expectedSignature = hash_hmac('sha256', $encodedPayload, self::signingKey());

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $decoded = json_decode(self::base64UrlDecode($encodedPayload), true);

        if (!is_array($decoded) || ($decoded['exp'] ?? 0) < time()) {
            return null;
        }

        $user = $decoded['user'] ?? null;

        return is_array($user) && !empty($user['id']) ? $user : null;
    }

    private static function signingKey(): string
    {
        return (string) config('app.key');
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/')) ?: '';
    }
}
