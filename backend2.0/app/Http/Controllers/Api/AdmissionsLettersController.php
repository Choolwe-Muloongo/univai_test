<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Support\Admissions\AdmissionLetterGenerator;
use App\Support\Branding\UnivAiBranding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdmissionsLettersController extends Controller
{
    public function downloadAdmissionLetter(Request $request, AdmissionLetterGenerator $generator)
    {
        $application = $this->resolveApplicationForSession($request);

        if (!$application || $application->status !== 'admitted') {
            return response()->json(['message' => 'Admission letter is not available yet.'], 404);
        }

        $path = $generator->ensureAdmissionLetter($application);

        if (!$path || !Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Admission letter file missing.'], 404);
        }

        return Storage::disk('local')->download($path, UnivAiBranding::name() . '-Admission-Letter.pdf');
    }

    private function resolveApplicationForSession(Request $request): ?Application
    {
        $sessionUser = $request->session()->get('user');

        if (is_array($sessionUser)) {
            if (!empty($sessionUser['id'])) {
                $application = Application::where('user_id', $sessionUser['id'])->latest('created_at')->first();
                if ($application) {
                    return $application;
                }
            }

            if (!empty($sessionUser['email'])) {
                $application = Application::where('email', $sessionUser['email'])->latest('created_at')->first();
                if ($application) {
                    return $application;
                }
            }
        }

        $reference = $request->session()->get('admission_reference');
        return $reference ? Application::where('reference', $reference)->first() : null;
    }
}
