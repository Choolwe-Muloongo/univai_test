<?php

namespace App\Support\Pricing;

use App\Models\Application;
use App\Models\Course;
use App\Models\Program;

class LaunchFeeSchedule
{
    public const DEFAULT_SHORT_COURSE_ENTRY_FEE = 50;
    public const DEFAULT_SHORT_COURSE_ENTRY_CURRENCY = 'ZMW';
    public const DEFAULT_SHORT_COURSE_CERTIFICATE_FEE = 15;
    public const DEFAULT_SHORT_COURSE_CERTIFICATE_CURRENCY = 'USD';
    public const DEFAULT_PROGRAM_APPLICATION_FEE = 100;
    public const DEFAULT_PROGRAM_TUITION_FEE = 650;
    public const DEFAULT_PROGRAM_CURRENCY = 'ZMW';

    public static function shortCourseEntryFee(?Course $course = null): array
    {
        return [
            'amount' => (float) ($course?->price ?? self::DEFAULT_SHORT_COURSE_ENTRY_FEE),
            'currency' => strtoupper($course?->currency ?? self::DEFAULT_SHORT_COURSE_ENTRY_CURRENCY),
        ];
    }

    public static function shortCourseCertificateFee(?Course $course = null): array
    {
        return [
            'amount' => (float) ($course?->certificate_fee ?? self::DEFAULT_SHORT_COURSE_CERTIFICATE_FEE),
            'currency' => strtoupper($course?->certificate_currency ?? self::DEFAULT_SHORT_COURSE_CERTIFICATE_CURRENCY),
        ];
    }

    public static function programApplicationFee(?Program $program = null): array
    {
        return [
            'amount' => (float) ($program?->application_fee ?? self::DEFAULT_PROGRAM_APPLICATION_FEE),
            'currency' => strtoupper($program?->application_currency ?? self::DEFAULT_PROGRAM_CURRENCY),
        ];
    }

    public static function programTuitionFee(?Program $program = null, ?Application $application = null): array
    {
        $mode = $application?->delivery_mode;
        $baseAmount = (float) ($program?->tuition_fee ?? env('DEFAULT_TUITION_FEE', self::DEFAULT_PROGRAM_TUITION_FEE));
        $currency = strtoupper($program?->tuition_currency ?? self::DEFAULT_PROGRAM_CURRENCY);

        return [
            'amount' => round($baseAmount * self::deliveryModeMultiplier($mode), 2),
            'currency' => $currency,
        ];
    }

    public static function deliveryModeMultiplier(?string $mode): float
    {
        return match ($mode) {
            'online', 'software_only', 'software-only' => 1.0,
            'physical' => 1.25,
            'hybrid' => 1.15,
            default => 1.0,
        };
    }
}
