<?php

namespace App\Support\Pricing;

use App\Models\Course;

class ShortCourseAccessPlans
{
    public const MIN_ENTRY_ACCESS_HOURS = 336;
    public const MONTHLY_ACCESS_HOURS = 720;

    public static function initialAccessEndsAt(?Course $course = null)
    {
        $hours = max((int) ($course?->duration_hours ?? 0), self::MIN_ENTRY_ACCESS_HOURS);
        return now()->addHours($hours);
    }

    public static function plans(?Course $course = null): array
    {
        $currency = strtoupper($course?->currency ?? 'ZMW');

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
                'hourlyAiQuota' => 40,
                'dailyAiQuota' => 240,
                'certificateIncluded' => true,
            ],
            'elite_certificate' => [
                'code' => 'elite_certificate',
                'name' => 'Monthly Elite Course, AI and Certificate',
                'amount' => 350,
                'currency' => $currency,
                'accessHours' => self::MONTHLY_ACCESS_HOURS,
                'aiHours' => self::MONTHLY_ACCESS_HOURS,
                'hourlyAiQuota' => 40,
                'dailyAiQuota' => 240,
                'certificateIncluded' => true,
            ],
        ];
    }

    public static function get(string $code, ?Course $course = null): array
    {
        $plans = self::plans($course);
        return $plans[$code] ?? $plans['access_only'];
    }
}