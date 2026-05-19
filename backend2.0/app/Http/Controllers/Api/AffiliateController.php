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
        $items = Affiliate::with(['user', 'earnings', 'payouts'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Affiliate $affiliate) => $this->mapAffiliate($affiliate, $affiliates));

        return response()->json([
            'affiliates' => $items->values(),
            'summary' => [
                'count' => $items->count(),
                'active' => $items->where('status', 'active')->count(),
                'totalAvailable' => (string) $items->sum(fn ($item) => (float) ($item['summary']['availableToWithdraw'] ?? 0)),
            ],
        ]);
    }

    public function me(Request $request, AffiliateService $affiliates)
    {
        $user = $request->session()->get('user');
        $userId = is_array($user) ? ($user['id'] ?? null) : null;
        if (!$userId || !is_numeric($userId)) {
            return response()->json(null, 404);
        }

        $affiliate = Affiliate::with(['user', 'earnings', 'payouts'])->where('user_id', $userId)->first();
        if (!$affiliate) {
            return response()->json(null, 404);
        }

        return response()->json($this->mapAffiliate($affiliate, $affiliates));
    }

    public function store(Request $request, AffiliateService $affiliates)
    {
        $payload = $request->validate([
            'userId' => ['nullable', 'integer', 'exists:users,id'],
            'code' => ['nullable', 'string', 'min:4', 'max:32'],
            'displayName' => ['required', 'string', 'min:2'],
            'scope' => ['nullable', 'in:all,formal_programmes,short_courses'],
            'status' => ['nullable', 'in:active,inactive,pending'],
            'formalProgrammeRate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'shortCourseRate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lencoAccountId' => ['nullable', 'string'],
            'payoutPhone' => ['nullable', 'string'],
            'payoutOperator' => ['nullable', 'string'],
            'payoutCountry' => ['nullable', 'string', 'max:5'],
            'notes' => ['nullable', 'string'],
        ]);

        $code = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '', (string) ($payload['code'] ?? '')) ?: Str::random(8));
        $lookup = isset($payload['userId']) && $payload['userId']
            ? ['user_id' => $payload['userId']]
            : ['code' => $code];

        $affiliate = Affiliate::updateOrCreate(
            $lookup,
            [
                'user_id' => $payload['userId'] ?? null,
                'code' => $code,
                'display_name' => $payload['displayName'],
                'scope' => $payload['scope'] ?? 'all',
                'status' => $payload['status'] ?? 'active',
                'formal_programme_rate' => $payload['formalProgrammeRate'] ?? 10,
                'short_course_rate' => $payload['shortCourseRate'] ?? 5,
                'lenco_account_id' => $payload['lencoAccountId'] ?? null,
                'payout_phone' => $payload['payoutPhone'] ?? null,
                'payout_operator' => $payload['payoutOperator'] ?? null,
                'payout_country' => $payload['payoutCountry'] ?? 'zm',
                'notes' => $payload['notes'] ?? null,
                'approved_at' => ($payload['status'] ?? 'active') === 'active' ? now() : null,
            ]
        );

        return response()->json($this->mapAffiliate($affiliate->fresh(['user', 'earnings', 'payouts']), $affiliates), 201);
    }

    public function show(Affiliate $affiliate, AffiliateService $affiliates)
    {
        return response()->json($this->mapAffiliate($affiliate->load(['user', 'earnings', 'payouts']), $affiliates));
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
        return [
            'id' => $affiliate->id,
            'userId' => $affiliate->user_id,
            'userName' => $affiliate->user?->name,
            'userEmail' => $affiliate->user?->email,
            'code' => $affiliate->code,
            'displayName' => $affiliate->display_name,
            'scope' => $affiliate->scope,
            'status' => $affiliate->status,
            'formalProgrammeRate' => (float) $affiliate->formal_programme_rate,
            'shortCourseRate' => (float) $affiliate->short_course_rate,
            'payoutPhone' => $affiliate->payout_phone,
            'payoutOperator' => $affiliate->payout_operator,
            'payoutCountry' => $affiliate->payout_country,
            'summary' => $affiliates->summaryForAffiliate($affiliate),
            'recentEarnings' => $affiliate->earnings->sortByDesc('created_at')->take(8)->values()->map(fn ($earning) => [
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
            'recentPayouts' => $affiliate->payouts->sortByDesc('created_at')->take(8)->values()->map(fn ($payout) => $this->mapPayout($payout))->values(),
        ];
    }

    private function mapPayout(AffiliatePayout $payout): array
    {
        return [
            'id' => $payout->id,
            'reference' => $payout->reference,
            'affiliateId' => $payout->affiliate_id,
            'amount' => (string) $payout->amount,
            'fee' => (string) $payout->fee,
            'currency' => $payout->currency,
            'method' => $payout->method,
            'phone' => $payout->phone,
            'operator' => $payout->operator,
            'country' => $payout->country,
            'status' => $payout->status,
            'lencoReference' => $payout->lenco_reference,
            'failureReason' => $payout->failure_reason,
            'requestedAt' => optional($payout->requested_at)->toISOString(),
            'completedAt' => optional($payout->completed_at)->toISOString(),
        ];
    }

    private function adminUserId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        if (!is_array($sessionUser) || !isset($sessionUser['id']) || !is_numeric($sessionUser['id'])) {
            return null;
        }

        return (int) $sessionUser['id'];
    }
}
