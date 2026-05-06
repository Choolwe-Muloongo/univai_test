<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PremiumSubscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PremiumSubscriptionService
{
    public const CASHBACK_RATE = 0.40;

    /**
     * @return array{subscription: PremiumSubscription, cashbackCreated: bool, cashbackAmount: float}
     */
    public function activateFromSuccessfulPayment(User $user, Payment $payment): array
    {
        return DB::transaction(function () use ($user, $payment) {
            $payment->loadMissing('invoice');

            $user->update(['role' => 'premium-student']);

            $subscription = PremiumSubscription::query()->firstOrNew(['user_id' => $user->id]);
            $cashbackCreated = $this->shouldCreateCashback($user, $payment, $subscription);
            $cashbackAmount = $cashbackCreated ? $this->cashbackAmount($payment) : 0.0;

            $subscription->fill([
                'payment_id' => $payment->id,
                'status' => PremiumSubscription::STATUS_ACTIVE,
                'entitlements' => $this->premiumEntitlements(),
                'premium_features_unlocked' => true,
                'entitlements_activated_at' => $subscription->entitlements_activated_at ?? now(),
                'trial_ends_at' => null,
                'current_period_ends_at' => now()->addYear(),
                'past_due_at' => null,
                'expired_at' => null,
                'cancelled_at' => null,
                'suspended_at' => null,
                'cashback_amount' => $cashbackCreated ? $cashbackAmount : $subscription->cashback_amount,
                'cashback_currency' => 'AFTA',
                'cashback_status' => $cashbackCreated ? 'created' : ($subscription->cashback_status ?: 'not_qualified'),
                'cashback_created_at' => $cashbackCreated ? now() : $subscription->cashback_created_at,
            ]);
            $subscription->save();

            return [
                'subscription' => $subscription->refresh(),
                'cashbackCreated' => $cashbackCreated,
                'cashbackAmount' => $cashbackAmount,
            ];
        });
    }

    public function paymentUnlocksPremium(Payment $payment): bool
    {
        $payment->loadMissing('invoice');
        $invoice = $payment->invoice;

        return $invoice instanceof Invoice
            && $payment->status === 'completed'
            && (float) $payment->amount > 0
            && $invoice->status === 'paid'
            && $this->isPremiumInvoice($invoice);
    }

    public function trialFor(User $user): PremiumSubscription
    {
        return PremiumSubscription::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'status' => PremiumSubscription::STATUS_TRIAL,
                'entitlements' => [],
                'premium_features_unlocked' => false,
                'trial_ends_at' => now()->addDays(14),
                'cashback_status' => 'not_qualified',
            ]
        );
    }

    /**
     * @return string[]
     */
    public function premiumEntitlements(): array
    {
        return [
            'courses.unlimited',
            'ai_tutor.full_access',
            'study_planner.full_access',
            'certificates.verified',
            'community.posting_and_messaging',
            'career_hub.full_access',
            'wallet.aftacoin_rewards',
        ];
    }

    public function mapSubscription(PremiumSubscription $subscription): array
    {
        return [
            'id' => $subscription->id,
            'status' => $subscription->status,
            'statusLabel' => str($subscription->status)->replace('_', ' ')->title()->toString(),
            'entitlements' => $subscription->entitlements ?? [],
            'premiumFeaturesUnlocked' => $subscription->premium_features_unlocked,
            'entitlementsActivatedAt' => optional($subscription->entitlements_activated_at)->toISOString(),
            'trialEndsAt' => optional($subscription->trial_ends_at)->toISOString(),
            'currentPeriodEndsAt' => optional($subscription->current_period_ends_at)->toISOString(),
            'cashbackAmount' => (string) $subscription->cashback_amount,
            'cashbackCurrency' => $subscription->cashback_currency,
            'cashbackStatus' => $subscription->cashback_status,
            'cashbackCreatedAt' => optional($subscription->cashback_created_at)->toISOString(),
            'availableStates' => PremiumSubscription::STATUSES,
        ];
    }

    private function shouldCreateCashback(User $user, Payment $payment, PremiumSubscription $subscription): bool
    {
        $invoice = $payment->invoice;

        if (!$invoice instanceof Invoice) {
            return false;
        }

        if (!$this->paymentUnlocksPremium($payment)) {
            return false;
        }

        if ($subscription->exists && $subscription->cashback_status === 'created') {
            return false;
        }

        return in_array($user->role, ['freemium-student', 'student', 'applicant', 'premium-student'], true);
    }

    private function isPremiumInvoice(Invoice $invoice): bool
    {
        return preg_match('/premium|tuition|school fee|school fees/i', $invoice->title) === 1;
    }

    private function cashbackAmount(Payment $payment): float
    {
        return round((float) $payment->amount * self::CASHBACK_RATE, 2);
    }
}
