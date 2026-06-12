<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\AffiliatePayout;
use App\Services\LencoPaymentService;
use App\Support\Affiliates\AffiliateService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    public function index(Request $request, AffiliateService $affiliates)
    {
        $items = Affiliate::with(['user', 'earnings', 'payouts', 'referrals'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Affiliate $affiliate) => $this->mapAffiliate($affiliate, $affiliates));

        return response()->json([
            'affiliates' => $items->values(),
            'summary' => [
                'count' => $items->count(),
                'active' => $items->where('status', 'active')->count(),
                'pending' => $items->where('status', 'pending')->count(),
                'totalAvailable' => (string) $items->sum(fn ($item) => (float) ($item['summary']['availableToWithdraw'] ?? 0)),
            ],
        ]);
    }

    public function me(Request $request, AffiliateService $affiliates)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(null);
        }

        $affiliate = Affiliate::with(['user', 'earnings', 'payouts', 'referrals'])->where('user_id', $userId)->first();
        if (!$affiliate) {
            return response()->json(null);
        }

        return response()->json($this->mapAffiliate($affiliate, $affiliates));
    }

    public function apply(Request $request, AffiliateService $affiliates)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
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
        $existing = Affiliate::with(['user', 'earnings', 'payouts', 'referrals'])->where('user_id', $userId)->first();
        if ($existing && $existing->status === 'active') {
            return response()->json($this->mapAffiliate($existing, $affiliates));
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
            ]
        );

        return response()->json($this->mapAffiliate($affiliate->fresh(['user', 'earnings', 'payouts', 'referrals']), $affiliates), 201);
    }

    public function requestMyPayout(Request $request, AffiliateService $affiliates, LencoPaymentService $lenco)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $affiliate = Affiliate::where('user_id', $userId)->first();
        if (!$affiliate || $affiliate->status !== 'active') {
            return response()->json(['message' => 'Affiliate account is not active.'], 403);
        }

        $payload = $request->validate([
            'amount' => ['required', 'numeric', 'min:50'],
            'currency' => ['nullable', 'string', 'max:3'],
            'phone' => ['nullable', 'string'],
            'operator' => ['nullable', 'in:airtel,mtn,zamtel'],
            'country' => ['nullable', 'string', 'max:5'],
        ]);

        try {
            $reviewReason = $affiliates->autoPayoutReviewReason($affiliate, (float) $payload['amount']);
            $payout = $affiliates->createPayout($affiliate, $payload, $userId);
            if ($reviewReason) {
                $payout->update(['status' => 'pending_review', 'failure_reason' => $reviewReason]);
                return response()->json($this->mapPayout($payout->fresh()), 202);
            }
            $payout = $affiliates->sendPayoutToLenco($payout, $lenco, $userId);
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json($this->mapPayout($payout), 201);
    }

    public function store(Request $request, AffiliateService $affiliates)
    {
        $payload = $request->validate([
            'userId' => ['nullable', 'integer', 'exists:users,id'],
            'code' => ['nullable', 'string', 'min:4', 'max:32'],
            'displayName' => ['required', 'string', 'min:2'],
            'scope' => ['nullable', 'in:all,formal_programmes,short_courses'],
            'status' => ['nullable', 'in:active,inactive,pending,rejected'],
            'tier' => ['nullable', 'in:starter,campus_promoter,ambassador,elite_partner'],
            'formalProgrammeRate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'shortCourseRate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lencoAccountId' => ['nullable', 'string'],
            'payoutPhone' => ['nullable', 'string'],
            'payoutOperator' => ['nullable', 'string'],
            'payoutCountry' => ['nullable', 'string', 'max:5'],
            'notes' => ['nullable', 'string'],
        ]);

        $tier = $payload['tier'] ?? 'starter';
        $tierConfig = $affiliates->tierConfig($tier);
        $code = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '', (string) ($payload['code'] ?? '')) ?: Str::random(8));
        $lookup = isset($payload['userId']) && $payload['userId']
            ? ['user_id' => $payload['userId']]
            : ['code' => $code];
        $status = $payload['status'] ?? 'active';

        $affiliate = Affiliate::updateOrCreate(
            $lookup,
            [
                'user_id' => $payload['userId'] ?? null,
                'code' => $code,
                'display_name' => $payload['displayName'],
                'scope' => $payload['scope'] ?? 'all',
                'status' => $status,
                'tier' => $tier,
                'formal_programme_rate' => $payload['formalProgrammeRate'] ?? 10,
                'short_course_rate' => $payload['shortCourseRate'] ?? $tierConfig['firstPurchaseRate'],
                'lenco_account_id' => $payload['lencoAccountId'] ?? null,
                'payout_phone' => $payload['payoutPhone'] ?? null,
                'payout_operator' => $payload['payoutOperator'] ?? null,
                'payout_country' => $payload['payoutCountry'] ?? 'zm',
                'notes' => $payload['notes'] ?? null,
                'approved_at' => $status === 'active' ? now() : null,
                'rejected_at' => $status === 'rejected' ? now() : null,
                'recurring_commission_enabled' => (bool) $tierConfig['recurringEnabled'],
                'recurring_months' => (int) $tierConfig['recurringMonths'],
                'auto_payout_daily_limit' => $tierConfig['dailyPayoutLimit'],
                'last_tier_reviewed_at' => now(),
            ]
        );

        return response()->json($this->mapAffiliate($affiliate->fresh(['user', 'earnings', 'payouts', 'referrals']), $affiliates), 201);
    }

    public function show(Affiliate $affiliate, AffiliateService $affiliates)
    {
        return response()->json($this->mapAffiliate($affiliate->load(['user', 'earnings', 'payouts', 'referrals']), $affiliates));
    }

    public function requestPayout(Request $request, Affiliate $affiliate, AffiliateService $affiliates, LencoPaymentService $lenco)
    {
        $payload = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'currency' => ['nullable', 'string', 'max:3'],
            'phone' => ['nullable', 'string'],
            'operator' => ['nullable', 'string'],
            'country' => ['nullable', 'string', 'max:5'],
            'reference' => ['nullable', 'string'],
            'fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        try {
            $payout = $affiliates->createPayout($affiliate, $payload, $this->adminUserId($request));
            $payout = $affiliates->sendPayoutToLenco($payout, $lenco, $this->adminUserId($request));
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json($this->mapPayout($payout), 201);
    }

    public function verifyPayout(Request $request, AffiliatePayout $payout, AffiliateService $affiliates, LencoPaymentService $lenco)
    {
        return response()->json($this->mapPayout($affiliates->verifyPayout($payout, $lenco)));
    }

    private function mapAffiliate(Affiliate $affiliate, AffiliateService $affiliates): array
    {
        $tier = $affiliate->tier ?: 'starter';
        return [
            'id' => $affiliate->id,
            'userId' => $affiliate->user_id,
            'userName' => $affiliate->user?->name,
            'userEmail' => $affiliate->user?->email,
            'code' => $affiliate->code,
            'displayName' => $affiliate->display_name,
            'scope' => $affiliate->scope,
            'status' => $affiliate->status,
            'tier' => $tier,
            'tierLabel' => $affiliates->tierConfig($tier)['label'],
            'tierProgress' => $affiliates->tierProgress($affiliate),
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
            'summary' => $affiliates->summaryForAffiliate($affiliate),
            'recentReferrals' => $affiliate->referrals->sortByDesc('created_at')->take(12)->values()->map(fn ($referral) => [
                'id' => $referral->id,
                'referredUserId' => $referral->referred_user_id,
                'referralCode' => $referral->referral_code,
                'sourceType' => $referral->source_type,
                'sourceReference' => $referral->source_reference,
                'firstPaidAt' => optional($referral->first_paid_at)->toISOString(),
                'createdAt' => optional($referral->created_at)->toISOString(),
            ])->values(),
            'recentEarnings' => $affiliate->earnings->sortByDesc('created_at')->take(12)->values()->map(fn ($earning) => [
                'id' => $earning->id,
                'sourceType' => $earning->source_type,
                'sourceReference' => $earning->source_reference,
                'grossAmount' => (string) $earning->gross_amount,
                'commissionRate' => (string) $earning->commission_rate,
                'commissionAmount' => (string) $earning->commission_amount,
                'currency' => $earning->currency,
                'status' => $earning->status,
                'createdAt' => optional($earning->created_at)->toISOString(),
            ])->values(),
            'recentPayouts' => $affiliate->payouts->sortByDesc('created_at')->take(12)->values()->map(fn ($payout) => $this->mapPayout($payout))->values(),
        ];
    }

    private function mapPayout(AffiliatePayout $payout): array
    {
        return [
            'id' => $payout->id,
            'affiliateId' => $payout->affiliate_id,
            'amount' => (string) $payout->amount,
            'currency' => $payout->currency,
            'status' => $payout->status,
            'providerReference' => $payout->provider_reference,
            'failureReason' => $payout->failure_reason,
            'requestedAt' => optional($payout->created_at)->toISOString(),
            'paidAt' => optional($payout->paid_at)->toISOString(),
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

    private function adminUserId(Request $request): ?int
    {
        return $this->sessionUserId($request);
    }
}
