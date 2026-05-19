<?php

namespace App\Support\Admissions;

use App\Models\Application;
use Illuminate\Support\Facades\Storage;

class AdmissionLetterGenerator
{
    public function ensureAdmissionLetter(Application $application): ?string
    {
        if ($application->status !== 'admitted') {
            return null;
        }

        if (!empty($application->admission_letter_url) && Storage::disk('local')->exists($application->admission_letter_url)) {
            return $application->admission_letter_url;
        }

        $path = app(AdmissionsDocumentGenerator::class)->ensureAdmissionLetter($application);
        if (!$path) {
            return null;
        }

        $application->forceFill([
            'admission_letter_url' => $path,
        ])->saveQuietly();

        return $path;
    }
}
