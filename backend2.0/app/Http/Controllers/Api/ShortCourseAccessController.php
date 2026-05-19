<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ShortCourseEnrollment;
use App\Services\LencoPaymentService;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentReceiptMailer;
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

    public function purchase(Request $request, string $courseId, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, PaymentReceiptMailer $receiptMailer)
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

        $invoice = Invoice::firstOrCreate(
            ['student_id' => $studentId, 'type' => 'short_course_access_plan', 'title' => $plan['name'] . ': ' . $course->title],
            [
                'uuid' => (string) Str::uuid(),
                'description' => $plan['name'] . ' for ' . $course->title,
                'amount' => $plan['amount'],
                'currency' => $plan['currency'],
                'status' => 'pending',
                'metadata' => ['short_course_id' => $course->id, 'access_plan' => $plan['code']],
                'due_date' => now()->addDays(7),
            ]
        );

        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Payment confirmed in test mode.');
            $receiptMailer->sendForInvoice($paidInvoice->fresh() ?? $paidInvoice, Payment::where('transaction_reference', $paidInvoice->transaction_reference)->first(), [
                'channel' => 'test-mode',
            ]);

            return response()->json([
                'status' => 'active',
                'checkout_url' => null,
                'invoiceId' => $paidInvoice->id,
                'reference' => $paidInvoice->transaction_reference,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
                'plan' => $plan,
            ]);
        }

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id, 'plan' => $plan]);
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

    public function purchaseBundle(Request $request, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, PaymentReceiptMailer $receiptMailer)
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

        $bundleTitle = $plan['name'] . ': ' . $courseIds->implode(', ');
        $invoice = Invoice::firstOrCreate(
            ['student_id' => $studentId, 'type' => 'short_course_bundle', 'title' => $bundleTitle],
            [
                'uuid' => (string) Str::uuid(),
                'description' => $bundleTitle,
                'amount' => $plan['amount'],
                'currency' => $plan['currency'],
                'status' => 'pending',
                'metadata' => ['short_course_ids' => $courseIds->all(), 'bundle_plan' => $plan['code']],
                'due_date' => now()->addDays(7),
            ]
        );

        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Payment confirmed in test mode.');
            $receiptMailer->sendForInvoice($paidInvoice->fresh() ?? $paidInvoice, Payment::where('transaction_reference', $paidInvoice->transaction_reference)->first(), [
                'channel' => 'test-mode',
            ]);

            return response()->json([
                'status' => 'active',
                'checkout_url' => null,
                'invoiceId' => $paidInvoice->id,
                'reference' => $paidInvoice->transaction_reference,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
                'plan' => $plan,
            ]);
        }

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id, 'plan' => $plan]);
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

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }
}
