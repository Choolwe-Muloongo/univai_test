<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\Invoice;
use Illuminate\Http\Request;

class AffiliateGateController extends Controller
{
    private const TERMS_VERSION = 'affiliate-2026-06-16-v1';
    private const ACCESS_INVOICE_TYPES = ['short_course_access_plan', 'short_course_bundle'];

    public function me(Request $request)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(null);
        }

        $affiliate = Affiliate::where('user_id', $userId)->first();
        if (!$affiliate) {
            return response()->json(null);
        }

        $eligibility = $this->eligibility($userId);
        $this->syncRequirements($affiliate, $eligibility);

        return response()->json($this->payload($affiliate->fresh(), $eligibility));
    }

    public function apply(Request $request)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'displayName' => ['nullable', 'string', 'min:2', 'max:150'],
            'payoutPhone' => ['required', 'string', 'max:50'],
            'payoutOperator' => ['required', 'in:airtel,mtn,zamtel'],
            'payoutCountry' => ['nullable', 'string', 'max:5'],
            'applicationReason' => ['required', 'string', 'min:10', 'max:2000'],
            'promotionChannels' => ['nullable', 'array'],
            'promotionChannels.*' => ['string', 'max:80'],
            'acceptedTerms' => ['accepted'],
        ]);

        $eligibility = $this->eligibility($userId);
        $existing = Affiliate::where('user_id', $userId)->first();
        $sessionUser = $request->session()->get('user');
        $displayName = trim((string) ($data['displayName'] ?? ($sessionUser['name'] ?? 'UnivAI Affiliate')));
        $complete = (bool) $eligibility['eligible'];

        $affiliate = Affiliate::updateOrCreate(
            ['user_id' => $userId],
            [
                'code' => $existing?->code ?: $this->uniqueCode($displayName),
                'display_name' => $displayName,
                'scope' => 'short_courses',
                'status' => $complete ? 'pending' : 'payment_required',
                'tier' => $existing?->tier ?: 'starter',
                'formal_programme_rate' => 0,
                'short_course_rate' => 10,
                'payout_phone' => $data['payoutPhone'],
                'payout_operator' => $data['payoutOperator'],
                'payout_country' => strtolower($data['payoutCountry'] ?? 'zm'),
                'application_reason' => $data['applicationReason'],
                'promotion_channels' => $data['promotionChannels'] ?? [],
                'terms_accepted_at' => now(),
                'terms_version' => self::TERMS_VERSION,
                'requirements_snapshot' => $this->requirementsSnapshot(),
                'entry_fee_paid_at' => $eligibility['entryFeePaidAt'] ?? $existing?->entry_fee_paid_at,
                'access_requirement_met_at' => $eligibility['accessPaidAt'] ?? $existing?->access_requirement_met_at,
                'requirements_status' => $complete ? 'complete' : 'payment_required',
                'legacy_application' => (bool) ($existing && !$existing->requirements_status),
                'rejected_at' => null,
                'auto_payout_enabled' => true,
                'auto_payout_daily_limit' => 100,
                'notes' => $complete ? 'Affiliate requirements complete. Awaiting admin review.' : 'Affiliate application saved. Entry fee and access are required before activation.',
            ]
        );

        return response()->json(array_merge([
            'message' => $complete ? 'Affiliate application submitted. Admin will review it before activation.' : 'Your affiliate application has been saved. Complete the entry fee and required access payment to activate it.',
            'requiresPayment' => !$complete,
        ], $this->payload($affiliate->fresh(), $eligibility)), $complete ? 201 : 202);
    }

    private function eligibility(int $userId): array
    {
        $entry = Invoice::where('student_id', $userId)->where('type', 'short_course_entry')->where('status', 'paid')->latest('paid_at')->first();
        $access = Invoice::where('student_id', $userId)->whereIn('type', self::ACCESS_INVOICE_TYPES)->where('status', 'paid')->latest('paid_at')->first();

        return [
            'eligible' => (bool) ($entry && $access),
            'paidEntryFee' => (bool) $entry,
            'paidAccess' => (bool) $access,
            'entryFeePaidAt' => $entry?->paid_at,
            'accessPaidAt' => $access?->paid_at,
            'requiredEntryFees' => 1,
            'requiredAccessPayments' => 1,
        ];
    }

    private function syncRequirements(Affiliate $affiliate, array $eligibility): void
    {
        $complete = (bool) $eligibility['eligible'];
        $updates = [
            'entry_fee_paid_at' => $eligibility['entryFeePaidAt'] ?? $affiliate->entry_fee_paid_at,
            'access_requirement_met_at' => $eligibility['accessPaidAt'] ?? $affiliate->access_requirement_met_at,
            'requirements_status' => $complete ? 'complete' : 'payment_required',
            'terms_version' => $affiliate->terms_version ?: self::TERMS_VERSION,
            'requirements_snapshot' => $affiliate->requirements_snapshot ?: $this->requirementsSnapshot(),
        ];

        if (!$complete && !in_array($affiliate->status, ['active', 'rejected'], true)) {
            $updates['status'] = 'payment_required';
        } elseif ($complete && $affiliate->status === 'payment_required') {
            $updates['status'] = 'pending';
        }

        $affiliate->update($updates);
    }

    private function payload(Affiliate $affiliate, array $eligibility): array
    {
        $complete = !is_null($affiliate->entry_fee_paid_at) && !is_null($affiliate->access_requirement_met_at);

        return [
            'id' => $affiliate->id,
            'userId' => $affiliate->user_id,
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
            'eligibility' => $eligibility,
            'requirementFlags' => [
                'entryFeePaid' => !is_null($affiliate->entry_fee_paid_at),
                'accessPaid' => !is_null($affiliate->access_requirement_met_at),
                'paymentRequired' => !$complete,
            ],
            'summary' => ['grossEarned' => '0', 'commissionEarned' => '0', 'availableToWithdraw' => '0', 'pendingPayouts' => '0', 'processingPayouts' => '0', 'successfulPayouts' => '0', 'verifiedSignups' => 0, 'paidReferrals' => 0],
            'recentReferrals' => [],
            'recentEarnings' => [],
            'recentPayouts' => [],
            'monthlyChallenge' => ['entryFeesPaid' => ($eligibility['paidEntryFee'] ?? false) ? 1 : 0, 'requiredEntryFees' => 1, 'accessPaymentsPaid' => ($eligibility['paidAccess'] ?? false) ? 1 : 0, 'requiredAccessPayments' => 1, 'qualified' => $complete],
            'tierLeaderboard' => [],
            'tierHealth' => ['status' => $complete ? 'safe' : 'payment_required', 'message' => $complete ? 'Requirements complete. Application can be reviewed.' : 'Entry fee and access payment are required before activation.'],
            'badges' => [],
            'upgradeEligibility' => null,
            'pendingUpgradeRequest' => null,
        ];
    }

    private function requirementsSnapshot(): array
    {
        return [
            'entryFeeRequired' => true,
            'entryFeesRequired' => 1,
            'accessPaymentRequired' => true,
            'accessPaymentsRequired' => 1,
            'approvalAutomatic' => false,
            'scope' => 'short_courses',
        ];
    }

    private function uniqueCode(string $seed): string
    {
        $base = strtoupper(substr(preg_replace('/[^A-Za-z0-9]+/', '', $seed), 0, 8) ?: 'UNIVAI');
        do {
            $code = $base . random_int(100, 999);
        } while (Affiliate::where('code', $code)->exists());
        return $code;
    }

    private function sessionUserId(Request $request): ?int
    {
        $user = $request->session()->get('user');
        $id = is_array($user) ? ($user['id'] ?? null) : null;
        return is_numeric($id) ? (int) $id : null;
    }
}
