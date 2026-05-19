<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ShortCourseEnrollment;
use App\Models\ShortCourseLessonProgress;
use App\Services\LencoPaymentService;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentSettings;
use App\Support\Pricing\LaunchFeeSchedule;
use App\Support\Pricing\ShortCourseAccessPlans;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ShortCourseController extends Controller
{
    public function mine(Request $request)
    {
        $studentId = $this->studentId($request);
        $enrollments = ShortCourseEnrollment::with(['course.lessons'])
            ->where('student_id', $studentId)
            ->latest()
            ->get();

        return response()->json($enrollments->map(fn (ShortCourseEnrollment $enrollment) => [
            'id' => $enrollment->id,
            'course' => $this->coursePayload($enrollment->course),
            'status' => $enrollment->status,
            'progress' => (int) $enrollment->progress,
            'entryFeePaid' => (bool) $enrollment->entry_fee_paid,
            'certificateFeePaid' => (bool) $enrollment->certificate_fee_paid,
            'examScore' => $enrollment->exam_score,
            'completedAt' => optional($enrollment->completed_at)->toISOString(),
            'certificateIssuedAt' => optional($enrollment->certificate_issued_at)->toISOString(),
            'accessExpiresAt' => optional($enrollment->access_expires_at)->toISOString(),
            'accessPlan' => $enrollment->access_plan,
            'aiPlan' => $enrollment->ai_plan,
            'aiAccessExpiresAt' => optional($enrollment->ai_access_expires_at)->toISOString(),
            'hourlyAiQuota' => $enrollment->hourly_ai_quota,
            'dailyAiQuota' => $enrollment->daily_ai_quota,
            'certificateIncluded' => (bool) $enrollment->certificate_included,
        ])->values());
    }

    public function enroll(Request $request, string $courseId, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker)
    {
        $studentId = $this->studentId($request);
        $course = Course::whereIn('status', ['published', 'active'])->findOrFail($courseId);
        $starterPlan = ShortCourseAccessPlans::get('starter_access', $course);
        $fee = ((float) ($course->price ?? 0) <= 0 || $course->pricing_type === 'free')
            ? ['amount' => 0, 'currency' => strtoupper($course->currency ?? $starterPlan['currency'] ?? 'ZMW')]
            : ['amount' => $starterPlan['amount'], 'currency' => $starterPlan['currency']];

        $enrollment = ShortCourseEnrollment::firstOrCreate([
            'student_id' => $studentId,
            'short_course_id' => $course->id,
        ]);

        if ($enrollment->entry_fee_paid || (float) $fee['amount'] <= 0) {
            $this->applyInitialEntryAccess($enrollment, $course);
            return response()->json(['status' => 'active', 'checkout_url' => null]);
        }

        $invoice = $this->invoiceFor($studentId, $course, 'short_course_entry', 'Starter Access: ' . $course->title, $fee, ['access_plan' => 'starter_access']);
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
            ]);
        }

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id]);
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
            'accessExpiresAt' => optional($enrollment->access_expires_at)->toISOString(),
            'accessPlan' => $enrollment->access_plan,
            'aiPlan' => $enrollment->ai_plan,
            'aiAccessExpiresAt' => optional($enrollment->ai_access_expires_at)->toISOString(),
            'hourlyAiQuota' => $enrollment->hourly_ai_quota,
            'dailyAiQuota' => $enrollment->daily_ai_quota,
            'certificateIncluded' => (bool) $enrollment->certificate_included,
        ]);
    }

    public function completeLesson(Request $request, string $courseId, string $lessonId)
    {
        $studentId = $this->studentId($request);
        $course = Course::with('lessons')->findOrFail($courseId);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $course->id)->firstOrFail();

        if (!$enrollment->entry_fee_paid || !$enrollment->hasActiveCourseAccess()) {
            return response()->json(['message' => 'Active course access is required before starting lessons.'], 402);
        }

        if (!$course->lessons()->where('lessons.id', $lessonId)->exists()) {
            return response()->json(['message' => 'This lesson does not belong to the selected short course.'], 404);
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

    public function practice(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->first();
        if (!$enrollment || !$enrollment->entry_fee_paid || !$enrollment->hasActiveCourseAccess()) {
            return response()->json(['message' => 'Active course access is required before starting practice.'], 402);
        }
        $payload = $request->validate([
            'difficulty' => ['nullable', 'string'],
            'count' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questionType' => ['nullable', 'string'],
            'lessonId' => ['nullable', 'string'],
            'sections' => ['nullable', 'array'],
            'sections.*.title' => ['nullable', 'string'],
            'sections.*.difficulty' => ['nullable', 'string'],
            'sections.*.questionType' => ['nullable', 'string'],
            'sections.*.count' => ['nullable', 'integer', 'min:1', 'max:50'],
            'sections.*.timeMinutes' => ['nullable', 'integer', 'min:1', 'max:240'],
        ]);

        $sections = $payload['sections'] ?? [[
            'title' => ucfirst(str_replace('_', ' ', $payload['difficulty'] ?? 'easy')) . ' practice',
            'difficulty' => $payload['difficulty'] ?? 'easy',
            'questionType' => $payload['questionType'] ?? null,
            'count' => $payload['count'] ?? 10,
            'timeMinutes' => $this->defaultPracticeMinutes($payload['difficulty'] ?? 'easy', $payload['count'] ?? 10),
        ]];

        $builtSections = collect($sections)->map(function (array $section, int $index) use ($courseId, $payload) {
            $query = ExamQuestion::where('course_id', $courseId);
            if (!empty($section['difficulty'])) {
                $query->where('difficulty', $section['difficulty']);
            }
            if (!empty($section['questionType'])) {
                $query->where('question_type', $section['questionType']);
            }
            if (!empty($payload['lessonId'])) {
                $query->where('lesson_id', $payload['lessonId']);
            }
            $count = (int) ($section['count'] ?? 10);
            $questions = $query->inRandomOrder()->take($count)->get();
            $timeMinutes = (int) ($section['timeMinutes'] ?? $this->defaultPracticeMinutes($section['difficulty'] ?? 'easy', $count));

            return [
                'id' => 'section-' . ($index + 1),
                'title' => $section['title'] ?? ('Section ' . ($index + 1)),
                'difficulty' => $section['difficulty'] ?? 'mixed',
                'questionType' => $section['questionType'] ?? 'mixed',
                'timeMinutes' => $timeMinutes,
                'questions' => $questions->map(fn (ExamQuestion $question) => $this->questionPayload($question))->values(),
            ];
        })->values();

        return response()->json([
            'courseId' => $courseId,
            'sections' => $builtSections,
            'totalQuestions' => $builtSections->sum(fn ($section) => count($section['questions'])),
            'totalTimeMinutes' => $builtSections->sum('timeMinutes'),
        ]);
    }

    public function submitPractice(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->first();
        if (!$enrollment || !$enrollment->entry_fee_paid || !$enrollment->hasActiveCourseAccess()) {
            return response()->json(['message' => 'Active course access is required before submitting practice.'], 402);
        }
        $payload = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.questionId' => ['required'],
            'answers.*.answer' => ['nullable', 'string'],
        ]);

        $questionIds = collect($payload['answers'])->pluck('questionId')->filter()->values();
        $questions = ExamQuestion::where('course_id', $courseId)->whereIn('id', $questionIds)->get()->keyBy('id');
        $correct = 0;
        $results = collect($payload['answers'])->map(function (array $answer) use ($questions, &$correct) {
            $question = $questions->get($answer['questionId']);
            $isCorrect = $question && trim((string) ($answer['answer'] ?? '')) === trim((string) $question->answer);
            if ($isCorrect) {
                $correct++;
            }
            return [
                'questionId' => $answer['questionId'],
                'correct' => $isCorrect,
                'answer' => $question?->answer,
                'explanation' => $question?->explanation,
            ];
        });

        $total = max(1, $results->count());
        return response()->json([
            'score' => round(($correct / $total) * 100, 2),
            'correct' => $correct,
            'total' => $results->count(),
            'results' => $results->values(),
        ]);
    }

    public function exam(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $course = Course::with('lessons')->findOrFail($courseId);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        if (!$enrollment->entry_fee_paid || !$enrollment->hasActiveCourseAccess()) {
            return response()->json(['message' => 'Active course access is required before taking the final exam.'], 402);
        }
        $totalLessons = $course->lessons()->count();
        $completedLessons = ShortCourseLessonProgress::where('student_id', $studentId)->where('short_course_id', $courseId)->count();
        if ($totalLessons > 0 && $completedLessons < $totalLessons) {
            return response()->json([
                'message' => 'Complete all required lessons before taking the final exam.',
                'locked' => true,
                'requiredLessons' => $totalLessons,
                'completedLessons' => $completedLessons,
            ], 423);
        }
        $questions = ExamQuestion::where('course_id', $courseId)->inRandomOrder()->take(25)->get();

        return response()->json([
            'courseId' => $courseId,
            'requiredQuestions' => 25,
            'availableQuestions' => $questions->count(),
            'ready' => $questions->count() >= 25,
            'questions' => $questions->map(fn (ExamQuestion $question) => $this->questionPayload($question, false))->values(),
        ]);
    }

    public function submitExam(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $payload = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.questionId' => ['nullable'],
            'answers.*.answer' => ['nullable', 'string'],
        ]);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        if (!$enrollment->entry_fee_paid || !$enrollment->hasActiveCourseAccess()) {
            return response()->json(['message' => 'Active course access is required before submitting the final exam.'], 402);
        }
        $course = Course::with('lessons')->findOrFail($courseId);
        $totalLessons = $course->lessons()->count();
        $completedLessons = ShortCourseLessonProgress::where('student_id', $studentId)->where('short_course_id', $courseId)->count();
        if ($totalLessons > 0 && $completedLessons < $totalLessons) {
            return response()->json(['message' => 'Complete all required lessons before submitting the final exam.'], 423);
        }
        $allQuestions = ExamQuestion::where('course_id', $courseId)->get();

        if ($allQuestions->count() < 25) {
            return response()->json([
                'message' => 'This lesson/course needs at least 25 assessment questions before exam submission is enabled.',
            ], 422);
        }

        $answerRows = collect($payload['answers']);
        $usesQuestionIds = $answerRows->contains(fn ($answer) => is_array($answer) && array_key_exists('questionId', $answer));

        if ($usesQuestionIds) {
            $questionIds = $answerRows->pluck('questionId')->filter()->values();
            if ($questionIds->unique()->count() < 25) {
                return response()->json(['message' => 'Submit answers for all 25 final exam questions.'], 422);
            }
            $selectedQuestions = ExamQuestion::where('course_id', $courseId)
                ->whereIn('id', $questionIds)
                ->get()
                ->keyBy('id');

            if ($selectedQuestions->count() !== $questionIds->unique()->count()) {
                return response()->json(['message' => 'One or more submitted questions are not part of this course.'], 422);
            }

            $correct = $answerRows->filter(function ($answer) use ($selectedQuestions) {
                if (!is_array($answer)) {
                    return false;
                }
                $question = $selectedQuestions->get($answer['questionId'] ?? null);
                return $question && $this->normalizeAnswer($answer['answer'] ?? null) === $this->normalizeAnswer($question->answer);
            })->count();

            $total = max(1, $answerRows->count());
        } else {
            $selectedQuestions = $allQuestions->take(25)->values();
            $correct = $selectedQuestions->filter(fn ($q, $index) => $this->normalizeAnswer($payload['answers'][$index] ?? null) === $this->normalizeAnswer($q->answer))->count();
            $total = $selectedQuestions->count();
        }

        $score = round(($correct / $total) * 100, 2);

        $enrollment->update([
            'exam_score' => $score,
            'status' => $score >= 50 ? 'completed' : 'exam_failed',
            'completed_at' => $score >= 50 ? now() : $enrollment->completed_at,
        ]);

        return response()->json(['score' => $score, 'passed' => $score >= 50]);
    }

    public function payCertificate(Request $request, string $courseId, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker)
    {
        $studentId = $this->studentId($request);
        $course = Course::findOrFail($courseId);
        $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        if (!$enrollment->completed_at) {
            return response()->json(['message' => 'Complete lessons and pass the exam before requesting a certificate.'], 422);
        }

        $fee = LaunchFeeSchedule::shortCourseCertificateFee($course);
        if ((float) $fee['amount'] <= 0 || $enrollment->certificate_fee_paid || $enrollment->certificate_included) {
            $enrollment->update(['certificate_fee_paid' => true]);
            return response()->json(['status' => 'paid', 'checkout_url' => null]);
        }

        $invoice = $this->invoiceFor($studentId, $course, 'certificate_fee', 'Certificate fee: ' . $course->title, $fee);
        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Payment confirmed in test mode.');

            return response()->json([
                'status' => 'paid',
                'checkout_url' => null,
                'invoiceId' => $paidInvoice->id,
                'reference' => $paidInvoice->transaction_reference,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
            ]);
        }

        return response()->json($lenco->initiatePayment($invoice) + ['invoiceId' => $invoice->id]);
    }

    public function certificate(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $enrollment = ShortCourseEnrollment::with(['student', 'course'])->where('student_id', $studentId)->where('short_course_id', $courseId)->firstOrFail();
        if (!$enrollment->certificate_fee_paid && !$enrollment->certificate_included) {
            return response()->json(['message' => 'Certificate fee payment required.'], 402);
        }

        if (!$enrollment->certificate_path) {
            $path = 'certificates/short-course-' . $enrollment->id . '.html';
            Storage::disk('local')->put($path, view('certificates.short-course', ['enrollment' => $enrollment])->render());
            $enrollment->update(['certificate_path' => $path, 'certificate_issued_at' => now()]);
        }

        return Storage::disk('local')->download($enrollment->certificate_path, 'univai-certificate-' . $courseId . '.html');
    }

    private function applyInitialEntryAccess(ShortCourseEnrollment $enrollment, Course $course): void
    {
        $entry = ShortCourseAccessPlans::initialEntryAccess($course);
        $enrollment->update([
            'entry_fee_paid' => true,
            'status' => 'active',
            'access_plan' => $entry['code'] ?? 'starter_access',
            'access_expires_at' => now()->addHours($entry['accessHours']),
            'ai_plan' => ((int) ($entry['aiHours'] ?? 0)) > 0 ? 'free_trial' : 'none',
            'ai_access_expires_at' => ((int) ($entry['aiHours'] ?? 0)) > 0 ? now()->addHours($entry['aiHours']) : null,
            'hourly_ai_quota' => $entry['hourlyAiQuota'],
            'daily_ai_quota' => $entry['dailyAiQuota'],
            'certificate_included' => (bool) ($entry['certificateIncluded'] ?? false),
        ]);
    }

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }

    private function invoiceFor(int $studentId, Course $course, string $type, string $title, array $fee, array $metadata = []): Invoice
    {
        return Invoice::firstOrCreate(
            ['student_id' => $studentId, 'type' => $type, 'title' => $title],
            [
                'uuid' => (string) Str::uuid(),
                'description' => $title,
                'amount' => $fee['amount'],
                'currency' => $fee['currency'],
                'status' => 'pending',
                'metadata' => ['short_course_id' => $course->id, 'short_course_title' => $course->title] + $metadata,
                'due_date' => now()->addDays(7),
            ]
        );
    }

    private function coursePayload(?Course $course): ?array
    {
        if (!$course) {
            return null;
        }

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'schoolId' => $course->school_id,
            'imageId' => $course->image_id,
            'pricingType' => $course->pricing_type,
            'price' => $course->price,
            'currency' => $course->currency,
            'certificateFee' => $course->certificate_fee,
            'certificateCurrency' => $course->certificate_currency,
            'durationHours' => $course->duration_hours,
            'level' => $course->level,
            'status' => $course->status,
            'lessons' => $course->lessons?->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'summary' => $lesson->summary ?? null,
            ])->values(),
        ];
    }

    private function questionPayload(ExamQuestion $question, bool $includeAnswer = false): array
    {
        $payload = [
            'id' => $question->id,
            'question' => $question->question,
            'questionType' => $question->question_type ?? 'mcq',
            'options' => $question->options ?? [],
            'difficulty' => $question->difficulty ?? 'easy',
            'timeSeconds' => $question->time_seconds ?? 60,
            'lessonId' => $question->lesson_id,
            'tags' => $question->tags ?? [],
        ];

        if ($includeAnswer) {
            $payload['answer'] = $question->answer;
            $payload['explanation'] = $question->explanation;
        }

        return $payload;
    }

    private function defaultPracticeMinutes(string $difficulty, int $count): int
    {
        $seconds = match ($difficulty) {
            'medium' => 60,
            'hard' => 90,
            'very_hard' => 120,
            default => 45,
        };
        return max(1, (int) ceil(($seconds * $count) / 60));
    }

    private function normalizeAnswer(mixed $answer): string
    {
        return mb_strtolower(trim((string) $answer));
    }
}
