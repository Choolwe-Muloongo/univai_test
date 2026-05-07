<?php

namespace App\Support;

use App\Models\AcademicEntitlement;
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
    public const ENTITLEMENT_COHORT = 'cohort-access';
    public const ENTITLEMENT_EXAM_CLINIC = 'exam-clinic-access';

    public const SCOPE_SHORT_COURSE = 'short_course';
    public const SCOPE_CERTIFICATE = 'certificate';
    public const SCOPE_PREMIUM = 'premium';
    public const SCOPE_PROGRAMME = 'programme';
    public const SCOPE_COHORT = 'cohort';
    public const SCOPE_EXAM_CLINIC = 'exam_clinic';

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

    public static function supportedScopes(): array
    {
        return [
            self::SCOPE_SHORT_COURSE,
            self::SCOPE_CERTIFICATE,
            self::SCOPE_PREMIUM,
            self::SCOPE_PROGRAMME,
            self::SCOPE_COHORT,
            self::SCOPE_EXAM_CLINIC,
        ];
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

        foreach ($entitlements as $code) {
            AcademicEntitlement::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'code' => $code,
                    'scope_type' => null,
                    'scope_id' => null,
                ],
                [
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => null,
                    'metadata' => ['source' => $source],
                ]
            );
        }

        AcademicEntitlement::query()
            ->where('user_id', $user->id)
            ->whereNull('scope_type')
            ->whereNull('scope_id')
            ->whereNotIn('code', $entitlements)
            ->update(['status' => 'revoked']);

        return $entitlements;
    }

    public static function activeEntitlementsForUser(User $user): array
    {
        return AcademicEntitlement::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>', now());
            })
            ->pluck('code')
            ->all();
    }

    public static function userHasEntitlement(?User $user, string $code, ?array $sessionUser = null): bool
    {
        if (!$user) {
            if ($sessionUser && in_array($code, $sessionUser['entitlements'] ?? [], true)) {
                return true;
            }

            $tier = $sessionUser ? ($sessionUser['accessTier'] ?? self::tierFromRole($sessionUser['role'] ?? null)) : null;
            return in_array($code, self::entitlementsForTier($tier), true);
        }

        return AcademicEntitlement::query()
            ->where('user_id', $user->id)
            ->where('code', $code)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>', now());
            })
            ->exists();
    }
}
