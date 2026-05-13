<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Http\Request;

class PaymentMethodsController extends Controller
{
    public function index(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return [];
        }

        return PaymentMethod::where('user_id', $userId)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PaymentMethod $method) => $this->mapMethod($method));
    }

    public function store(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $payload = $request->validate([
            'type' => ['required', 'string'],
            'provider' => ['required', 'string'],
            'last4' => ['required', 'string', 'max:4'],
            'expiryMonth' => ['nullable', 'integer'],
            'expiryYear' => ['nullable', 'integer'],
            'isDefault' => ['nullable', 'boolean'],
        ]);

        if (!empty($payload['isDefault'])) {
            PaymentMethod::where('user_id', $userId)->update(['is_default' => false]);
        }

        $method = PaymentMethod::create([
            'user_id' => $userId,
            'type' => $payload['type'],
            'provider' => $payload['provider'],
            'last4' => $payload['last4'],
            'expiry_month' => $payload['expiryMonth'] ?? null,
            'expiry_year' => $payload['expiryYear'] ?? null,
            'is_default' => (bool) ($payload['isDefault'] ?? false),
            'status' => 'active',
        ]);

        return $this->mapMethod($method);
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId || $paymentMethod->user_id !== $userId) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $payload = $request->validate([
            'isDefault' => ['required', 'boolean'],
        ]);

        if ($payload['isDefault']) {
            PaymentMethod::where('user_id', $userId)->update(['is_default' => false]);
        }

        $paymentMethod->update(['is_default' => $payload['isDefault']]);

        return $this->mapMethod($paymentMethod);
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId || $paymentMethod->user_id !== $userId) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $paymentMethod->delete();
        return response()->noContent();
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

    private function mapMethod(PaymentMethod $method): array
    {
        return [
            'id' => $method->id,
            'type' => $method->type,
            'provider' => $method->provider,
            'last4' => $method->last4,
            'expiryMonth' => $method->expiry_month,
            'expiryYear' => $method->expiry_year,
            'isDefault' => (bool) $method->is_default,
            'status' => $method->status,
        ];
    }
}
