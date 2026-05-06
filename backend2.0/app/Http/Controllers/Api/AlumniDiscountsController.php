<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniDiscountApplication;
use App\Models\AlumniDiscountCampaign;
use App\Models\CompletedProgramme;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\User;
use App\Services\AlumniDiscountService;
use Illuminate\Http\Request;

class AlumniDiscountsController extends Controller
{
    public function studentProfile(Request $request)
    {
        $user = $this->sessionUser($request);
        if (!$user) {
            return response()->json(null, 404);
        }

        return [
            'alumniState' => $user->alumni_state ?? 'none',
            'accountStanding' => $user->account_standing ?? 'good',
            'suspendedAt' => optional($user->suspended_at)->toISOString(),
            'completedProgrammes' => CompletedProgramme::with('program')
                ->where('user_id', $user->id)
                ->orderByDesc('completed_at')
                ->get()
                ->map(fn (CompletedProgramme $history) => [
                    'id' => $history->id,
                    'programId' => $history->program_id,
                    'programTitle' => $history->program?->title,
                    'programLevel' => $history->program_level,
                    'status' => $history->status,
                    'finalStanding' => $history->final_standing,
                    'paymentCleared' => $history->payment_cleared,
                    'completedAt' => optional($history->completed_at)->toDateString(),
                ]),
            'discountApplications' => AlumniDiscountApplication::with('campaign')
                ->where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (AlumniDiscountApplication $application) => $this->applicationPayload($application)),
        ];
    }

    public function campaigns()
    {
        return AlumniDiscountCampaign::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (AlumniDiscountCampaign $campaign) => $this->campaignPayload($campaign));
    }

    public function storeCampaign(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string'],
            'code' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'discountType' => ['nullable', 'in:percentage,fixed'],
            'discountValue' => ['required', 'numeric', 'min:0'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after_or_equal:startsAt'],
            'previousProgrammeLevels' => ['nullable', 'array'],
            'newProgrammeLevels' => ['nullable', 'array'],
            'automatic' => ['nullable', 'boolean'],
            'requiresAdminApproval' => ['nullable', 'boolean'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $campaign = AlumniDiscountCampaign::create([
            'name' => $payload['name'],
            'code' => strtoupper($payload['code']),
            'description' => $payload['description'] ?? null,
            'discount_type' => $payload['discountType'] ?? 'percentage',
            'discount_value' => $payload['discountValue'],
            'starts_at' => $payload['startsAt'],
            'ends_at' => $payload['endsAt'],
            'previous_programme_levels' => $payload['previousProgrammeLevels'] ?? null,
            'new_programme_levels' => $payload['newProgrammeLevels'] ?? null,
            'automatic' => $payload['automatic'] ?? true,
            'requires_admin_approval' => $payload['requiresAdminApproval'] ?? false,
            'is_active' => $payload['isActive'] ?? true,
        ]);

        return response()->json($this->campaignPayload($campaign), 201);
    }

    public function applications()
    {
        return AlumniDiscountApplication::with(['campaign', 'user', 'invoice', 'completedProgramme'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (AlumniDiscountApplication $application) => $this->applicationPayload($application));
    }

    public function decide(Request $request, AlumniDiscountApplication $application, AlumniDiscountService $service)
    {
        $payload = $request->validate([
            'decision' => ['required', 'in:approved,declined'],
            'notes' => ['nullable', 'string'],
        ]);

        $admin = $this->sessionUser($request);
        $application = $payload['decision'] === 'approved'
            ? $service->approve($application, $admin, $payload['notes'] ?? null)
            : $service->decline($application, $admin, $payload['notes'] ?? null);

        return $this->applicationPayload($application->load(['campaign', 'user', 'invoice', 'completedProgramme']));
    }

    public function syncAlumniState(Request $request, User $student)
    {
        $payload = $request->validate([
            'alumniState' => ['required', 'in:none,eligible,alumni,suspended'],
            'accountStanding' => ['required', 'in:good,watch,blocked'],
            'suspensionReason' => ['nullable', 'string'],
        ]);

        $student->update([
            'alumni_state' => $payload['alumniState'],
            'account_standing' => $payload['accountStanding'],
            'suspended_at' => $payload['alumniState'] === 'suspended' ? now() : null,
            'alumni_suspension_reason' => $payload['suspensionReason'] ?? null,
        ]);

        Notification::create([
            'user_id' => $student->id,
            'audience' => 'student',
            'type' => 'alumni-state',
            'title' => 'Alumni profile updated',
            'message' => "Your alumni status is now {$student->alumni_state} with {$student->account_standing} account standing.",
            'action_url' => '/student/profile',
        ]);

        return ['studentId' => $student->id, 'alumniState' => $student->alumni_state, 'accountStanding' => $student->account_standing];
    }

    public function completeProgramme(Request $request, User $student)
    {
        $payload = $request->validate([
            'programId' => ['required', 'exists:programs,id'],
            'programLevel' => ['required', 'string'],
            'finalStanding' => ['nullable', 'in:good,watch,blocked'],
            'paymentCleared' => ['required', 'boolean'],
            'completedAt' => ['required', 'date'],
        ]);

        $history = CompletedProgramme::create([
            'user_id' => $student->id,
            'program_id' => $payload['programId'],
            'program_level' => $payload['programLevel'],
            'final_standing' => $payload['finalStanding'] ?? 'good',
            'payment_cleared' => $payload['paymentCleared'],
            'completed_at' => $payload['completedAt'],
        ]);

        $student->update(['alumni_state' => 'alumni']);
        return response()->json(['id' => $history->id, 'alumniState' => $student->alumni_state], 201);
    }

    private function sessionUser(Request $request): ?User
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        return $userId && is_numeric($userId) ? User::find($userId) : null;
    }

    private function campaignPayload(AlumniDiscountCampaign $campaign): array
    {
        return [
            'id' => $campaign->id,
            'name' => $campaign->name,
            'code' => $campaign->code,
            'description' => $campaign->description,
            'discountType' => $campaign->discount_type,
            'discountValue' => (string) $campaign->discount_value,
            'startsAt' => optional($campaign->starts_at)->toDateString(),
            'endsAt' => optional($campaign->ends_at)->toDateString(),
            'previousProgrammeLevels' => $campaign->previous_programme_levels ?? [],
            'newProgrammeLevels' => $campaign->new_programme_levels ?? [],
            'automatic' => $campaign->automatic,
            'requiresAdminApproval' => $campaign->requires_admin_approval,
            'isActive' => $campaign->is_active,
            'usesCount' => $campaign->uses_count,
        ];
    }

    private function applicationPayload(AlumniDiscountApplication $application): array
    {
        return [
            'id' => $application->id,
            'campaignId' => $application->campaign_id,
            'campaignName' => $application->campaign?->name,
            'studentId' => $application->user_id,
            'studentName' => $application->user?->name,
            'invoiceId' => $application->invoice_id,
            'previousProgrammeLevel' => $application->previous_programme_level,
            'newProgrammeLevel' => $application->new_programme_level,
            'requestedDiscountAmount' => (string) $application->requested_discount_amount,
            'approvedDiscountAmount' => (string) $application->approved_discount_amount,
            'status' => $application->status,
            'eligibilitySnapshot' => $application->eligibility_snapshot,
            'decisionNotes' => $application->decision_notes,
            'reviewedAt' => optional($application->reviewed_at)->toISOString(),
            'createdAt' => optional($application->created_at)->toISOString(),
        ];
    }
}
