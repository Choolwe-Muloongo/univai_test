<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashbackLedger;
use App\Models\User;
use App\Models\WalletSetting;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(null, 404);
        }

        $settings = WalletSetting::where('user_id', $userId)->first();
        if (!$settings) {
            return response()->json([
                'walletAddress' => null,
                'payoutCurrency' => 'AFTA',
                'status' => 'not_set',
            ]);
        }

        return response()->json([
            'walletAddress' => $settings->wallet_address,
            'payoutCurrency' => $settings->payout_currency,
            'status' => $settings->status,
        ]);
    }


    public function cashback(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) {
            return response()->json(['eligible' => false, 'summary' => [], 'entries' => []], 404);
        }

        $role = strtolower((string) $user->role);
        if (str_contains($role, 'free') || str_contains($role, 'freemium')) {
            return [
                'eligible' => false,
                'message' => 'Free students are excluded from cashback rewards.',
                'summary' => $this->emptyCashbackSummary(),
                'entries' => [],
            ];
        }

        $entries = CashbackLedger::query()
            ->where('user_id', $user->id)
            ->with(['invoice:id,title', 'payment:id,paid_at'])
            ->orderByDesc('created_at')
            ->get();

        $summary = $this->emptyCashbackSummary();
        foreach ($entries as $entry) {
            $summary[$entry->status] = number_format((float) ($summary[$entry->status] ?? '0.00') + (float) $entry->amount, 2, '.', '');
        }

        return [
            'eligible' => true,
            'summary' => $summary,
            'entries' => $entries->map(fn (CashbackLedger $entry) => [
                'id' => $entry->id,
                'invoiceId' => $entry->invoice_id,
                'paymentId' => $entry->payment_id,
                'invoiceTitle' => $entry->invoice?->title,
                'source' => $entry->source,
                'status' => $entry->status,
                'amount' => (string) $entry->amount,
                'currency' => $entry->currency,
                'description' => $entry->description,
                'lockedAt' => optional($entry->locked_at)->toISOString(),
                'earnedAt' => optional($entry->earned_at)->toISOString(),
                'approvedAt' => optional($entry->approved_at)->toISOString(),
                'paidAt' => optional($entry->paid_at ?? $entry->payment?->paid_at)->toISOString(),
                'cancelledAt' => optional($entry->cancelled_at)->toISOString(),
                'expiredAt' => optional($entry->expired_at)->toISOString(),
                'expiresAt' => optional($entry->expires_at)->toISOString(),
            ]),
        ];
    }

    public function update(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $payload = $request->validate([
            'walletAddress' => ['required', 'string'],
            'payoutCurrency' => ['required', 'string'],
        ]);

        $settings = WalletSetting::updateOrCreate(
            ['user_id' => $userId],
            [
                'wallet_address' => $payload['walletAddress'],
                'payout_currency' => $payload['payoutCurrency'],
                'status' => 'pending',
            ]
        );

        return response()->json([
            'walletAddress' => $settings->wallet_address,
            'payoutCurrency' => $settings->payout_currency,
            'status' => $settings->status,
        ]);
    }

    private function resolveUserId(Request $request): ?int
    {
        return $this->resolveUser($request)?->id;
    }

    private function resolveUser(Request $request): ?User
    {
        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            return User::find((int) $sessionUser['id']);
        }

        if (is_array($sessionUser) && !empty($sessionUser['email'])) {
            return User::where('email', $sessionUser['email'])->first();
        }

        return null;
    }

    private function emptyCashbackSummary(): array
    {
        return [
            CashbackLedger::STATUS_LOCKED => '0.00',
            CashbackLedger::STATUS_EARNED => '0.00',
            CashbackLedger::STATUS_APPROVED => '0.00',
            CashbackLedger::STATUS_PAID => '0.00',
            CashbackLedger::STATUS_CANCELLED => '0.00',
            CashbackLedger::STATUS_EXPIRED => '0.00',
        ];
    }
}
