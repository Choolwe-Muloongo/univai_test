<?php

namespace App\Support;

use App\Models\StudentEntitlement;
use App\Models\User;
use Illuminate\Support\Arr;

class StudentAccess
{
    public const TIER_FREE = 'free-learning';
    public const TIER_CERTIFICATE = 'certificate';
    public const TIER_PREMIUM = 'premium';
    public const TIER_PROGRAMME = 'programme';

    public const ENTITLEMENT_SHORT_COURSE = 'short-course-access';
    public const ENTITLEMENT_CERTIFICATE = 'certificate-access';
    public const ENTITLEMENT_PREMIUM = 'premium-access';
    public const ENTITLEMENT_PROGRAMME = 'programme-access';

    public const ROLE_FREE = 'free-student';
    public const ROLE_CERTIFICATE = 'certificate-student';
    public const ROLE_PREMIUM = 'premium-student';
    public const ROLE_PROGRAMME = 'programme-student';
    public const ROLE_ENROLLED = 'enrolled';
    public const ROLE_FREEMIUM = 'freemium-student';
    public const ROLE_STUDENT = 'student';

    public static function tierFromRole(?string $role): string
    {
        return match ($role) {
            self::ROLE_CERTIFICATE => self::TIER_CERTIFICATE,
            self::ROLE_PREMIUM => self::TIER_PREMIUM,
            self::ROLE_PROGRAMME, self::ROLE_ENROLLED => self::TIER_PROGRAMME,
            default => self::TIER_FREE,
        };
    }

    public static function roleFromTier(?string $tier): string
    {
        return match ($tier) {
            self::TIER_CERTIFICATE => self::ROLE_CERTIFICATE,
            self::TIER_PREMIUM => self::ROLE_PREMIUM,
            self::TIER_PROGRAMME => self::ROLE_PROGRAMME,
            default => self::ROLE_FREE,
        };
    }

    public static function entitlementsForTier(?string $tier): array
    {
        return match ($tier) {
            self::TIER_CERTIFICATE => [self::ENTITLEMENT_SHORT_COURSE, self::ENTITLEMENT_CERTIFICATE],
            self::TIER_PREMIUM => [self::ENTITLEMENT_SHORT_COURSE, self::ENTITLEMENT_CERTIFICATE, self::ENTITLEMENT_PREMIUM],
            self::TIER_PROGRAMME => [self::ENTITLEMENT_SHORT_COURSE, self::ENTITLEMENT_CERTIFICATE, self::ENTITLEMENT_PREMIUM, self::ENTITLEMENT_PROGRAMME],
            default => [self::ENTITLEMENT_SHORT_COURSE],
        };
    }

    public static function cashbackEligible(?string $tier): bool
    {
        return in_array($tier, [self::TIER_PREMIUM, self::TIER_PROGRAMME], true);
    }

    public static function sessionPayload(array $user): array
    {
        $role = Arr::get($user, 'role');
        $tier = Arr::get($user, 'accessTier') ?? self::tierFromRole($role);
        $entitlements = Arr::get($user, 'entitlements') ?? self::entitlementsForTier($tier);

        $user['accessTier'] = $tier;
        $user['entitlements'] = array_values(array_unique($entitlements));
        $user['cashbackEligible'] = self::cashbackEligible($tier);

        return $user;
    }

    public static function syncUserEntitlements(User $user, ?string $tier, string $source = 'tier-sync'): array
    {
        $entitlements = self::entitlementsForTier($tier);

        foreach ($entitlements as $type) {
            StudentEntitlement::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'type' => $type,
                ],
                [
                    'status' => 'active',
                    'source' => $source,
                    'starts_at' => now(),
                    'expires_at' => null,
                ]
            );
        }

        StudentEntitlement::query()
            ->where('user_id', $user->id)
            ->whereNotIn('type', $entitlements)
            ->update(['status' => 'revoked']);

        return $entitlements;
    }

    public static function userHasEntitlement(?User $user, string $type, ?array $sessionUser = null): bool
    {
        if ($sessionUser && in_array($type, $sessionUser['entitlements'] ?? [], true)) {
            return true;
        }

        if (!$user) {
            $tier = $sessionUser ? ($sessionUser['accessTier'] ?? self::tierFromRole($sessionUser['role'] ?? null)) : null;
            return in_array($type, self::entitlementsForTier($tier), true);
        }

        return StudentEntitlement::query()
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->exists();
    }
}
