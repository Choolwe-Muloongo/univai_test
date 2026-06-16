<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use Illuminate\Http\Request;

class AdminAffiliateRequirementsController extends Controller
{
    public function index()
    {
        $items = Affiliate::with('user')->orderByDesc('created_at')->get()->map(fn (Affiliate $affiliate) => $this->map($affiliate));

        return response()->json([
            'affiliates' => $items->values(),
            'summary' => [
                'count' => $items->count(),
                'active' => $items->where('status', 'active')->count(),
                'pending' => $items->where('status', 'pending')->count(),
                'paymentRequired' => $items->where('status', 'payment_required')->count(),
                'totalAvailable' => '0',
            ],
            'leaderboards' => [],
            'monthlyBonuses' => [],
            'upgradeRequests' => [],
            'tierReviews' => [],
            'financeBuckets' => [],
        ]);
    }

    public function updateStatus(Request $request, Affiliate $affiliate)
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,pending,rejected,payment_required'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $requirementsComplete = !is_null($affiliate->entry_fee_paid_at) && !is_null($affiliate->access_requirement_met_at);

        if ($data['status'] === 'active' && !$requirementsComplete) {
            return response()->json([
                'message' => 'This affiliate cannot be activated yet. Entry fee and access payment are required first.',
                'affiliate' => $this->map($affiliate),
            ], 422);
        }

        $updates = [
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $affiliate->notes,
        ];

        if ($data['status'] === 'active') {
            $updates['approved_at'] = now();
            $updates['rejected_at'] = null;
            $updates['requirements_status'] = 'complete';
        }

        if ($data['status'] === 'rejected') {
            $updates['rejected_at'] = now();
        }

        if ($data['status'] === 'payment_required') {
            $updates['requirements_status'] = 'payment_required';
        }

        $affiliate->update($updates);

        return response()->json($this->map($affiliate->fresh('user')));
    }

    private function map(Affiliate $affiliate): array
    {
        $entryPaid = !is_null($affiliate->entry_fee_paid_at);
        $accessPaid = !is_null($affiliate->access_requirement_met_at);
        $complete = $entryPaid && $accessPaid;

        return [
            'id' => $affiliate->id,
            'userId' => $affiliate->user_id,
            'userName' => $affiliate->user?->name,
            'userEmail' => $affiliate->user?->email,
            'code' => $affiliate->code,
            'displayName' => $affiliate->display_name,
            'scope' => $affiliate->scope,
            'status' => $affiliate->status,
            'tier' => $affiliate->tier ?: 'starter',
            'tierLabel' => 'Starter Affiliate',
            'formalProgrammeRate' => (float) $affiliate->formal_programme_rate,
            'shortCourseRate' => (float) $affiliate->short_course_rate,
            'payoutPhone' => $affiliate->payout_phone,
            'payoutOperator' => $affiliate->payout_operator,
            'payoutCountry' => $affiliate->payout_country,
            'applicationReason' => $affiliate->application_reason,
            'promotionChannels' => $affiliate->promotion_channels ?? [],
            'requirementsStatus' => $affiliate->requirements_status ?? ($complete ? 'complete' : 'payment_required'),
            'legacyApplication' => (bool) $affiliate->legacy_application,
            'entryFeePaidAt' => optional($affiliate->entry_fee_paid_at)->toISOString(),
            'accessRequirementMetAt' => optional($affiliate->access_requirement_met_at)->toISOString(),
            'termsVersion' => $affiliate->terms_version,
            'requirementsComplete' => $complete,
            'requirementFlags' => [
                'entryFeePaid' => $entryPaid,
                'accessPaid' => $accessPaid,
                'paymentRequired' => !$complete,
            ],
            'summary' => [
                'grossEarned' => '0',
                'commissionEarned' => '0',
                'availableToWithdraw' => '0',
                'pendingPayouts' => '0',
                'processingPayouts' => '0',
                'successfulPayouts' => '0',
                'verifiedSignups' => 0,
                'paidReferrals' => 0,
            ],
        ];
    }
}
