<?php

namespace App\Support\Pricing;

use App\Models\Course;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ShortCourseAccessPlans
{
    public const MIN_ENTRY_ACCESS_HOURS = 336;
    public const MONTHLY_ACCESS_HOURS = 720;
    public const FREE_HOURLY_AI_QUOTA = 5;
    public const FREE_DAILY_AI_QUOTA = 5;

    public static function initialAccessEndsAt(?Course $course = null)
    {
        $hours = max((int) ($course?->duration_hours ?? 0), self::MIN_ENTRY_ACCESS_HOURS);
        return now()->addHours($hours);
    }

    public static function initialEntryAccess(?Course $course = null): array
    {
        $accessHours = max((int) ($course?->duration_hours ?? 0), self::MIN_ENTRY_ACCESS_HOURS);
        $isFree = (float) ($course?->price ?? 0) <= 0 || ($course?->pricing_type === 'free');

        return [
            'code' => $isFree ? 'free_access' : 'starter_access',
            'accessHours' => $accessHours,
            'aiHours' => $isFree ? $accessHours : 0,
            'hourlyAiQuota' => $isFree ? self::FREE_HOURLY_AI_QUOTA : 0,
            'dailyAiQuota' => $isFree ? self::FREE_DAILY_AI_QUOTA : 0,
            'certificateIncluded' => false,
        ];
    }

    public static function plans(?Course $course = null): array
    {
        $currency = strtoupper($course?->currency ?? 'ZMW');
        $databasePlans = self::databasePlans($currency);

        return $databasePlans ?: self::fallbackPlans($currency);
    }

    public static function get(string $code, ?Course $course = null): array
    {
        $plans = self::plans($course);
        $normalized = self::normalizeCode($code);
        return $plans[$normalized] ?? $plans['monthly_access'];
    }

    public static function bundlePlans(string $currency = 'ZMW'): array
    {
        $currency = strtoupper($currency);
        return [
            'starter_2_bundle' => self::bundle('starter_2_bundle', '2-Course Starter Bundle', 2, 55, 336, 0, 0, 0, false, $currency),
            'starter_3_bundle' => self::bundle('starter_3_bundle', '3-Course Starter Bundle', 3, 80, 336, 0, 0, 0, false, $currency),
            'starter_5_bundle' => self::bundle('starter_5_bundle', '5-Course Starter Bundle', 5, 130, 336, 0, 0, 0, false, $currency),
            'monthly_2_bundle' => self::bundle('monthly_2_bundle', '2-Course Monthly Bundle', 2, 90, 720, 0, 0, 0, false, $currency),
            'monthly_3_bundle' => self::bundle('monthly_3_bundle', '3-Course Monthly Bundle', 3, 130, 720, 0, 0, 0, false, $currency),
            'monthly_5_bundle' => self::bundle('monthly_5_bundle', '5-Course Monthly Bundle', 5, 210, 720, 0, 0, 0, false, $currency),
            'ai_lite_2_bundle' => self::bundle('ai_lite_2_bundle', '2-Course AI Lite Bundle', 2, 135, 720, 720, 25, 110, false, $currency),
            'ai_lite_3_bundle' => self::bundle('ai_lite_3_bundle', '3-Course AI Lite Bundle', 3, 195, 720, 720, 35, 150, false, $currency),
            'ai_lite_5_bundle' => self::bundle('ai_lite_5_bundle', '5-Course AI Lite Bundle', 5, 320, 720, 720, 50, 220, false, $currency),
            'ai_plus_2_bundle' => self::bundle('ai_plus_2_bundle', '2-Course AI Plus Bundle', 2, 215, 720, 720, 45, 220, false, $currency),
            'ai_plus_3_bundle' => self::bundle('ai_plus_3_bundle', '3-Course AI Plus Bundle', 3, 315, 720, 720, 60, 300, false, $currency),
            'ai_plus_5_bundle' => self::bundle('ai_plus_5_bundle', '5-Course AI Plus Bundle', 5, 520, 720, 720, 90, 450, false, $currency),
            'certified_2_bundle' => self::bundle('certified_2_bundle', '2-Course Certified Bundle', 2, 450, 720, 720, 70, 350, true, $currency),
            'certified_3_bundle' => self::bundle('certified_3_bundle', '3-Course Certified Bundle', 3, 660, 720, 720, 100, 500, true, $currency),
            'certified_5_bundle' => self::bundle('certified_5_bundle', '5-Course Certified Bundle', 5, 1050, 720, 720, 150, 750, true, $currency),
        ];
    }

    public static function getBundle(string $code, string $currency = 'ZMW'): array
    {
        $bundles = self::bundlePlans($currency);
        return $bundles[$code] ?? $bundles['starter_3_bundle'];
    }

    public static function normalizeCode(string $code): string
    {
        return match ($code) {
            'entry' => 'starter_access',
            'access_only' => 'monthly_access',
            'access_ai' => 'ai_plus',
            'premium_certificate' => 'certified_premium',
            'elite_certificate' => 'certified_elite',
            default => $code,
        };
    }

    private static function databasePlans(string $currency): array
    {
        try {
            if (!Schema::hasTable('short_course_access_plans')) {
                return [];
            }

            $plans = DB::table('short_course_access_plans')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->mapWithKeys(fn ($plan) => [
                    self::normalizeCode($plan->code) => [
                        'code' => self::normalizeCode($plan->code),
                        'name' => $plan->name,
                        'amount' => (float) $plan->amount,
                        'currency' => strtoupper($plan->currency ?: $currency),
                        'accessHours' => (int) $plan->access_hours,
                        'aiHours' => (int) $plan->ai_hours,
                        'hourlyAiQuota' => (int) $plan->hourly_ai_quota,
                        'dailyAiQuota' => (int) $plan->daily_ai_quota,
                        'certificateIncluded' => (bool) $plan->certificate_included,
                    ],
                ])
                ->all();

            $canonical = self::fallbackPlans($currency);
            if (count($plans) < count($canonical)) {
                return $canonical;
            }

            return array_replace($canonical, $plans);
        } catch (\Throwable) {
            return [];
        }
    }

    private static function fallbackPlans(string $currency): array
    {
        return [
            'starter_access' => [
                'code' => 'starter_access',
                'name' => 'Starter Access',
                'amount' => 30,
                'currency' => $currency,
                'accessHours' => self::MIN_ENTRY_ACCESS_HOURS,
                'aiHours' => 0,
                'hourlyAiQuota' => 0,
                'dailyAiQuota' => 0,
                'certificateIncluded' => false,
            ],
            'monthly_access' => [
                'code' => 'monthly_access',
                'name' => 'Monthly Access',
                'amount' => 50,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => 0,
                'hourlyAiQuota' => 0,
                'dailyAiQuota' => 0,
                'certificateIncluded' => false,
            ],
            'ai_lite' => [
                'code' => 'ai_lite',
                'name' => 'AI Lite',
                'amount' => 75,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 15,
                'dailyAiQuota' => 75,
                'certificateIncluded' => false,
            ],
            'ai_plus' => [
                'code' => 'ai_plus',
                'name' => 'AI Plus',
                'amount' => 120,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 30,
                'dailyAiQuota' => 150,
                'certificateIncluded' => false,
            ],
            'ai_scholar' => [
                'code' => 'ai_scholar',
                'name' => 'AI Scholar',
                'amount' => 180,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 40,
                'dailyAiQuota' => 200,
                'certificateIncluded' => false,
            ],
            'certified_premium' => [
                'code' => 'certified_premium',
                'name' => 'Certified Premium',
                'amount' => 250,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 50,
                'dailyAiQuota' => 250,
                'certificateIncluded' => true,
            ],
            'certified_elite' => [
                'code' => 'certified_elite',
                'name' => 'Certified Elite',
                'amount' => 350,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 80,
                'dailyAiQuota' => 400,
                'certificateIncluded' => true,
            ],
        ];
    }

    private static function bundle(string $code, string $name, int $courseCount, float $amount, int $accessHours, int $aiHours, int $hourlyAiQuota, int $dailyAiQuota, bool $certificateIncluded, string $currency): array
    {
        return [
            'code' => $code,
            'name' => $name,
            'courseCount' => $courseCount,
            'amount' => $amount,
            'currency' => $currency,
            'accessHours' => $accessHours,
            'aiHours' => $aiHours,
            'hourlyAiQuota' => $hourlyAiQuota,
            'dailyAiQuota' => $dailyAiQuota,
            'certificateIncluded' => $certificateIncluded,
        ];
    }
}
