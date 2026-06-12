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
    public function recordShortCourseCommission(Affiliate $affiliate, Invoice $invoice, Payment $payment, array $context = []): ?AffiliateEarning
    {
        $metadata = $invoice->metadata ?? [];
        $studentId = (int) $invoice->student_id;
        $tier = $this->tierConfig($affiliate->tier);
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
        $rate = max(0, (float) ($affiliate->short_course_rate ?? $tier['firstPurchaseRate']));
        $fixedCommission = null;

        if ($invoice->type === 'short_course_entry') {
            $sourceType = self::SOURCE_SHORT_COURSE_ENTRY;
            $rate = 0;
            $fixedCommission = (float) $tier['entryBonus'];
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
            $sourceReference = $sourceReference . ':renewal:' . $invoice->id;
        }

        $commission = $fixedCommission !== null ? $fixedCommission : round(($gross * $rate) / 100, 2);
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
                    'tier' => $affiliate->tier ?: 'starter',
                    'fixed_commission' => $fixedCommission,
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
}
