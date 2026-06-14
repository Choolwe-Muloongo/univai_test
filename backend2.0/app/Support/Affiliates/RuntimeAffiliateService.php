<?php

namespace App\Support\Affiliates;

use App\Models\Affiliate;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Models\AffiliateReferral;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;

class RuntimeAffiliateService extends AffiliateService
{
    public function tierConfig(?string $tier): array
    {
        return match ($tier ?: 'starter') {
            'campus_promoter' => [
                'label' => 'Campus Promoter',
                'entryBonus' => 1,
                'entryRate' => 10,
                'entryMin' => 1,
                'entryMax' => 5,
                'firstPurchaseRate' => 20,
                'accessMin' => 7,
                'accessCapRate' => 28,
                'recurringEnabled' => false,
                'recurringRate' => 0,
                'recurringMonths' => 0,
                'dailyPayoutLimit' => 300,
                'nextTier' => 'ambassador',
                'requirements' => ['paidReferrals' => 50, 'referredRevenue' => 5000, 'retentionRate' => 0],
                'leaderboard' => ['entryFees' => 12, 'accessPayments' => 7],
                'maintenance' => ['entryFees' => 5, 'accessPayments' => 2],
            ],
            'ambassador' => [
                'label' => 'UnivAI Ambassador',
                'entryBonus' => 1,
                'entryRate' => 10,
                'entryMin' => 1,
                'entryMax' => 5,
                'firstPurchaseRate' => 25,
                'accessMin' => 8,
                'accessCapRate' => 30,
                'recurringEnabled' => false,
                'recurringRate' => 0,
                'recurringMonths' => 0,
                'dailyPayoutLimit' => 700,
                'nextTier' => 'elite_partner',
                'requirements' => ['paidReferrals' => 150, 'referredRevenue' => 15000, 'retentionRate' => 0],
                'leaderboard' => ['entryFees' => 25, 'accessPayments' => 15],
                'maintenance' => ['entryFees' => 15, 'accessPayments' => 7],
            ],
            'elite_partner' => [
                'label' => 'Elite Affiliate',
                'entryBonus' => 1,
                'entryRate' => 10,
                'entryMin' => 1,
                'entryMax' => 5,
                'firstPurchaseRate' => 25,
                'accessMin' => 9,
                'accessCapRate' => 30,
                'recurringEnabled' => true,
                'recurringRate' => 5,
                'recurringMonths' => 12,
                'dailyPayoutLimit' => 2000,
                'nextTier' => null,
                'requirements' => ['paidReferrals' => 150, 'referredRevenue' => 15000, 'retentionRate' => 0],
                'leaderboard' => ['entryFees' => 50, 'accessPayments' => 30],
                'maintenance' => ['entryFees' => 30, 'accessPayments' => 15],
            ],
            default => [
                'label' => 'Starter Affiliate',
                'entryBonus' => 1,
                'entryRate' => 10,
                'entryMin' => 1,
                'entryMax' => 5,
                'firstPurchaseRate' => 15,
                'accessMin' => 5,
                'accessCapRate' => 25,
                'recurringEnabled' => false,
                'recurringRate' => 0,
                'recurringMonths' => 0,
                'dailyPayoutLimit' => 100,
                'nextTier' => 'campus_promoter',
                'requirements' => ['paidReferrals' => 10, 'referredRevenue' => 1000, 'retentionRate' => 0],
                'leaderboard' => ['entryFees' => 5, 'accessPayments' => 3],
                'maintenance' => ['entryFees' => 0, 'accessPayments' => 0],
            ],
        };
    }

