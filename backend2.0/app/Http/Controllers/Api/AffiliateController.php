<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Services\LencoPaymentService;
use App\Support\Affiliates\AffiliateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    private const ACCESS_SOURCE_TYPES = ['short_course_first_purchase', 'short_course_recurring_purchase'];
    private const ENTRY_SOURCE_TYPE = 'short_course_entry_bonus';

    public function index(Request $request, AffiliateService $affiliates)
    {
        $this->calculateMonthlyScores($affiliates, (int) now()->month, (int) now()->year);

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
            'leaderboards' => $this->adminLeaderboards((int) now()->month, (int) now()->year),
            'monthlyBonuses' => $this->adminTable('affiliate_monthly_bonuses'),
            'upgradeRequests' => $this->adminTable('affiliate_tier_upgrade_requests'),
            'tierReviews' => $this->adminTable('affiliate_tier_reviews'),
            'financeBuckets' => $this->adminTable('finance_bucket_balances'),
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

        $this->calculateMonthlyScores($affiliates, (int) now()->month, (int) now()->year, $affiliate->id);

        return response()->json($this->mapAffiliate($affiliate->fresh(['user', 'earnings', 'payouts', 'referrals']), $affiliates));
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

    public function requestUpgrade(Request $request, AffiliateService $affiliates)
    {
        $userId = $this->sessionUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $affiliate = Affiliate::where('user_id', $userId)->firstOrFail();
        $eligibility = $this->upgradeEligibility($affiliate, $affiliates);
        if (!$eligibility['eligible']) {
            return response()->json(['message' => 'You are not eligible for upgrade yet.', 'eligibility' => $eligibility], 422);
        }
        if (!Schema::hasTable('affiliate_tier_upgrade_requests')) {
            return response()->json(['message' => 'Upgrade requests are not migrated yet.'], 503);
        }

        DB::table('affiliate_tier_upgrade_requests')->updateOrInsert(
            ['affiliate_id' => $affiliate->id, 'status' => 'pending'],
            [
                'from_tier' => $affiliate->tier ?: 'starter',
                'to_tier' => $eligibility['nextTier'],
                'paid_access_purchases' => $eligibility['accessPayments'],
                'access_revenue' => $eligibility['accessRevenue'],
                'active_months' => $eligibility['activeMonths'],
                'refund_rate' => 0,
                'risk_flags_count' => 0,
                'affiliate_message' => (string) $request->input('message', ''),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json(['message' => 'Upgrade request submitted.', 'eligibility' => $eligibility], 201);
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
        $lookup = isset($payload['userId']) && $payload['userId'] ? ['user_id' => $payload['userId']] : ['code' => $code];
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

    public function calculateRewards(Request $request, AffiliateService $affiliates)
    {
        $payload = $request->validate([
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'year' => ['nullable', 'integer', 'min:2024', 'max:2100'],
        ]);
        $month = (int) ($payload['month'] ?? now()->month);
        $year = (int) ($payload['year'] ?? now()->year);
        $this->calculateMonthlyScores($affiliates, $month, $year);
        $this->calculateTierReviews($affiliates, $month, $year);
        return response()->json([
            'leaderboards' => $this->adminLeaderboards($month, $year),
            'bonuses' => $this->adminTable('affiliate_monthly_bonuses'),
            'tierReviews' => $this->adminTable('affiliate_tier_reviews'),
        ]);
    }

    public function approveUpgrade(Request $request, int $requestId, AffiliateService $affiliates)
    {
        abort_unless(Schema::hasTable('affiliate_tier_upgrade_requests'), 503, 'Upgrade requests are not migrated yet.');
        $row = DB::table('affiliate_tier_upgrade_requests')->where('id', $requestId)->first();
        abort_unless($row, 404, 'Upgrade request not found.');
        $affiliate = Affiliate::findOrFail($row->affiliate_id);
        $config = $affiliates->tierConfig($row->to_tier);
        $affiliate->update([
            'tier' => $row->to_tier,
            'short_course_rate' => $config['firstPurchaseRate'],
            'recurring_commission_enabled' => (bool) $config['recurringEnabled'],
            'recurring_months' => (int) $config['recurringMonths'],
            'auto_payout_daily_limit' => $config['dailyPayoutLimit'],
            'last_tier_reviewed_at' => now(),
        ]);
        DB::table('affiliate_tier_upgrade_requests')->where('id', $requestId)->update([
            'status' => 'approved',
            'admin_notes' => (string) $request->input('notes', ''),
            'reviewed_by' => $this->adminUserId($request),
            'reviewed_at' => now(),
            'updated_at' => now(),
        ]);
        $this->awardBadge($affiliate->id, 'fast_riser', 'Fast Riser', 'Approved for a higher affiliate tier.', now()->month, now()->year);
        return response()->json($this->mapAffiliate($affiliate->fresh(['user', 'earnings', 'payouts', 'referrals']), $affiliates));
    }

    public function rejectUpgrade(Request $request, int $requestId)
    {
        abort_unless(Schema::hasTable('affiliate_tier_upgrade_requests'), 503, 'Upgrade requests are not migrated yet.');
        DB::table('affiliate_tier_upgrade_requests')->where('id', $requestId)->update([
            'status' => 'rejected',
            'admin_notes' => (string) $request->input('notes', ''),
            'reviewed_by' => $this->adminUserId($request),
            'reviewed_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['status' => 'rejected']);
    }

    public function updateBonus(Request $request, int $bonusId)
    {
        abort_unless(Schema::hasTable('affiliate_monthly_bonuses'), 503, 'Monthly bonuses are not migrated yet.');
        $payload = $request->validate(['status' => ['required', 'in:approved,rejected,paid,cancelled'], 'notes' => ['nullable', 'string']]);
        $fields = ['status' => $payload['status'], 'review_notes' => $payload['notes'] ?? null, 'updated_at' => now()];
        if ($payload['status'] === 'approved') {
            $fields['approved_by'] = $this->adminUserId($request);
            $fields['approved_at'] = now();
        } elseif ($payload['status'] === 'rejected') {
            $fields['rejected_by'] = $this->adminUserId($request);
            $fields['rejected_at'] = now();
        } elseif ($payload['status'] === 'paid') {
            $fields['paid_by'] = $this->adminUserId($request);
            $fields['paid_at'] = now();
        }
        DB::table('affiliate_monthly_bonuses')->where('id', $bonusId)->update($fields);
        return response()->json(DB::table('affiliate_monthly_bonuses')->where('id', $bonusId)->first());
    }

    public function downgradeFromReview(Request $request, int $reviewId, AffiliateService $affiliates)
    {
        abort_unless(Schema::hasTable('affiliate_tier_reviews'), 503, 'Tier reviews are not migrated yet.');
        $review = DB::table('affiliate_tier_reviews')->where('id', $reviewId)->first();
        abort_unless($review, 404, 'Tier review not found.');
        $affiliate = Affiliate::findOrFail($review->affiliate_id);
        $newTier = match ($affiliate->tier) {
            'elite_partner' => 'ambassador',
            'ambassador' => 'campus_promoter',
            'campus_promoter' => 'starter',
            default => 'starter',
        };
        $config = $affiliates->tierConfig($newTier);
        $affiliate->update([
            'tier' => $newTier,
            'short_course_rate' => $config['firstPurchaseRate'],
            'recurring_commission_enabled' => (bool) $config['recurringEnabled'],
            'recurring_months' => (int) $config['recurringMonths'],
            'auto_payout_daily_limit' => $config['dailyPayoutLimit'],
            'last_tier_reviewed_at' => now(),
        ]);
        DB::table('affiliate_tier_reviews')->where('id', $reviewId)->update([
            'maintenance_status' => 'downgraded',
            'action_taken' => 'downgraded_to_' . $newTier,
            'reviewed_by' => $this->adminUserId($request),
            'updated_at' => now(),
        ]);
        return response()->json($this->mapAffiliate($affiliate->fresh(['user', 'earnings', 'payouts', 'referrals']), $affiliates));
    }

    private function mapAffiliate(Affiliate $affiliate, AffiliateService $affiliates): array
    {
        $tier = $affiliate->tier ?: 'starter';
        $month = (int) now()->month;
        $year = (int) now()->year;
        $monthlyChallenge = $this->monthlyChallenge($affiliate, $affiliates, $month, $year);
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
            'monthlyChallenge' => $monthlyChallenge,
            'tierLeaderboard' => $this->tierLeaderboard($tier, $month, $year),
            'tierHealth' => $this->tierHealth($affiliate, $affiliates, $month, $year),
            'badges' => $this->badgesForAffiliate($affiliate->id),
            'upgradeEligibility' => $this->upgradeEligibility($affiliate, $affiliates),
            'pendingUpgradeRequest' => $this->pendingUpgradeRequest($affiliate->id),
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

    private function calculateMonthlyScores(AffiliateService $affiliates, int $month, int $year, ?int $onlyAffiliateId = null): void
    {
        if (!Schema::hasTable('affiliate_monthly_scores')) {
            return;
        }

        $start = now()->setDate($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $query = Affiliate::query()->where('status', 'active');
        if ($onlyAffiliateId) {
            $query->where('id', $onlyAffiliateId);
        }

        $query->get()->each(function (Affiliate $affiliate) use ($affiliates, $month, $year, $start, $end) {
            $tier = $affiliate->tier ?: 'starter';
            $config = $affiliates->tierConfig($tier);
            $entryFees = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->where('source_type', self::ENTRY_SOURCE_TYPE)->whereBetween('created_at', [$start, $end])->count();
            $accessPayments = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->whereIn('source_type', self::ACCESS_SOURCE_TYPES)->whereBetween('created_at', [$start, $end])->count();
            $accessRevenue = (float) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->whereIn('source_type', self::ACCESS_SOURCE_TYPES)->whereBetween('created_at', [$start, $end])->sum('gross_amount');
            $required = $config['leaderboard'] ?? ['entryFees' => 5, 'accessPayments' => 3];
            $score = ($accessPayments * 20) + ((int) floor($accessRevenue / 100) * 5);
            $qualified = $entryFees >= (int) $required['entryFees'] && $accessPayments >= (int) $required['accessPayments'];

            DB::table('affiliate_monthly_scores')->updateOrInsert(
                ['affiliate_id' => $affiliate->id, 'month' => $month, 'year' => $year],
                [
                    'tier' => $tier,
                    'entry_fees_paid' => $entryFees,
                    'access_purchases_paid' => $accessPayments,
                    'access_revenue' => round($accessRevenue, 2),
                    'retained_learners' => 0,
                    'refund_count' => 0,
                    'risk_flags_count' => 0,
                    'score' => $score,
                    'qualified' => $qualified,
                    'calculated_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        });

        foreach (['starter', 'campus_promoter', 'ambassador', 'elite_partner'] as $tier) {
            $rows = DB::table('affiliate_monthly_scores')
                ->where('month', $month)
                ->where('year', $year)
                ->where('tier', $tier)
                ->where('qualified', true)
                ->orderByDesc('score')
                ->orderByDesc('access_revenue')
                ->orderByDesc('access_purchases_paid')
                ->get();
            $rank = 1;
            foreach ($rows as $row) {
                DB::table('affiliate_monthly_scores')->where('id', $row->id)->update(['rank' => $rank, 'updated_at' => now()]);
                if ($rank <= 3) {
                    $this->awardBadge((int) $row->affiliate_id, 'top_3_winner', 'Top 3 Winner', 'Finished in the monthly Top 3 for their tier.', $month, $year);
                }
                if ($rank === 1) {
                    $this->awardBadge((int) $row->affiliate_id, 'revenue_champion', 'Revenue Champion', 'Led their tier leaderboard.', $month, $year);
                }
                $rank++;
            }
            $this->createMonthlyBonuses($tier, $month, $year);
        }
    }

    private function calculateTierReviews(AffiliateService $affiliates, int $month, int $year): void
    {
        if (!Schema::hasTable('affiliate_tier_reviews')) {
            return;
        }
        $start = now()->setDate($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        Affiliate::where('status', 'active')->where('tier', '!=', 'starter')->get()->each(function (Affiliate $affiliate) use ($affiliates, $month, $year, $start, $end) {
            $config = $affiliates->tierConfig($affiliate->tier);
            $maintenance = $config['maintenance'] ?? ['entryFees' => 0, 'accessPayments' => 0];
            $entryFees = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->where('source_type', self::ENTRY_SOURCE_TYPE)->whereBetween('created_at', [$start, $end])->count();
            $accessPayments = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->whereIn('source_type', self::ACCESS_SOURCE_TYPES)->whereBetween('created_at', [$start, $end])->count();
            $accessRevenue = (float) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->whereIn('source_type', self::ACCESS_SOURCE_TYPES)->whereBetween('created_at', [$start, $end])->sum('gross_amount');
            $safe = $entryFees >= (int) ($maintenance['entryFees'] ?? 0) && $accessPayments >= (int) ($maintenance['accessPayments'] ?? 0);
            $status = $safe ? 'safe' : 'warning';
            $action = 'none';
            if (!$safe && $affiliate->tier === 'elite_partner') {
                $action = 'pause_recurring_after_second_missed_month';
            }
            DB::table('affiliate_tier_reviews')->updateOrInsert(
                ['affiliate_id' => $affiliate->id, 'month' => $month, 'year' => $year],
                [
                    'tier_at_review' => $affiliate->tier,
                    'entry_fees_paid' => $entryFees,
                    'access_purchases_paid' => $accessPayments,
                    'access_revenue' => round($accessRevenue, 2),
                    'refund_rate' => 0,
                    'risk_flags_count' => 0,
                    'maintenance_status' => $status,
                    'missed_months_count' => $safe ? 0 : 1,
                    'action_taken' => $action,
                    'notes' => $safe ? 'Monthly maintenance target met.' : 'Monthly maintenance target missed.',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        });
    }

    private function monthlyChallenge(Affiliate $affiliate, AffiliateService $affiliates, int $month, int $year): array
    {
        $tier = $affiliate->tier ?: 'starter';
        $config = $affiliates->tierConfig($tier);
        $required = $config['leaderboard'] ?? ['entryFees' => 5, 'accessPayments' => 3];
        $row = Schema::hasTable('affiliate_monthly_scores')
            ? DB::table('affiliate_monthly_scores')->where('affiliate_id', $affiliate->id)->where('month', $month)->where('year', $year)->first()
            : null;
        return [
            'tier' => $tier,
            'entryFeesPaid' => (int) ($row->entry_fees_paid ?? 0),
            'requiredEntryFees' => (int) $required['entryFees'],
            'accessPaymentsPaid' => (int) ($row->access_purchases_paid ?? 0),
            'requiredAccessPayments' => (int) $required['accessPayments'],
            'accessRevenue' => (float) ($row->access_revenue ?? 0),
            'qualified' => (bool) ($row->qualified ?? false),
            'rank' => $row?->rank ? (int) $row->rank : null,
            'score' => (int) ($row->score ?? 0),
            'pointsToTopThree' => $this->pointsToTopThree($tier, $month, $year, (int) ($row->score ?? 0)),
        ];
    }

    private function tierLeaderboard(string $tier, int $month, int $year): array
    {
        if (!Schema::hasTable('affiliate_monthly_scores')) {
            return [];
        }
        return DB::table('affiliate_monthly_scores')
            ->join('affiliates', 'affiliates.id', '=', 'affiliate_monthly_scores.affiliate_id')
            ->leftJoin('affiliate_monthly_bonuses', function ($join) {
                $join->on('affiliate_monthly_bonuses.monthly_score_id', '=', 'affiliate_monthly_scores.id');
            })
            ->where('affiliate_monthly_scores.tier', $tier)
            ->where('affiliate_monthly_scores.month', $month)
            ->where('affiliate_monthly_scores.year', $year)
            ->orderByRaw('affiliate_monthly_scores.rank is null')
            ->orderBy('affiliate_monthly_scores.rank')
            ->orderByDesc('affiliate_monthly_scores.score')
            ->limit(100)
            ->get([
                'affiliate_monthly_scores.rank',
                'affiliates.display_name as affiliateName',
                'affiliate_monthly_scores.access_purchases_paid as accessPaymentsPaid',
                'affiliate_monthly_scores.access_revenue as accessRevenue',
                'affiliate_monthly_scores.score',
                'affiliate_monthly_scores.qualified',
                'affiliate_monthly_bonuses.bonus_amount as prizeAmount',
                'affiliate_monthly_bonuses.status as prizeStatus',
            ])
            ->map(fn ($row) => [
                'rank' => $row->rank ? (int) $row->rank : null,
                'affiliateName' => $row->affiliateName,
                'badges' => $row->rank && (int) $row->rank <= 3 ? ['Top 3 Winner'] : [],
                'accessPaymentsPaid' => (int) $row->accessPaymentsPaid,
                'accessRevenue' => (float) $row->accessRevenue,
                'score' => (int) $row->score,
                'qualified' => (bool) $row->qualified,
                'prizeAmount' => (float) ($row->prizeAmount ?? 0),
                'prizeStatus' => $row->prizeStatus,
            ])->all();
    }

    private function adminLeaderboards(int $month, int $year): array
    {
        return collect(['starter', 'campus_promoter', 'ambassador', 'elite_partner'])
            ->mapWithKeys(fn ($tier) => [$tier => $this->tierLeaderboard($tier, $month, $year)])
            ->all();
    }

    private function createMonthlyBonuses(string $tier, int $month, int $year): void
    {
        if (!Schema::hasTable('affiliate_monthly_bonuses') || !Schema::hasTable('finance_bucket_balances')) {
            return;
        }
        $bucketKey = match ($tier) {
            'campus_promoter' => 'campus_leaderboard_pool',
            'ambassador' => 'ambassador_leaderboard_pool',
            'elite_partner' => 'elite_leaderboard_pool',
            default => 'starter_leaderboard_pool',
        };
        $pool = (float) (DB::table('finance_bucket_balances')->where('bucket_key', $bucketKey)->value('balance') ?? 0);
        $shares = [1 => 0.50, 2 => 0.30, 3 => 0.20];
        $rows = DB::table('affiliate_monthly_scores')->where('month', $month)->where('year', $year)->where('tier', $tier)->whereIn('rank', [1, 2, 3])->get();
        foreach ($rows as $row) {
            $amount = round($pool * ($shares[(int) $row->rank] ?? 0), 2);
            DB::table('affiliate_monthly_bonuses')->updateOrInsert(
                ['affiliate_id' => $row->affiliate_id, 'monthly_score_id' => $row->id],
                [
                    'month' => $month,
                    'year' => $year,
                    'tier' => $tier,
                    'rank' => $row->rank,
                    'bonus_amount' => $amount,
                    'currency' => 'ZMW',
                    'status' => 'pending_review',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function upgradeEligibility(Affiliate $affiliate, AffiliateService $affiliates): array
    {
        $tier = $affiliate->tier ?: 'starter';
        $config = $affiliates->tierConfig($tier);
        $nextTier = $config['nextTier'] ?? null;
        $requirements = match ($tier) {
            'campus_promoter' => ['accessPayments' => 50, 'accessRevenue' => 5000, 'activeMonths' => 2],
            'ambassador' => ['accessPayments' => 150, 'accessRevenue' => 15000, 'activeMonths' => 3],
            default => ['accessPayments' => 10, 'accessRevenue' => 1000, 'activeMonths' => 1],
        };
        $accessPayments = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->whereIn('source_type', self::ACCESS_SOURCE_TYPES)->count();
        $accessRevenue = (float) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->whereIn('source_type', self::ACCESS_SOURCE_TYPES)->sum('gross_amount');
        $activeMonths = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->selectRaw('count(distinct DATE_FORMAT(created_at, "%Y-%m")) as months')->value('months') ?: 0;
        $eligible = (bool) ($nextTier && $accessPayments >= $requirements['accessPayments'] && $accessRevenue >= $requirements['accessRevenue'] && $activeMonths >= $requirements['activeMonths']);
        return [
            'currentTier' => $tier,
            'nextTier' => $nextTier,
            'eligible' => $eligible,
            'accessPayments' => $accessPayments,
            'requiredAccessPayments' => $requirements['accessPayments'],
            'accessRevenue' => $accessRevenue,
            'requiredAccessRevenue' => $requirements['accessRevenue'],
            'activeMonths' => (int) $activeMonths,
            'requiredActiveMonths' => $requirements['activeMonths'],
            'cleanStatus' => true,
        ];
    }

    private function tierHealth(Affiliate $affiliate, AffiliateService $affiliates, int $month, int $year): array
    {
        if (Schema::hasTable('affiliate_tier_reviews')) {
            $row = DB::table('affiliate_tier_reviews')->where('affiliate_id', $affiliate->id)->where('month', $month)->where('year', $year)->first();
            if ($row) {
                return ['status' => $row->maintenance_status, 'missedMonths' => (int) $row->missed_months_count, 'message' => $row->notes];
            }
        }
        $tier = $affiliate->tier ?: 'starter';
        if ($tier === 'starter') {
            return ['status' => 'safe', 'missedMonths' => 0, 'message' => 'Starter tier has no downgrade maintenance target.'];
        }
        $config = $affiliates->tierConfig($tier);
        return ['status' => 'safe', 'missedMonths' => 0, 'message' => 'Maintenance target will be reviewed monthly.', 'requirements' => $config['maintenance'] ?? []];
    }

    private function pointsToTopThree(string $tier, int $month, int $year, int $score): int
    {
        if (!Schema::hasTable('affiliate_monthly_scores')) {
            return 0;
        }
        $third = DB::table('affiliate_monthly_scores')->where('tier', $tier)->where('month', $month)->where('year', $year)->where('rank', 3)->value('score');
        return $third ? max(0, ((int) $third + 1) - $score) : 0;
    }

    private function badgesForAffiliate(int $affiliateId): array
    {
        if (!Schema::hasTable('affiliate_badges')) {
            return [];
        }
        return DB::table('affiliate_badges')->where('affiliate_id', $affiliateId)->latest('created_at')->limit(20)->get()->map(fn ($row) => [
            'badgeKey' => $row->badge_key,
            'badgeLabel' => $row->badge_label,
            'badgeDescription' => $row->badge_description,
            'earnedForMonth' => $row->earned_for_month,
            'earnedForYear' => $row->earned_for_year,
        ])->all();
    }

    private function awardBadge(int $affiliateId, string $key, string $label, string $description, int $month, int $year): void
    {
        if (!Schema::hasTable('affiliate_badges')) {
            return;
        }
        DB::table('affiliate_badges')->updateOrInsert(
            ['affiliate_id' => $affiliateId, 'badge_key' => $key, 'earned_for_month' => $month, 'earned_for_year' => $year],
            ['badge_label' => $label, 'badge_description' => $description, 'metadata' => json_encode([]), 'updated_at' => now(), 'created_at' => now()]
        );
    }

    private function pendingUpgradeRequest(int $affiliateId): ?object
    {
        if (!Schema::hasTable('affiliate_tier_upgrade_requests')) {
            return null;
        }
        return DB::table('affiliate_tier_upgrade_requests')->where('affiliate_id', $affiliateId)->where('status', 'pending')->latest('created_at')->first();
    }

    private function adminTable(string $table): array
    {
        if (!Schema::hasTable($table)) {
            return [];
        }
        return DB::table($table)->latest('created_at')->limit(100)->get()->map(fn ($row) => (array) $row)->all();
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
