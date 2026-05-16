<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\ShortCourseEnrollment;
use App\Services\LencoPaymentService;
use App\Support\Pricing\ShortCourseAccessPlans;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShortCourseAccessController extends Controller
{
    public function plans(Request $request, string $courseId)
    {
        $course = Course::findOrFail($courseId);
        return response()->json(array_values(ShortCourseAccessPlans::plans($course)));
    }

    public function purchase(Request $request, string $courseId, LencoPaymentService $lenco)
    {
        $payload = $request->validate([
            'plan' => ['required', 'string'],
        ]);

        $studentId = $this->studentId($request);
        $course = Course::findOrFail($courseId);
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
            [
                'student_id' => $studentId,
                'type' => 'short_course_access_plan',
                'title' => $plan['name'] . ': ' . $course->title,
            ],
            [
                'uuid' => (string) Str::uuid(),
                'description' => $plan['name'] . ' for ' . $course->title,
                'amount' => $plan['amount'],
                'currency' => $plan['currency'],
                'status' => 'pending',
                'metadata' => [
                    'short_course_id' => $course->id,
                    'access_plan' => $plan['code'],
                ],
                'due_date' => now()->addDays(7),
            ]
        );

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id, 'plan' => $plan]);
    }

    public static function applyPlan(ShortCourseEnrollment $enrollment, array $plan): void
    {
        $accessEndsAt = now()->addHours((int) ($plan['accessHours'] ?? ShortCourseAccessPlans::MIN_ACCESS_HOURS));
        $aiHours = (int) ($plan['aiHours'] ?? 0);

        $enrollment->update([
            'entry_fee_paid' => true,
            'status' => 'active',
            'access_plan' => $plan['code'] ?? 'access_only',
            'access_expires_at' => $accessEndsAt,
            'ai_plan' => $aiHours > 0 ? ($plan['code'] ?? 'included') : 'none',
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
