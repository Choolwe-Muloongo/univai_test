<?php

namespace App\Support\Pricing;

use App\Models\Course;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ShortCourseAccessPlans
{
    public const MIN_ENTRY_ACCESS_HOURS = 336;
    public const MONTHLY_ACCESS_HOURS = 720;
    public const ENTRY_HOURLY_AI_QUOTA = 40;
    public const ENTRY_DAILY_AI_QUOTA = 240;

    public static function initialAccessEndsAt(?Course $course = null)
    {
        $hours = max((int) ($course?->duration_hours ?? 0), self::MIN_ENTRY_ACCESS_HOURS);
        return now()->addHours($hours);
    }

    public static function initialEntryAccess(?Course $course = null): array
    {
        $accessHours = max((int) ($course?->duration_hours ?? 0), self::MIN_ENTRY_ACCESS_HOURS);

        return [
            'accessHours' => $accessHours,
            'aiHours' => $accessHours,
            'hourlyAiQuota' => self::ENTRY_HOURLY_AI_QUOTA,
            'dailyAiQuota' => self::ENTRY_DAILY_AI_QUOTA,
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
        return $plans[$code] ?? $plans['access_only'];
    }

    private static function databasePlans(string $currency): array
    {
        try {
            if (!Schema::hasTable('short_course_access_plans')) {
                return [];
            }

            return DB::table('short_course_access_plans')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->mapWithKeys(fn ($plan) => [
                    $plan->code => [
                        'code' => $plan->code,
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
        } catch (\Throwable) {
            return [];
        }
    }

    private static function fallbackPlans(string $currency): array
    {
        return [
            'access_only' => [
                'code' => 'access_only',
                'name' => 'Monthly Course Access Extension',
                'amount' => 20,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => 0,
                'hourlyAiQuota' => 0,
                'dailyAiQuota' => 0,
                'certificateIncluded' => false,
            ],
            'access_ai' => [
                'code' => 'access_ai',
                'name' => 'Monthly Course and AI Access',
                'amount' => 50,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 40,
                'dailyAiQuota' => 240,
                'certificateIncluded' => false,
            ],
            'premium_certificate' => [
                'code' => 'premium_certificate',
                'name' => 'Monthly Premium Course, AI and Certificate',
                'amount' => 250,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 100,
                'dailyAiQuota' => 600,
                'certificateIncluded' => true,
            ],
            'elite_certificate' => [
                'code' => 'elite_certificate',
                'name' => 'Monthly Elite Course, AI and Certificate',
                'amount' => 350,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 180,
                'dailyAiQuota' => 1000,
                'certificateIncluded' => true,
            ],
        ];
    }
}