<?php

namespace App\Support\Payments;

use App\Models\AffiliateEarning;
use App\Models\Application;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ShortCourseEnrollment;
use App\Support\Affiliates\AffiliateService;
use App\Support\Finance\FormalFinancialClearance;
use App\Support\Pricing\ShortCourseAccessPlans;
use App\Support\Payments\PaymentReceiptMailer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PaidInvoiceUnlocker
{
    public function markPaidForTesting(Invoice $invoice, string $reason = 'Lenco collections are disabled for testing.'): Invoice
    {
        $reference = $invoice->transaction_reference ?: 'test-' . Str::orderedUuid();
        $mode = PaymentSettings::mode();

        $invoice->forceFill([
            'paid_amount' => $invoice->amount,
            'status' => 'paid',
            'is_test' => true,
            'payment_mode' => $mode,
            'paid_at' => now(),
            'transaction_reference' => $reference,
            'checkout_url' => null,
            'metadata' => array_merge($invoice->metadata ?? [], [
                'test_mode_payment' => true,
                'payment_mode' => $mode,
                'test_mode_reason' => $reason,
            ]),
        ])->save();

        $payment = Payment::updateOrCreate(
            ['transaction_reference' => $reference],
            [
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'currency' => $invoice->currency ?? 'ZMW',
                'method' => 'test-mode',
                'provider' => 'test-mode',
                'status' => 'completed',
                'is_test' => true,
                'payment_mode' => $mode,
                'payload' => [
                    'message' => $reason,
                    'payment_mode' => $mode,
                    'lenco_collections_enabled' => false,
                ],
                'paid_at' => now(),
            ]
        );

        $this->unlock($invoice);
        app(AffiliateService::class)->recordForInvoice($invoice->fresh() ?? $invoice, $payment, [
            'source' => 'test-mode',
        ]);
        $this->recordFinanceAllocation($invoice->fresh() ?? $invoice, $payment);
        app(PaymentReceiptMailer::class)->sendForInvoice($invoice->fresh() ?? $invoice, $payment, [
            'channel' => 'test-mode',
        ]);

        return $invoice->fresh() ?? $invoice;
    }

    public function unlock(Invoice $invoice): void
    {
        $metadata = $invoice->metadata ?? [];

        if ($invoice->type === 'application_fee') {
            $this->markApplicationFeePaid($invoice);
        }

        if ($invoice->type === 'short_course_entry' && isset($metadata['short_course_id'])) {
            $course = Course::find($metadata['short_course_id']);
            $entry = ShortCourseAccessPlans::initialEntryAccess($course);
            $enrollment = ShortCourseEnrollment::query()->firstOrCreate([
                'student_id' => $invoice->student_id,
                'short_course_id' => $metadata['short_course_id'],
            ]);
            $this->applyShortCoursePlan($enrollment, $entry, false, 'starter_access');
        }

        if ($invoice->type === 'short_course_access_plan' && isset($metadata['short_course_id'], $metadata['access_plan'])) {
            $course = Course::find($metadata['short_course_id']);
            $plan = ShortCourseAccessPlans::get((string) $metadata['access_plan'], $course);
            $enrollment = ShortCourseEnrollment::query()->firstOrCreate([
                'student_id' => $invoice->student_id,
                'short_course_id' => $metadata['short_course_id'],
            ]);
            $this->applyShortCoursePlan($enrollment, $plan);
        }

        if ($invoice->type === 'short_course_bundle' && isset($metadata['short_course_ids'], $metadata['bundle_plan']) && is_array($metadata['short_course_ids'])) {
            $plan = ShortCourseAccessPlans::getBundle((string) $metadata['bundle_plan'], $invoice->currency ?? 'ZMW');
            foreach ($metadata['short_course_ids'] as $courseId) {
                $enrollment = ShortCourseEnrollment::query()->firstOrCreate([
                    'student_id' => $invoice->student_id,
                    'short_course_id' => $courseId,
                ]);
                $this->applyShortCoursePlan($enrollment, $plan, true);
            }
        }

        if ($invoice->type === 'certificate_fee' && isset($metadata['short_course_id'])) {
            ShortCourseEnrollment::query()->updateOrCreate(
                ['student_id' => $invoice->student_id, 'short_course_id' => $metadata['short_course_id']],
                ['certificate_fee_paid' => true, 'status' => 'certificate_paid']
            );
        }

        if (in_array($invoice->type, ['registration_deposit', 'registration_fee', 'tuition_fee'], true)) {
            $this->refreshProgrammeEnrollmentClearance($invoice);
        }

        $payment = $invoice->transaction_reference
            ? Payment::where('transaction_reference', $invoice->transaction_reference)->first()
            : Payment::where('invoice_id', $invoice->id)->latest('paid_at')->first();
        $this->recordFinanceAllocation($invoice->fresh() ?? $invoice, $payment);
    }

    private function markApplicationFeePaid(Invoice $invoice): void
    {
        $reference = $invoice->metadata['application_reference'] ?? null;
        if (!$reference) {
            return;
        }

        $application = Application::where('reference', $reference)->first();
        if (!$application) {
            return;
        }

        $updates = ['admission_fee_paid' => true];
        if (in_array($application->status, ['draft', 'submitted'], true)) {
            $updates['status'] = 'fee_paid';
        }

        $application->forceFill($updates)->save();
    }

    private function refreshProgrammeEnrollmentClearance(Invoice $invoice): void
    {
        if (!$invoice->intake_id) {
            return;
        }

        $clearance = app(FormalFinancialClearance::class)->forStudentIntake($invoice->student_id, $invoice->intake_id);
        if (!data_get($clearance, 'registrationClearance.cleared')) {
            return;
        }

        Enrollment::query()
            ->where('user_id', $invoice->student_id)
            ->where('intake_id', $invoice->intake_id)
            ->update([
                'status' => 'active',
                'enrolled_at' => now(),
                'confirmed_at' => now(),
            ]);
    }

    public function recordFinanceAllocation(Invoice $invoice, ?Payment $payment): void
    {
        if (!$payment || !Schema::hasTable('financial_allocations')) {
            return;
        }

        $invoice = $invoice->fresh(['student']) ?? $invoice;
        $metadata = $invoice->metadata ?? [];
        $affiliate = app(AffiliateService::class)->affiliateForCode($metadata['affiliate_code'] ?? $invoice->student?->referred_by_affiliate_code ?? null);
        $isAffiliateSourced = (bool) ($affiliate && (int) $affiliate->user_id !== (int) $invoice->student_id);
        $gross = (float) $payment->amount;
        $currency = strtoupper($payment->currency ?? $invoice->currency ?? 'ZMW');
        $revenueSource = $this->revenueSourceForInvoice($invoice);
        $isAffiliateAccess = $isAffiliateSourced && in_array($invoice->type, ['short_course_access_plan', 'short_course_bundle'], true);
        $tierAtPayment = $isAffiliateSourced ? ($affiliate->tier ?: 'starter') : null;
        $affiliateCommission = $isAffiliateSourced
            ? (float) AffiliateEarning::query()->where('payment_id', $payment->id)->where('affiliate_id', $affiliate->id)->sum('commission_amount')
            : 0;
        $leaderboardPool = $isAffiliateAccess ? round($gross * 0.05, 2) : 0;
        $operatingReserve = round($gross * 0.10, 2);
        $remaining = max(0, $gross - $affiliateCommission - $leaderboardPool - $operatingReserve);

        DB::table('financial_allocations')->updateOrInsert(
            ['payment_id' => $payment->id],
            [
                'invoice_id' => $invoice->id,
                'revenue_source' => $revenueSource,
                'is_affiliate_sourced' => $isAffiliateSourced,
                'affiliate_id' => $isAffiliateSourced ? $affiliate->id : null,
                'affiliate_tier_at_payment' => $tierAtPayment,
                'gross_amount' => $gross,
                'currency' => $currency,
                'affiliate_commission_amount' => $affiliateCommission,
                'leaderboard_pool_tier' => $isAffiliateAccess ? $tierAtPayment : null,
                'leaderboard_pool_amount' => $leaderboardPool,
                'operating_reserve_amount' => $operatingReserve,
                'retained_business_amount' => round($remaining * 0.50, 2),
                'product_content_ai_amount' => round($remaining * 0.20, 2),
                'marketing_growth_amount' => round($remaining * 0.15, 2),
                'owner_profit_amount' => round($remaining * 0.15, 2),
                'refund_reserve_amount' => 0,
                'allocation_status' => 'locked',
                'metadata' => json_encode([
                    'invoice_type' => $invoice->type,
                    'student_id' => $invoice->student_id,
                    'referral_discount_amount' => $metadata['referral_discount_amount'] ?? 0,
                    'original_amount' => $metadata['original_amount'] ?? null,
                ]),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $this->recalculateFinanceBuckets($currency);
    }

    private function applyShortCoursePlan(ShortCourseEnrollment $enrollment, array $plan, bool $bundle = false, string $fallbackCode = 'monthly_access'): void
    {
        $aiHours = (int) ($plan['aiHours'] ?? 0);
        $code = (string) ($plan['code'] ?? $fallbackCode);

        $enrollment->update([
            'entry_fee_paid' => true,
            'status' => 'active',
            'access_plan' => $code,
            'access_expires_at' => now()->addHours((int) ($plan['accessHours'] ?? ShortCourseAccessPlans::MONTHLY_ACCESS_HOURS)),
            'ai_plan' => $aiHours > 0 ? ($bundle ? 'bundle:' . $code : ($code === 'free_access' ? 'free_trial' : $code)) : 'none',
            'ai_access_expires_at' => $aiHours > 0 ? now()->addHours($aiHours) : null,
            'hourly_ai_quota' => (int) ($plan['hourlyAiQuota'] ?? 0),
            'daily_ai_quota' => (int) ($plan['dailyAiQuota'] ?? 0),
            'certificate_included' => (bool) ($plan['certificateIncluded'] ?? false),
            'certificate_fee_paid' => (bool) ($plan['certificateIncluded'] ?? false) || $enrollment->certificate_fee_paid,
        ]);
    }

    private function revenueSourceForInvoice(Invoice $invoice): string
    {
        return match ($invoice->type) {
            'short_course_entry' => 'short_course_entry',
            'short_course_access_plan', 'short_course_bundle' => 'short_course_access',
            'certificate_fee' => 'certificate',
            'application_fee', 'admission_fee' => 'application',
            'registration_deposit', 'registration_fee' => 'programme_registration',
            'tuition_fee' => 'programme',
            default => $invoice->type ?: 'other',
        };
    }

    private function recalculateFinanceBuckets(string $currency = 'ZMW'): void
    {
        if (!Schema::hasTable('finance_bucket_balances')) {
            return;
        }

        $rows = DB::table('financial_allocations')->where('allocation_status', 'locked');
        $buckets = [
            'affiliate_commissions' => ['Affiliate commissions', (clone $rows)->sum('affiliate_commission_amount')],
            'starter_leaderboard_pool' => ['Starter leaderboard pool', (clone $rows)->where('leaderboard_pool_tier', 'starter')->sum('leaderboard_pool_amount')],
            'campus_leaderboard_pool' => ['Campus leaderboard pool', (clone $rows)->where('leaderboard_pool_tier', 'campus_promoter')->sum('leaderboard_pool_amount')],
            'ambassador_leaderboard_pool' => ['Ambassador leaderboard pool', (clone $rows)->where('leaderboard_pool_tier', 'ambassador')->sum('leaderboard_pool_amount')],
            'elite_leaderboard_pool' => ['Elite leaderboard pool', (clone $rows)->where('leaderboard_pool_tier', 'elite_partner')->sum('leaderboard_pool_amount')],
            'operating_reserve' => ['Operating reserve', (clone $rows)->sum('operating_reserve_amount')],
            'retained_business_cash' => ['Retained business cash', (clone $rows)->sum('retained_business_amount')],
            'product_content_ai_fund' => ['Product, content and AI fund', (clone $rows)->sum('product_content_ai_amount')],
            'marketing_growth_fund' => ['Marketing and growth fund', (clone $rows)->sum('marketing_growth_amount')],
            'owner_profit' => ['Owner profit', (clone $rows)->sum('owner_profit_amount')],
            'refund_reserve' => ['Refund reserve', (clone $rows)->sum('refund_reserve_amount')],
        ];

        foreach ($buckets as $key => [$name, $amount]) {
            DB::table('finance_bucket_balances')->updateOrInsert(
                ['bucket_key' => $key],
                [
                    'bucket_name' => $name,
                    'currency' => $currency,
                    'balance' => round((float) $amount, 2),
                    'last_calculated_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