    public function recordShortCourseCommission(Affiliate $affiliate, Invoice $invoice, Payment $payment, array $context = []): ?AffiliateEarning
    {
        $metadata = $invoice->metadata ?? [];
        $studentId = (int) $invoice->student_id;
        $tierKey = $affiliate->tier ?: 'starter';
        $tier = $this->tierConfig($tierKey);
        $gross = (float) $payment->amount;
        $courseId = (string) ($metadata['short_course_id'] ?? '');
        if ($courseId === '' && isset($metadata['short_course_ids']) && is_array($metadata['short_course_ids']) && count($metadata['short_course_ids']) > 0) {
            $courseId = (string) $metadata['short_course_ids'][0];
        }
        $sourceReference = $courseId !== '' ? $courseId : ('bundle:' . (string) ($metadata['bundle_plan'] ?? 'short-course-bundle'));
        if ($sourceReference === 'bundle:') {
            return null;
        }

        $alreadyFirstPurchase = AffiliateEarning::query()
            ->where('referred_user_id', $studentId)
            ->where('source_type', self::SOURCE_SHORT_COURSE)
            ->exists();

        $sourceType = self::SOURCE_SHORT_COURSE;
        $rate = (float) $tier['firstPurchaseRate'];
        $commission = $this->calculateAccessCommission($gross, $tier);

        if ($invoice->type === 'short_course_entry') {
            $sourceType = self::SOURCE_SHORT_COURSE_ENTRY;
            $rate = (float) ($tier['entryRate'] ?? 10);
            $commission = $this->calculateEntryCommission($gross, $tier);
            $sourceReference = 'entry:' . $sourceReference;
            if (AffiliateEarning::query()->where('referred_user_id', $studentId)->where('source_type', self::SOURCE_SHORT_COURSE_ENTRY)->exists()) {
                return null;
            }
        } elseif ($alreadyFirstPurchase) {
            if (empty($affiliate->recurring_commission_enabled)) {
                return null;
            }
            $firstPaidAt = AffiliateReferral::query()
                ->where('affiliate_id', $affiliate->id)
                ->where('referred_user_id', $studentId)
                ->where('source_type', self::SOURCE_SHORT_COURSE)
                ->whereNotNull('first_paid_at')
                ->min('first_paid_at');
            if ($firstPaidAt && now()->diffInMonths($firstPaidAt) >= (int) ($affiliate->recurring_months ?: $tier['recurringMonths'])) {
                return null;
            }
            $sourceType = self::SOURCE_SHORT_COURSE_RECURRING;
            $rate = (float) $tier['recurringRate'];
            $commission = round(($gross * $rate) / 100, 2);
            $sourceReference = $sourceReference . ':renewal:' . $invoice->id;
        }

        if ($commission <= 0) {
            return null;
        }

        $earning = AffiliateEarning::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'source_type' => $sourceType,
                'source_reference' => $sourceReference,
                'payment_id' => $payment->id,
            ],
            [
                'referred_user_id' => $studentId,
                'invoice_id' => $invoice->id,
                'gross_amount' => $gross,
                'commission_rate' => $rate,
                'commission_amount' => $commission,
                'currency' => strtoupper($payment->currency ?? $invoice->currency ?? 'ZMW'),
                'status' => 'available',
                'metadata' => array_merge($context, [
                    'short_course_id' => $courseId ?: null,
                    'short_course_ids' => $metadata['short_course_ids'] ?? null,
                    'invoice_type' => $invoice->type,
                    'tier' => $tierKey,
                    'entry_commission_rule' => '10_percent_min_1_max_5',
                    'access_commission_rule' => 'tier_rate_with_minimum_and_cap',
                ]),
            ]
        );

        AffiliateReferral::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'referred_user_id' => $studentId,
                'source_type' => self::SOURCE_SHORT_COURSE,
                'source_reference' => $sourceReference,
            ],
            [
                'referral_code' => $affiliate->code,
                'first_paid_at' => now(),
                'metadata' => ['invoice_id' => $invoice->id, 'status' => 'paid'],
            ]
        );

        return $earning;
    }

    public function summaryForAffiliate(Affiliate $affiliate): array
    {
        $available = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->where('status', 'available')->sum('commission_amount');
        $reserved = AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->whereIn('status', ['pending', 'pending_review', 'processing', 'successful'])->sum('amount');
        $paidReferralCount = AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->distinct('referred_user_id')->count('referred_user_id');
        $referralUserIds = AffiliateReferral::query()
            ->where('affiliate_id', $affiliate->id)
            ->whereNotNull('referred_user_id')
            ->pluck('referred_user_id');
        $codeSignupUserIds = User::query()
            ->where('referred_by_affiliate_code', $affiliate->code)
            ->pluck('id');
        $verifiedSignupCount = $referralUserIds->merge($codeSignupUserIds)->filter()->unique()->count();

        return [
            'grossEarned' => (string) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->sum('gross_amount'),
            'commissionEarned' => (string) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->sum('commission_amount'),
            'availableToWithdraw' => (string) max(0, $available - $reserved),
            'pendingPayouts' => (string) AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->whereIn('status', ['pending', 'pending_review'])->sum('amount'),
            'processingPayouts' => (string) AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->where('status', 'processing')->sum('amount'),
            'successfulPayouts' => (string) AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->where('status', 'successful')->sum('amount'),
            'verifiedSignups' => $verifiedSignupCount,
            'paidReferrals' => $paidReferralCount,
        ];
    }

    private function calculateEntryCommission(float $gross, array $tier): float
    {
        $raw = round(($gross * (float) ($tier['entryRate'] ?? 10)) / 100, 2);
        return round(min(max($raw, (float) ($tier['entryMin'] ?? 1)), (float) ($tier['entryMax'] ?? 5), $gross), 2);
    }

    private function calculateAccessCommission(float $gross, array $tier): float
    {
        $raw = round(($gross * (float) ($tier['firstPurchaseRate'] ?? 15)) / 100, 2);
        $cap = round(($gross * (float) ($tier['accessCapRate'] ?? 25)) / 100, 2);
        return round(min(max($raw, (float) ($tier['accessMin'] ?? 5)), $cap, $gross), 2);
    }
}
