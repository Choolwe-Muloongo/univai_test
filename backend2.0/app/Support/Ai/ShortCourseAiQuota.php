<?php

namespace App\Support\Ai;

use App\Models\ShortCourseEnrollment;
use Illuminate\Support\Facades\Cache;

class ShortCourseAiQuota
{
    public static function checkAndIncrement(int $studentId, ?string $courseId = null): array
    {
        $enrollment = null;
        if ($courseId) {
            $enrollment = ShortCourseEnrollment::where('student_id', $studentId)
                ->where('short_course_id', $courseId)
                ->first();
        }

        $hourlyLimit = (int) ($enrollment?->hourly_ai_quota ?? 0);
        $dailyLimit = (int) ($enrollment?->daily_ai_quota ?? 0);

        if ($enrollment && method_exists($enrollment, 'hasActiveAiAccess') && !$enrollment->hasActiveAiAccess()) {
            $hourlyLimit = 0;
            $dailyLimit = 0;
        }

        $hourKey = 'short_course_ai_hour:' . $studentId . ':' . now()->format('YmdH');
        $dayKey = 'short_course_ai_day:' . $studentId . ':' . now()->format('Ymd');
        $cooldownKey = 'short_course_ai_cooldown:' . $studentId . ':' . ($courseId ?: 'general');

        if (Cache::has($cooldownKey)) {
            return [
                'allowed' => false,
                'cooldownMinutes' => 30,
                'hourlyLimit' => $hourlyLimit,
                'dailyLimit' => $dailyLimit,
                'hourlyUsed' => (int) Cache::get($hourKey, 0),
                'dailyUsed' => (int) Cache::get($dayKey, 0),
            ];
        }

        $hourUsed = (int) Cache::get($hourKey, 0);
        $dayUsed = (int) Cache::get($dayKey, 0);

        if ($hourlyLimit <= 0 || $dailyLimit <= 0 || $hourUsed >= $hourlyLimit || $dayUsed >= $dailyLimit) {
            if ($hourlyLimit > 0 && $hourUsed >= $hourlyLimit && $dayUsed < $dailyLimit) {
                Cache::put($cooldownKey, true, now()->addMinutes(30));
            }
            return [
                'allowed' => false,
                'cooldownMinutes' => ($hourlyLimit > 0 && $hourUsed >= $hourlyLimit && $dayUsed < $dailyLimit) ? 30 : 0,
                'hourlyLimit' => $hourlyLimit,
                'dailyLimit' => $dailyLimit,
                'hourlyUsed' => $hourUsed,
                'dailyUsed' => $dayUsed,
            ];
        }

        Cache::put($hourKey, $hourUsed + 1, now()->addHour());
        Cache::put($dayKey, $dayUsed + 1, now()->endOfDay());

        return [
            'allowed' => true,
            'hourlyLimit' => $hourlyLimit,
            'dailyLimit' => $dailyLimit,
            'hourlyUsed' => $hourUsed + 1,
            'dailyUsed' => $dayUsed + 1,
        ];
    }
}
