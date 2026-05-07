<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Invoice;
use App\Models\ShortCourseEnrollment;
use App\Models\ShortCourseLessonProgress;
use App\Services\CertificatePdfService;
use App\Services\LencoPaymentService;
use App\Support\Pricing\LaunchFeeSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ShortCourseController extends Controller
{
    public function enroll(Request $request, string $courseId, LencoPaymentService $lenco)
    {
        $studentId = $this->studentId($request);
        $course = Course::findOrFail($courseId);
        $fee = LaunchFeeSchedule::shortCourseEntryFee($course);

        $enrollment = ShortCourseEnrollment::firstOrCreate([
            'student_id' => $studentId,
            'short_course_id' => $course->id,
        ]);

        if ($enrollment->entry_fee_paid || (float) $fee['amount'] <= 0) {
            $enrollment->update(['entry_fee_paid' => true, 'status' => 'active']);
            return response()->json(['status' => $enrollment->status, 'checkout_url' => null]);
        }

        $invoice = $this->invoiceFor($studentId, $course, 'short_course_entry', 'Entry fee: ' . $course->title, $fee);

        try {
            return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id]);
        } catch (RuntimeException $exception) {
            report($exception);
            return response()->json(['message' => 'Payment checkout is not available. Please contact support.'], 503);
        }
    }

    public function progress(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $course = Course::with('lessons')->findOrFail($courseId);
        $enrollment = ShortCourseEnrollment::firstOrCreate(['student_id' => $studentId, 'short_course_id' => $course->id]);
        $completed = ShortCourseLessonProgress::where('student_id', $studentId)->where('short_course_id', $course->id)->pluck('lesson_id');

        return response()->json([
            'status' => $enrollment->status,
            'entryFeePaid' => $enrollment->entry_fee_paid,
            'certificateFeePaid' => $enrollment->certificate_fee_paid,
            'completedLessons' => $completed,
            'progress' => $enrollment->progress,
            'examScore' => $enrollment->exam_score,
            'completedAt' => optional($enrollment->completed_at)->toISOString(),
            'certificateIssuedAt' => optional($enrollment->certificate_issued_at)->toISOString(),
        ]);
    }

    public function completeLesson(Request $request, string $courseId, string $lessonId)
    {
        $studentId = $this->studentId($request);
        $course = Course::with('lessons')->findOrFail($courseId);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $course->id)->firstOrFail();

        if (!$enrollment->entry_fee_paid) {
            return response()->json(['message' => 'Entry fee required before starting lessons.'], 402);
        }

        ShortCourseLessonProgress::updateOrCreate(
            ['student_id' => $studentId, 'short_course_id' => $course->id, 'lesson_id' => $lessonId],
            ['completed_at' => now()]
        );

        $total = max(1, $course->lessons()->count());
        $done = ShortCourseLessonProgress::where('student_id', $studentId)->where('short_course_id', $course->id)->count();
        $progress = min(100, (int) round(($done / $total) * 100));
        $enrollment->update(['progress' => $progress, 'status' => $progress >= 100 ? 'lessons_completed' : 'active']);

        return response()->json(['progress' => $progress, 'completedLessons' => $done]);
    }

    public function submitExam(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $payload = $request->validate(['answers' => ['required', 'array']]);
        $questions = ExamQuestion::where('course_id', $courseId)->get();
        $correct = $questions->filter(fn ($q, $index) => ($payload['answers'][$index] ?? null) === $q->answer)->count();
        $score = $questions->count() > 0 ? round(($correct / $questions->count()) * 100, 2) : 100;

        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        $enrollment->update([
            'exam_score' => $score,
            'status' => $score >= 50 ? 'completed' : 'exam_failed',
            'completed_at' => $score >= 50 ? now() : $enrollment->completed_at,
        ]);

        return response()->json(['score' => $score, 'passed' => $score >= 50]);
    }

    public function payCertificate(Request $request, string $courseId, LencoPaymentService $lenco)
    {
        $studentId = $this->studentId($request);
        $course = Course::findOrFail($courseId);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        if (!$enrollment->completed_at) {
            return response()->json(['message' => 'Complete lessons and pass the exam before requesting a certificate.'], 422);
        }

        $fee = LaunchFeeSchedule::shortCourseCertificateFee($course);
        $invoice = $this->invoiceFor($studentId, $course, 'certificate_fee', 'Certificate fee: ' . $course->title, $fee);

        try {
            return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id]);
        } catch (RuntimeException $exception) {
            report($exception);
            return response()->json(['message' => 'Payment checkout is not available. Please contact support.'], 503);
        }
    }

    public function certificate(Request $request, string $courseId, CertificatePdfService $certificates)
    {
        $studentId = $this->studentId($request);
        $enrollment = ShortCourseEnrollment::with(['student', 'course'])->where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        if (!$enrollment->certificate_fee_paid) {
            return response()->json(['message' => 'Certificate fee payment required.'], 402);
        }

        if (!$enrollment->certificate_path) {
            $path = 'certificates/short-course-' . $enrollment->id . '.pdf';
            Storage::disk('local')->put($path, $certificates->shortCourseCertificate($enrollment));
            $enrollment->update(['certificate_path' => $path, 'certificate_issued_at' => now()]);
        }

        return Storage::disk('local')->download($enrollment->certificate_path, 'univai-certificate-' . $courseId . '.pdf', [
            'Content-Type' => 'application/pdf',
        ]);
    }

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }

    private function invoiceFor(int $studentId, Course $course, string $type, string $title, array $fee): Invoice
    {
        return Invoice::firstOrCreate(
            ['student_id' => $studentId, 'type' => $type, 'title' => $title],
            [
                'uuid' => (string) Str::uuid(),
                'description' => $title,
                'amount' => $fee['amount'],
                'currency' => $fee['currency'],
                'status' => 'pending',
                'metadata' => ['short_course_id' => $course->id],
                'due_date' => now()->addDays(7),
            ]
        );
    }
}
