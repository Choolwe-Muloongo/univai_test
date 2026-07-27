<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearcherApplication;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ResearcherApplicationsController extends Controller
{
    public function submit(Request $request)
    {
        $payload = $request->validate([
            'fullName' => ['required', 'string'],
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string'],
            'institutionAffiliation' => ['nullable', 'string'],
            'researchArea' => ['nullable', 'string'],
            'highestQualification' => ['nullable', 'string'],
            'yearsExperience' => ['nullable', 'integer', 'min:0'],
            'orcidId' => ['nullable', 'string'],
            'documents' => ['nullable', 'array'],
        ]);

        $application = ResearcherApplication::create([
            'full_name' => $payload['fullName'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? null,
            'institution_affiliation' => $payload['institutionAffiliation'] ?? null,
            'research_area' => $payload['researchArea'] ?? null,
            'highest_qualification' => $payload['highestQualification'] ?? null,
            'years_experience' => $payload['yearsExperience'] ?? 0,
            'orcid_id' => $payload['orcidId'] ?? null,
            'documents' => $payload['documents'] ?? null,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        AuditLogger::log($request, 'researcher.application.submitted', 'researcher_application', (string) $application->id, [
            'email' => $application->email,
        ]);

        return response()->json($this->mapApplication($application), 201);
    }

    public function adminIndex()
    {
        return ResearcherApplication::query()
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn (ResearcherApplication $application) => $this->mapApplication($application));
    }

    public function adminShow(ResearcherApplication $researcherApplication)
    {
        return response()->json($this->mapApplication($researcherApplication));
    }

    public function adminUpdate(Request $request, ResearcherApplication $researcherApplication)
    {
        $payload = $request->validate([
            'status' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $reviewer = $request->session()->get('user');
        $reviewerId = is_array($reviewer) && isset($reviewer['id']) && is_numeric($reviewer['id'])
            ? (int) $reviewer['id']
            : null;

        $researcherApplication->update([
            'status' => $payload['status'],
            'notes' => $payload['notes'] ?? $researcherApplication->notes,
            'reviewed_at' => now(),
            'reviewed_by' => $reviewerId,
        ]);

        $temporaryPassword = null;
        if ($payload['status'] === 'approved') {
            $temporaryPassword = 'password123';
            $user = User::firstOrCreate(
                ['email' => $researcherApplication->email],
                [
                    'name' => $researcherApplication->full_name,
                    'password' => Hash::make($temporaryPassword),
                ]
            );
            $user->update([
                'role' => 'researcher',
                'account_state' => 'active',
                'verification_status' => 'identity',
                'profile_completed_at' => $user->profile_completed_at ?? now(),
            ]);
        }

        AuditLogger::log($request, 'researcher.application.reviewed', 'researcher_application', (string) $researcherApplication->id, [
            'status' => $payload['status'],
        ]);

        $response = $this->mapApplication($researcherApplication);
        if ($temporaryPassword) {
            $response['login'] = [
                'email' => $researcherApplication->email,
                'temporaryPassword' => $temporaryPassword,
            ];
        }

        return response()->json($response);
    }

    private function mapApplication(ResearcherApplication $application): array
    {
        return [
            'id' => $application->id,
            'fullName' => $application->full_name,
            'email' => $application->email,
            'phone' => $application->phone,
            'institutionAffiliation' => $application->institution_affiliation,
            'researchArea' => $application->research_area,
            'highestQualification' => $application->highest_qualification,
            'yearsExperience' => $application->years_experience,
            'orcidId' => $application->orcid_id,
            'documents' => $application->documents ?? [],
            'status' => $application->status,
            'notes' => $application->notes,
            'submittedAt' => optional($application->submitted_at)->toISOString(),
            'reviewedAt' => optional($application->reviewed_at)->toISOString(),
        ];
    }
}
