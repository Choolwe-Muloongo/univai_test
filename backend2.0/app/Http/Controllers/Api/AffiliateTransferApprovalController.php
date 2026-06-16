<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliatePayout;
use App\Services\LencoPaymentService;
use App\Support\Affiliates\AffiliateService;
use Illuminate\Http\Request;

class AffiliateTransferApprovalController extends Controller
{
    public function __invoke(Request $request, AffiliatePayout $payout, AffiliateService $affiliates, LencoPaymentService $lenco)
    {
        if (!in_array($payout->status, ['pending', 'pending_review', 'processing'], true)) {
            return response()->json([
                'message' => 'This withdrawal cannot be approved in its current status.',
                'withdrawal' => $this->mapWithdrawal($payout),
            ], 422);
        }

        $approved = $affiliates->sendPayoutToLenco($payout, $lenco, $this->adminUserId($request));

        return response()->json($this->mapWithdrawal($approved));
    }

    private function mapWithdrawal(AffiliatePayout $payout): array
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
            'completedAt' => optional($payout->completed_at)->toISOString(),
        ];
    }

    private function adminUserId(Request $request): ?int
    {
        $user = $request->session()->get('user');
        $id = is_array($user) ? ($user['id'] ?? null) : null;
        return is_numeric($id) ? (int) $id : null;
    }
}
