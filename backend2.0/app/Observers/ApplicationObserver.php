<?php

namespace App\Observers;

use App\Models\Application;
use App\Support\Admissions\AdmissionsDocumentGenerator;

class ApplicationObserver
{
    public function saved(Application $application): void
    {
        $generator = app(AdmissionsDocumentGenerator::class);

        if (in_array($application->status, ['offer_sent', 'approved', 'admitted'], true)) {
            $generator->ensureOfferLetter($application);
        }

        if ($application->status === 'admitted') {
            $generator->ensureAdmissionLetter($application);
        }
    }
}
