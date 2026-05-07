<?php

namespace App\Support\Branding;

use App\Models\Application;

class UnivAiBranding
{
    public static function brand(): array
    {
        return config('univai.brand', []);
    }

    public static function name(): string
    {
        return (string) (self::brand()['name'] ?? 'UnivAI');
    }

    public static function supportEmail(): string
    {
        return (string) (self::brand()['support_email'] ?? 'support@univai.edu');
    }

    public static function admissionsEmail(): string
    {
        return (string) (self::brand()['admissions_email'] ?? self::supportEmail());
    }

    public static function publicUrl(): string
    {
        return rtrim((string) (self::brand()['public_url'] ?? config('app.url')), '/');
    }

    public static function publicFooter(): string
    {
        return implode("\n", [
            self::name(),
            (string) (self::brand()['tagline'] ?? 'AI-powered higher education for every learner'),
            'Support: ' . self::supportEmail(),
            'Portal: ' . self::publicUrl(),
        ]);
    }

    public static function admissionsSignature(): string
    {
        return implode("\n", [
            'Sincerely,',
            self::name() . ' Admissions',
            self::admissionsEmail(),
        ]);
    }

    public static function offerLetterText(Application $application): string
    {
        $body = $application->offer_letter_message
            ?? "Congratulations! We are pleased to offer you admission into {$application->program_id}.";

        return implode("\n", [
            self::name() . ' Offer Letter',
            (string) (self::brand()['legal_name'] ?? self::name()),
            '',
            'Reference: ' . $application->reference,
            'Issued: ' . now()->toFormattedDateString(),
            '',
            "Dear {$application->full_name},",
            '',
            $body,
            '',
            "Program: {$application->program_id}",
            "Delivery mode: {$application->delivery_mode}",
            "Intake: {$application->intake_id}",
            '',
            'Please log in to your admissions portal to accept this offer and continue enrollment.',
            self::publicUrl() . '/admissions/status',
            '',
            self::admissionsSignature(),
            '',
            self::publicFooter(),
        ]);
    }

    public static function emailSubject(string $subject): string
    {
        return '[' . self::name() . '] ' . $subject;
    }
}
