<?php

namespace App\Observers;

use App\Models\Application;
use App\Support\Admissions\AdmissionLetterGenerator;

class ApplicationObserver
{
    public function saved(Application $application): void
    {
        if ($application->status !== 'admitted') {
            return;
        }

        app(AdmissionLetterGenerator::class)->ensureAdmissionLetter($application);
    }
}
