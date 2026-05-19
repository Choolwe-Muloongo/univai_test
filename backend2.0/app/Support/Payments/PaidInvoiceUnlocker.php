<?php

namespace App\Support\Payments;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ShortCourseEnrollment;
use App\Support\Affiliates\AffiliateService;
use App\Support\Pricing\ShortCourseAccessPlans;
use App\Support\Payments\PaymentReceiptMailer;
use Illuminate\Support\Str;

class PaidInvoiceUnlocker
{
    public function markPaidForTesting(Invoice $invoice, string $reason = 'Lenco collections are disabled for testing.'): Invoice
    {
        $reference = $invoice->transaction_reference ?: 'test-' . Str::orderedUuid();

        $invoice->forceFill([
            'paid_amount' => $invoice->amount,
            'status' => 'paid',
            'paid_at' => now(),
            'transaction_reference' => $reference,
            'checkout_url' => null,
            'metadata' => array_merge($invoice->metadata ?? [], [
                'test_mode_payment' => true,
                'test_mode_reason' => $reason,
            ]),
        ])->save();

        Payment::updateOrCreate(
            ['transaction_reference' => $reference],
            [
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'currency' => $invoice->currency ?? 'ZMW',
                'method' => 'test-mode',
                'provider' => 'test-mode',
                'status' => 'completed',
                'payload' => [
                    'message' => $reason,
                    'lenco_collections_enabled' => false,
                ],
                'paid_at' => now(),
            ]
        );

        $this->unlock($invoice);
        app(AffiliateService::class)->recordForInvoice($invoice->fresh() ?? $invoice, Payment::where('transaction_reference', $reference)->first(), [
            'source' => 'test-mode',
        ]);
        app(PaymentReceiptMailer::class)->sendForInvoice($invoice->fresh() ?? $invoice, Payment::where('transaction_reference', $reference)->first(), [
            'channel' => 'test-mode',
        ]);

        return $invoice->fresh() ?? $invoice;
    }

    public function unlock(Invoice $invoice): void
    {
        $metadata = $invoice->metadata ?? [];

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

        if ($invoice->type === 'tuition_fee') {
            Enrollment::query()
                ->where('user_id', $invoice->student_id)
                ->when($invoice->intake_id, fn ($query) => $query->where('intake_id', $invoice->intake_id))
                ->update(['status' => 'active', 'enrolled_at' => now(), 'confirmed_at' => now()]);
        }
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
}
