<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentAffiliateApplicationController extends Controller
{
    public function apply(Request $request)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $eligibility = $this->affiliateSignupEligibility($userId);
        if (!$eligibility['eligible']) {
            return response()->json([
                'message' => 'To become an affiliate, first pay one short-course entry fee and one short-course access payment on your own account.',
                'eligibility' => $eligibility,
            ], 422);
        }

        $payload = $request->validate([
            'displayName' => ['nullable', 'string', 'min:2', 'max:150'],
            'payoutPhone' => ['required', 'string', 'max:50'],
            'payoutOperator' => ['required', 'in:airtel,mtn,zamtel'],
            'payoutCountry' => ['nullable', 'string', 'max:5'],
            'applicationReason' => ['required', 'string', 'min:10', 'max:2000'],
            'promotionChannels' => ['nullable', 'array'],
            'promotionChannels.*' => ['string', 'max:80'],
            'acceptedTerms' => ['accepted'],
        ]);

        $sessionUser = $request->session()->get('user');
        $displayName = trim((string) ($payload['displayName'] ?? ($sessionUser['name'] ?? 'UnivAI Affiliate')));
        $existing = Affiliate::where('user_id', $userId)->first();
        if ($existing && $existing->status === 'active') {
            return response()->json($this->affiliatePayload($existing));
        }

        $affiliate = Affiliate::updateOrCreate(
            ['user_id' => $userId],
            [
                'code' => $existing?->code ?: $this->uniqueCode($displayName),
                'display_name' => $displayName,
                'scope' => 'short_courses',
                'status' => 'pending',
                'tier' => $existing?->tier ?: 'starter',
                'formal_programme_rate' => 0,
                'short_course_rate' => 10,
                'payout_phone' => $payload['payoutPhone'],
                'payout_operator' => $payload['payoutOperator'],
                'payout_country' => strtolower($payload['payoutCountry'] ?? 'zm'),
                'application_reason' => $payload['applicationReason'],
                'promotion_channels' => $payload['promotionChannels'] ?? [],
                'terms_accepted_at' => now(),
                'rejected_at' => null,
                'auto_payout_enabled' => true,
                'auto_payout_daily_limit' => 100,
                'notes' => trim(($existing?->notes ? $existing->notes . "\n" : '') . 'Affiliate application gate passed: paid one entry fee and one access payment.'),
            ]
        );

        return response()->json($this->affiliatePayload($affiliate->fresh()), 201);
    }

    private function affiliateSignupEligibility(int $userId): array
    {
        $paidEntry = Invoice::query()
            ->where('student_id', $userId)
            ->where('type', 'short_course_entry')
            ->where('status', 'paid')
            ->exists();

        $paidAccess = Invoice::query()
            ->where('student_id', $userId)
            ->whereIn('type', ['short_course_access_plan', 'short_course_bundle'])
            ->where('status', 'paid')
            ->exists();

        return [
            'eligible' => $paidEntry && $paidAccess,
            'paidEntryFee' => $paidEntry,
            'paidAccess' => $paidAccess,
            'requiredEntryFees' => 1,
            'requiredAccessPayments' => 1,
        ];
    }

    private function affiliatePayload(Affiliate $affiliate): array
    {
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
            'recurringCommissionEnabled' => (bool) $affiliate->recurring_commission_enabled,
            'recurringMonths' => (int) $affiliate->recurring_months,
            'autoPayoutEnabled' => (bool) $affiliate->auto_payout_enabled,
            'autoPayoutDailyLimit' => (string) ($affiliate->auto_payout_daily_limit ?? 0),
            'payoutPhone' => $affiliate->payout_phone,
            'payoutOperator' => $affiliate->payout_operator,
            'payoutCountry' => $affiliate->payout_country,
            'applicationReason' => $affiliate->application_reason,
            'promotionChannels' => $affiliate->promotion_channels ?? [],
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
            'recentReferrals' => [],
            'recentEarnings' => [],
            'recentPayouts' => [],
            'monthlyChallenge' => null,
            'tierLeaderboard' => [],
            'tierHealth' => ['status' => 'safe', 'message' => 'Application is pending admin review.'],
            'badges' => [],
            'upgradeEligibility' => null,
            'pendingUpgradeRequest' => null,
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
