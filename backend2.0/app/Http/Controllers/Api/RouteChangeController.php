<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Intake;
use App\Models\RouteChangeRequest;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;

class RouteChangeController extends Controller
{
    public function studentIndex(Request $request)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || !is_numeric($studentId)) {
            return [];
        }

        return RouteChangeRequest::with(['currentIntake', 'requestedIntake'])
            ->where('student_id', $studentId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (RouteChangeRequest $request) => $this->mapRequest($request));
    }

    public function store(Request $request)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || !is_numeric($studentId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'requestedIntakeId' => ['required', 'string'],
            'reason' => ['nullable', 'string'],
        ]);

        $currentIntakeId = $user['intakeId'] ?? null;

        $requested = Intake::find($payload['requestedIntakeId']);
        if (!$requested) {
            return response()->json(['message' => 'Requested intake not found'], 404);
        }
        if (!empty($user['programId']) && $requested->program_id !== $user['programId']) {
            return response()->json(['message' => 'Requested intake is not part of your program'], 422);
        }

        $requestModel = RouteChangeRequest::create([
            'student_id' => (int) $studentId,
            'current_intake_id' => $currentIntakeId,
            'requested_intake_id' => $payload['requestedIntakeId'],
            'reason' => $payload['reason'] ?? null,
            'status' => 'pending',
        ]);

        AuditLogger::log($request, 'route_change.requested', 'route_change_request', (string) $requestModel->id, [
            'requestedIntakeId' => $payload['requestedIntakeId'],
        ]);

        return response()->json($this->mapRequest($requestModel), 201);
    }

    public function adminIndex()
    {
        return RouteChangeRequest::with(['student', 'currentIntake', 'requestedIntake'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (RouteChangeRequest $request) => $this->mapRequest($request));
    }

    public function adminUpdate(Request $request, RouteChangeRequest $routeChangeRequest)
    {
        $payload = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'reviewNotes' => ['nullable', 'string'],
        ]);

        $sessionUser = $request->session()->get('user');
        $reviewerId = null;
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $reviewerId = (int) $sessionUser['id'];
        }

        $routeChangeRequest->update([
            'status' => $payload['status'],
            'review_notes' => $payload['reviewNotes'] ?? $routeChangeRequest->review_notes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        if ($payload['status'] === 'approved') {
            $student = User::find($routeChangeRequest->student_id);
            if ($student) {
                $student->update([
                    'intake_id' => $routeChangeRequest->requested_intake_id,
                ]);
                Enrollment::updateOrCreate(
                    [
                        'user_id' => $student->id,
                        'intake_id' => $routeChangeRequest->requested_intake_id,
                    ],
                    [
                        'status' => 'active',
                        'enrolled_at' => now(),
                    ]
                );
            }
        }

        AuditLogger::log($request, 'route_change.reviewed', 'route_change_request', (string) $routeChangeRequest->id, [
            'status' => $payload['status'],
        ]);

        $routeChangeRequest->load(['student', 'currentIntake', 'requestedIntake']);

        return $this->mapRequest($routeChangeRequest);
    }

    private function mapRequest(RouteChangeRequest $request): array
    {
        return [
            'id' => $request->id,
            'studentId' => $request->student_id,
            'studentName' => $request->student?->name,
            'studentEmail' => $request->student?->email,
            'currentIntakeId' => $request->current_intake_id,
            'currentIntakeName' => $request->currentIntake?->name,
            'requestedIntakeId' => $request->requested_intake_id,
            'requestedIntakeName' => $request->requestedIntake?->name,
            'reason' => $request->reason,
            'status' => $request->status,
            'reviewNotes' => $request->review_notes,
            'reviewedAt' => optional($request->reviewed_at)->toISOString(),
            'createdAt' => optional($request->created_at)->toISOString(),
        ];
    }
}
