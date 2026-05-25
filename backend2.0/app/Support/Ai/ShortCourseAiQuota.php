<?php

namespace App\Support\Ai;

use App\Models\ShortCourseEnrollment;
use Illuminate\Support\Facades\Cache;

class ShortCourseAiQuota
{
    public static function check(int $studentId, ?string $courseId = null): array
    {
        $limits = self::limitsFor($studentId, $courseId);
        $hourKey = self::hourKey($studentId, $courseId);
        $dayKey = self::dayKey($studentId, $courseId);
        $cooldownKey = self::cooldownKey($studentId, $courseId);

        if (Cache::has($cooldownKey)) {
            return self::payload(false, 30, $limits['hourlyLimit'], $limits['dailyLimit'], (int) Cache::get($hourKey, 0), (int) Cache::get($dayKey, 0));
        }

        $hourUsed = (int) Cache::get($hourKey, 0);
        $dayUsed = (int) Cache::get($dayKey, 0);

        if ($limits['hourlyLimit'] <= 0 || $limits['dailyLimit'] <= 0 || $hourUsed >= $limits['hourlyLimit'] || $dayUsed >= $limits['dailyLimit']) {
            if ($limits['hourlyLimit'] > 0 && $hourUsed >= $limits['hourlyLimit'] && $dayUsed < $limits['dailyLimit']) {
                Cache::put($cooldownKey, true, now()->addMinutes(30));
            }
            return self::payload(false, ($limits['hourlyLimit'] > 0 && $hourUsed >= $limits['hourlyLimit'] && $dayUsed < $limits['dailyLimit']) ? 30 : 0, $limits['hourlyLimit'], $limits['dailyLimit'], $hourUsed, $dayUsed);
        }

        return self::payload(true, 0, $limits['hourlyLimit'], $limits['dailyLimit'], $hourUsed, $dayUsed);
    }

    public static function consume(int $studentId, ?string $courseId = null): array
    {
        $check = self::check($studentId, $courseId);
        if (!$check['allowed']) {
            return $check;
        }

        $hourKey = self::hourKey($studentId, $courseId);
        $dayKey = self::dayKey($studentId, $courseId);
        $hourUsed = (int) Cache::get($hourKey, 0) + 1;
        $dayUsed = (int) Cache::get($dayKey, 0) + 1;

        Cache::put($hourKey, $hourUsed, now()->addHour());
        Cache::put($dayKey, $dayUsed, now()->endOfDay());

        return [
            ...$check,
            'hourlyUsed' => $hourUsed,
            'dailyUsed' => $dayUsed,
        ];
    }

    public static function checkAndIncrement(int $studentId, ?string $courseId = null): array
    {
        return self::consume($studentId, $courseId);
    }

    private static function limitsFor(int $studentId, ?string $courseId = null): array
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

        return ['hourlyLimit' => $hourlyLimit, 'dailyLimit' => $dailyLimit];
    }

    private static function payload(bool $allowed, int $cooldownMinutes, int $hourlyLimit, int $dailyLimit, int $hourlyUsed, int $dailyUsed): array
    {
        return [
            'allowed' => $allowed,
            'cooldownMinutes' => $cooldownMinutes,
            'hourlyLimit' => $hourlyLimit,
            'dailyLimit' => $dailyLimit,
            'hourlyUsed' => $hourlyUsed,
            'dailyUsed' => $dailyUsed,
        ];
    }

    private static function hourKey(int $studentId, ?string $courseId = null): string
    {
        return 'short_course_ai_hour:' . $studentId . ':' . ($courseId ?: 'general') . ':' . now()->format('YmdH');
    }

    private static function dayKey(int $studentId, ?string $courseId = null): string
    {
        return 'short_course_ai_day:' . $studentId . ':' . ($courseId ?: 'general') . ':' . now()->format('Ymd');
    }

    private static function cooldownKey(int $studentId, ?string $courseId = null): string
    {
        return 'short_course_ai_cooldown:' . $studentId . ':' . ($courseId ?: 'general');
    }
}
