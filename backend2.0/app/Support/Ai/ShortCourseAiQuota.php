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

        $hourlyLimit = (int) ($enrollment?->hourly_ai_quota ?? 20);
        $dailyLimit = (int) ($enrollment?->daily_ai_quota ?? 120);

        if ($enrollment && method_exists($enrollment, 'hasActiveAiAccess') && !$enrollment->hasActiveAiAccess()) {
            $hourlyLimit = min($hourlyLimit, 10);
            $dailyLimit = min($dailyLimit, 40);
        }

        $hourKey = 'short_course_ai_hour:' . $studentId . ':' . now()->format('YmdH');
        $dayKey = 'short_course_ai_day:' . $studentId . ':' . now()->format('Ymd');

        $hourUsed = (int) Cache::get($hourKey, 0);
        $dayUsed = (int) Cache::get($dayKey, 0);

        if ($hourUsed >= $hourlyLimit || $dayUsed >= $dailyLimit) {
            return [
                'allowed' => false,
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
