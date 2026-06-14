<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\ShortCourseEnrollment;
use App\Models\User;
use App\Services\LencoPaymentService;
use App\Support\Affiliates\AffiliateService;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentSettings;
use App\Support\Pricing\ShortCourseAccessPlans;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShortCourseAccessController extends Controller
{
    public function plans(Request $request, string $courseId)
    {
        $course = Course::whereIn('status', ['published', 'active'])->findOrFail($courseId);
        return response()->json(array_values(ShortCourseAccessPlans::plans($course)));
    }

    public function bundlePlans(Request $request)
    {
        return response()->json(array_values(ShortCourseAccessPlans::bundlePlans('ZMW')));
    }

    public function purchase(Request $request, string $courseId, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, AffiliateService $affiliates)
    {
        $payload = $request->validate(['plan' => ['required', 'string']]);
        $studentId = $this->studentId($request);
        $course = Course::whereIn('status', ['published', 'active'])->findOrFail($courseId);
        $plan = ShortCourseAccessPlans::get($payload['plan'], $course);

        $enrollment = ShortCourseEnrollment::firstOrCreate([
            'student_id' => $studentId,
            'short_course_id' => $course->id,
        ]);

        if ((float) $plan['amount'] <= 0) {
            $this->applyPlan($enrollment, $plan);
            return response()->json(['status' => 'active', 'checkout_url' => null, 'plan' => $plan]);
        }

        $referral = $this->referralPricing($studentId, (float) $plan['amount'], $this->referralCode($request, $studentId, $affiliates), $affiliates);
        $planForResponse = array_merge($plan, [
            'originalAmount' => (float) $plan['amount'],
            'amount' => $referral['amount'],
            'referralDiscountAmount' => $referral['discount'],
        ]);

        $invoice = $this->freshInvoice(
            $studentId,
            'short_course_access_plan',
            $plan['name'] . ': ' . $course->title,
            $plan['name'] . ' for ' . $course->title,
            $referral['amount'],
            strtoupper($plan['currency'] ?? $course->currency ?? 'ZMW'),
            [
                'short_course_id' => $course->id,
                'short_course_title' => $course->title,
                'access_plan' => $plan['code'],
                'affiliate_code' => $referral['affiliateCode'],
                'original_amount' => (float) $plan['amount'],
                'referral_discount_amount' => $referral['discount'],
                'referral_discount_applied' => $referral['discount'] > 0,
            ]
        );

        if ($invoice->status === 'paid') {
            return response()->json(['status' => 'active', 'checkout_url' => null, 'invoiceId' => $invoice->id, 'plan' => $planForResponse]);
        }

        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Payment confirmed in test mode.');

            return response()->json([
                'status' => 'active',
                'checkout_url' => null,
                'invoiceId' => $paidInvoice->id,
                'reference' => $paidInvoice->transaction_reference,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
                'plan' => $planForResponse,
            ]);
        }

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id, 'plan' => $planForResponse]);
    }

    public static function applyPlan(ShortCourseEnrollment $enrollment, array $plan): void
    {
        $accessEndsAt = now()->addHours((int) ($plan['accessHours'] ?? ShortCourseAccessPlans::MONTHLY_ACCESS_HOURS));
        $aiHours = (int) ($plan['aiHours'] ?? 0);

        $enrollment->update([
            'entry_fee_paid' => true,
            'status' => 'active',
            'access_plan' => $plan['code'] ?? 'monthly_access',
            'access_expires_at' => $accessEndsAt,
            'ai_plan' => $aiHours > 0 ? ($plan['code'] ?? 'included') : 'none',
            'ai_access_expires_at' => $aiHours > 0 ? now()->addHours($aiHours) : null,
            'hourly_ai_quota' => (int) ($plan['hourlyAiQuota'] ?? 0),
            'daily_ai_quota' => (int) ($plan['dailyAiQuota'] ?? 0),
            'certificate_included' => (bool) ($plan['certificateIncluded'] ?? false),
            'certificate_fee_paid' => (bool) ($plan['certificateIncluded'] ?? false) || $enrollment->certificate_fee_paid,
        ]);
    }

    public function purchaseBundle(Request $request, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, AffiliateService $affiliates)
    {
        $payload = $request->validate([
            'bundle' => ['required', 'string'],
            'courseIds' => ['required', 'array'],
            'courseIds.*' => ['required', 'string'],
        ]);

        $studentId = $this->studentId($request);
        $plan = ShortCourseAccessPlans::getBundle($payload['bundle'], 'ZMW');
        $courseIds = collect($payload['courseIds'])->unique()->values();
        if ($courseIds->count() !== (int) $plan['courseCount']) {
            return response()->json([
                'message' => $plan['name'] . ' requires exactly ' . $plan['courseCount'] . ' courses.',
            ], 422);
        }

        $courses = Course::whereIn('id', $courseIds)->whereIn('status', ['published', 'active'])->get();
        if ($courses->count() !== $courseIds->count()) {
            return response()->json(['message' => 'One or more selected courses are unavailable.'], 422);
        }

        if ((float) $plan['amount'] <= 0) {
            $courses->each(function (Course $course) use ($studentId, $plan) {
                $enrollment = ShortCourseEnrollment::firstOrCreate([
                    'student_id' => $studentId,
                    'short_course_id' => $course->id,
                ]);
                self::applyBundlePlan($enrollment, $plan);
            });

            return response()->json([
                'status' => 'active',
                'checkout_url' => null,
                'testMode' => true,
                'plan' => $plan,
            ]);
        }

        $courseTitles = $courses->pluck('title')->values();
        $bundleTitle = $plan['name'] . ' Bundle';
        $referral = $this->referralPricing($studentId, (float) $plan['amount'], $this->referralCode($request, $studentId, $affiliates), $affiliates);
        $planForResponse = array_merge($plan, [
            'originalAmount' => (float) $plan['amount'],
            'amount' => $referral['amount'],
            'referralDiscountAmount' => $referral['discount'],
        ]);

        $invoice = $this->freshInvoice(
            $studentId,
            'short_course_bundle',
            $bundleTitle,
            $plan['name'] . ' for ' . $courseTitles->implode(', '),
            $referral['amount'],
            strtoupper($plan['currency'] ?? 'ZMW'),
            [
                'short_course_ids' => $courseIds->all(),
                'short_course_titles' => $courseTitles->all(),
                'bundle_plan' => $plan['code'],
                'affiliate_code' => $referral['affiliateCode'],
                'original_amount' => (float) $plan['amount'],
                'referral_discount_amount' => $referral['discount'],
                'referral_discount_applied' => $referral['discount'] > 0,
            ]
        );

        if ($invoice->status === 'paid') {
            return response()->json(['status' => 'active', 'checkout_url' => null, 'invoiceId' => $invoice->id, 'plan' => $planForResponse]);
        }

        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Payment confirmed in test mode.');

            return response()->json([
                'status' => 'active',
                'checkout_url' => null,
                'invoiceId' => $paidInvoice->id,
                'reference' => $paidInvoice->transaction_reference,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
                'plan' => $planForResponse,
            ]);
        }

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id, 'plan' => $planForResponse]);
    }

    public static function applyBundlePlan(ShortCourseEnrollment $enrollment, array $plan): void
    {
        $accessEndsAt = now()->addHours((int) ($plan['accessHours'] ?? ShortCourseAccessPlans::MONTHLY_ACCESS_HOURS));
        $aiHours = (int) ($plan['aiHours'] ?? 0);

        $enrollment->update([
            'entry_fee_paid' => true,
            'status' => 'active',
            'access_plan' => $plan['code'],
            'access_expires_at' => $accessEndsAt,
            'ai_plan' => $aiHours > 0 ? 'bundle:' . $plan['code'] : 'none',
            'ai_access_expires_at' => $aiHours > 0 ? now()->addHours($aiHours) : null,
            'hourly_ai_quota' => (int) ($plan['hourlyAiQuota'] ?? 0),
            'daily_ai_quota' => (int) ($plan['dailyAiQuota'] ?? 0),
            'certificate_included' => (bool) ($plan['certificateIncluded'] ?? false),
            'certificate_fee_paid' => (bool) ($plan['certificateIncluded'] ?? false) || $enrollment->certificate_fee_paid,
        ]);
    }

    private function freshInvoice(int $studentId, string $type, string $title, string $description, float $amount, string $currency, array $metadata): Invoice
    {
        $invoice = Invoice::firstOrNew([
            'student_id' => $studentId,
            'type' => $type,
            'title' => $title,
        ]);

        if ($invoice->exists && $invoice->status === 'paid') {
            return $invoice;
        }

        $invoice->forceFill([
            'uuid' => $invoice->uuid ?: (string) Str::uuid(),
            'description' => $description,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'pending',
            'paid_amount' => 0,
            'paid_at' => null,
            'transaction_reference' => null,
            'checkout_url' => null,
            'metadata' => $metadata,
            'due_date' => now()->addDays(7),
        ])->save();

        return $invoice;
    }

    private function referralCode(Request $request, int $studentId, AffiliateService $affiliates): ?string
    {
        return $affiliates->captureReferralCode($request)
            ?? $request->session()->get('affiliate_code')
            ?? User::query()->where('id', $studentId)->value('referred_by_affiliate_code');
    }

    private function referralPricing(int $studentId, float $amount, ?string $code, AffiliateService $affiliates): array
    {
        $affiliate = $affiliates->affiliateForCode($code);
        if (!$affiliate || (int) $affiliate->user_id === $studentId || $this->hasUsedReferralAccessDiscount($studentId)) {
            return ['amount' => $amount, 'discount' => 0, 'affiliateCode' => $affiliate?->code];
        }

        $discount = round($amount * 0.10, 2);
        return [
            'amount' => round(max(0, $amount - $discount), 2),
            'discount' => $discount,
            'affiliateCode' => $affiliate->code,
        ];
    }

    private function hasUsedReferralAccessDiscount(int $studentId): bool
    {
        return Invoice::query()
            ->where('student_id', $studentId)
            ->whereIn('type', ['short_course_access_plan', 'short_course_bundle'])
            ->where('status', 'paid')
            ->get()
            ->contains(fn (Invoice $invoice) => (bool) data_get($invoice->metadata ?? [], 'referral_discount_applied'));
    }

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }
}
