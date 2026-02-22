<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LecturerApplication;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LecturerApplicationsController extends Controller
{
    public function submit(Request $request)
    {
        $payload = $request->validate([
            'fullName' => ['required', 'string'],
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string'],
            'department' => ['nullable', 'string'],
            'specialization' => ['nullable', 'string'],
            'highestQualification' => ['nullable', 'string'],
            'yearsExperience' => ['nullable', 'integer', 'min:0'],
            'programInterest' => ['nullable', 'string'],
            'documents' => ['nullable', 'array'],
        ]);

        $application = LecturerApplication::create([
            'full_name' => $payload['fullName'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? null,
            'department' => $payload['department'] ?? null,
            'specialization' => $payload['specialization'] ?? null,
            'highest_qualification' => $payload['highestQualification'] ?? null,
            'years_experience' => $payload['yearsExperience'] ?? 0,
            'program_interest' => $payload['programInterest'] ?? null,
            'documents' => $payload['documents'] ?? null,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        AuditLogger::log($request, 'lecturer.application.submitted', 'lecturer_application', (string) $application->id, [
            'email' => $application->email,
        ]);

        return response()->json($this->mapApplication($application), 201);
    }

    public function adminIndex()
    {
        return LecturerApplication::query()
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn (LecturerApplication $application) => $this->mapApplication($application));
    }

    public function adminShow(LecturerApplication $lecturerApplication)
    {
        return response()->json($this->mapApplication($lecturerApplication));
    }

    public function adminUpdate(Request $request, LecturerApplication $lecturerApplication)
    {
        $payload = $request->validate([
            'status' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $reviewer = $request->session()->get('user');
        $reviewerId = is_array($reviewer) && isset($reviewer['id']) && is_numeric($reviewer['id'])
            ? (int) $reviewer['id']
            : null;

        $lecturerApplication->update([
            'status' => $payload['status'],
            'notes' => $payload['notes'] ?? $lecturerApplication->notes,
            'reviewed_at' => now(),
            'reviewed_by' => $reviewerId,
        ]);

        $temporaryPassword = null;
        if ($payload['status'] === 'approved') {
            $temporaryPassword = 'password123';
            $user = User::firstOrCreate(
                ['email' => $lecturerApplication->email],
                [
                    'name' => $lecturerApplication->full_name,
                    'password' => Hash::make($temporaryPassword),
                ]
            );
            $user->update([
                'role' => 'lecturer',
            ]);
        }

        AuditLogger::log($request, 'lecturer.application.reviewed', 'lecturer_application', (string) $lecturerApplication->id, [
            'status' => $payload['status'],
        ]);

        $response = $this->mapApplication($lecturerApplication);
        if ($temporaryPassword) {
            $response['login'] = [
                'email' => $lecturerApplication->email,
                'temporaryPassword' => $temporaryPassword,
            ];
        }

        return response()->json($response);
    }

    private function mapApplication(LecturerApplication $application): array
    {
        return [
            'id' => $application->id,
            'fullName' => $application->full_name,
            'email' => $application->email,
            'phone' => $application->phone,
            'department' => $application->department,
            'specialization' => $application->specialization,
            'highestQualification' => $application->highest_qualification,
            'yearsExperience' => $application->years_experience,
            'programInterest' => $application->program_interest,
            'documents' => $application->documents ?? [],
            'status' => $application->status,
            'notes' => $application->notes,
            'submittedAt' => optional($application->submitted_at)->toISOString(),
            'reviewedAt' => optional($application->reviewed_at)->toISOString(),
        ];
    }
}
