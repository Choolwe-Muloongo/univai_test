<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            return (int) $sessionUser['id'];
        }

        if (is_array($sessionUser) && !empty($sessionUser['email'])) {
            $user = User::where('email', $sessionUser['email'])->first();
            return $user?->id;
        }

        return null;
    }
}
