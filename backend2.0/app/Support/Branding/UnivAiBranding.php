<?php

namespace App\Support\Branding;

use App\Models\Application;
use App\Models\Program;

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

    public static function legalName(): string
    {
        return (string) (self::brand()['legal_name'] ?? self::name());
    }

    public static function tagline(): string
    {
        return 'Unlocking Intelligence';
    }

    public static function documentSubtitle(): string
    {
        return 'AI-powered learning with human-reviewed academic content';
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
            self::name() . ' - ' . self::tagline(),
            self::documentSubtitle(),
            'Support: ' . self::supportEmail(),
            'Portal: ' . self::publicUrl(),
        ]);
    }

    public static function admissionsSignature(): string
    {
        return implode("\n", [
            'Sincerely,',
            self::name() . ' Admissions Office',
            self::admissionsEmail(),
        ]);
    }

    public static function offerLetterText(Application $application): string
    {
        $program = Program::with(['school', 'department', 'qualificationLevel'])->find($application->program_id);
        $programTitle = $program?->title ?? $application->program_id;
        $schoolName = $program?->school?->name;
        $departmentName = $program?->department?->name;
        $qualification = $program?->qualificationLevel?->name;
        $requirements = $program?->admission_requirements;
        $body = $application->offer_letter_message
            ?? "Congratulations. We are pleased to offer you admission into {$programTitle}.";

        return implode("\n", array_filter([
            self::name() . ' Offer Letter',
            self::legalName(),
            self::tagline(),
            '',
            'Reference: ' . $application->reference,
            'Issued: ' . now()->toFormattedDateString(),
            '',
            "Dear {$application->full_name},",
            '',
            $body,
            '',
            'Programme details',
            'Programme: ' . $programTitle,
            $qualification ? 'Qualification: ' . $qualification : null,
            $schoolName ? 'School / Faculty: ' . $schoolName : null,
            $departmentName ? 'Department: ' . $departmentName : null,
            'Delivery mode: ' . ($application->delivery_mode ?: 'To be confirmed'),
            'Intake: ' . ($application->intake_id ?: 'To be confirmed'),
            '',
            $requirements ? 'Published admission requirements: ' . $requirements : null,
            '',
            'This offer is subject to successful verification of submitted documents, payment of applicable fees, and acceptance through the UnivAI admissions portal.',
            'Please log in to your applicant portal to accept this offer and continue enrollment:',
            self::publicUrl() . '/admissions/status',
            '',
            self::admissionsSignature(),
            '',
            self::publicFooter(),
        ], fn ($line) => $line !== null));
    }

    public static function emailSubject(string $subject): string
    {
        return '[' . self::name() . '] ' . $subject;
    }
}
