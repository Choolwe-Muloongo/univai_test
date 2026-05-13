<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlatformOperationsController extends Controller
{
    public function overview()
    {
        return [
            'instructorCourseSources' => $this->latest('instructor_course_sources'),
            'instructorAiGenerations' => $this->latest('instructor_ai_generations'),
            'courseReviewSubmissions' => $this->latest('course_review_submissions'),
            'feeRules' => $this->latest('fee_rules'),
            'invoices' => $this->latest('platform_invoices'),
            'payments' => $this->latest('platform_payments'),
            'certificates' => $this->latest('certificates'),
            'messageTemplates' => $this->latest('message_templates'),
            'announcements' => $this->latest('admin_announcements'),
            'deliveryLogs' => $this->latest('notification_delivery_logs'),
            'savedReports' => $this->latest('saved_reports'),
        ];
    }

    public function storeInstructorSource(Request $request)
    {
        $payload = $request->validate([
            'instructorId' => ['nullable', 'integer'],
            'courseId' => ['nullable', 'string'],
            'title' => ['required', 'string'],
            'sourceType' => ['nullable', 'string'],
            'filePath' => ['nullable', 'string'],
            'extractedText' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $instructorId = $payload['instructorId'] ?? $this->instructorIdForSession();

        return $this->insert('instructor_course_sources', [
            'instructor_id' => $instructorId,
            'course_id' => $payload['courseId'] ?? null,
            'title' => $payload['title'],
            'source_type' => $payload['sourceType'] ?? 'document',
            'file_path' => $payload['filePath'] ?? null,
            'extracted_text' => $payload['extractedText'] ?? null,
            'status' => $payload['status'] ?? 'uploaded',
        ]);
    }

    public function storeInstructorAiGeneration(Request $request)
    {
        $payload = $request->validate([
            'instructorId' => ['nullable', 'integer'],
            'packageSaleId' => ['nullable', 'integer'],
            'courseId' => ['nullable', 'string'],
            'generationType' => ['required', 'string'],
            'sourceIds' => ['required', 'array', 'min:1'],
            'title' => ['nullable', 'string'],
            'prompt' => ['nullable', 'string'],
        ]);

        $instructorId = $payload['instructorId'] ?? $this->instructorIdForSession();
        $sources = Schema::hasTable('instructor_course_sources')
            ? DB::table('instructor_course_sources')
                ->whereIn('id', $payload['sourceIds'])
                ->when($instructorId, fn ($query) => $query->where(function ($inner) use ($instructorId) {
                    $inner->where('instructor_id', $instructorId)->orWhereNull('instructor_id');
                }))
                ->get()
            : collect();

        abort_if($sources->isEmpty(), 422, 'Upload or select instructor-owned source material before generating course content.');

        return $this->insert('instructor_ai_generations', [
            'instructor_id' => $instructorId,
            'package_sale_id' => $payload['packageSaleId'] ?? null,
            'course_id' => $payload['courseId'] ?? null,
            'generation_type' => $payload['generationType'],
            'source_ids' => json_encode($payload['sourceIds']),
            'title' => $payload['title'] ?? null,
            'prompt' => $payload['prompt'] ?? null,
            'output' => $this->buildInstructorCourseDraft($payload, $sources),
            'status' => 'ai_generated',
        ]);
    }

    public function storeFeeRule(Request $request)
    {
        $payload = $request->validate([
            'feeType' => ['required', 'string'],
            'name' => ['required', 'string'],
            'appliesToType' => ['nullable', 'string'],
            'appliesToId' => ['nullable', 'string'],
            'amount' => ['required', 'numeric'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['nullable', 'string'],
        ]);

        return $this->insert('fee_rules', [
            'fee_type' => $payload['feeType'],
            'name' => $payload['name'],
            'applies_to_type' => $payload['appliesToType'] ?? null,
            'applies_to_id' => $payload['appliesToId'] ?? null,
            'amount' => $payload['amount'],
            'currency' => strtoupper($payload['currency'] ?? 'ZMW'),
            'status' => $payload['status'] ?? 'active',
        ]);
    }

    public function storeCertificate(Request $request)
    {
        $payload = $request->validate([
            'userId' => ['nullable', 'integer'],
            'certificateType' => ['required', 'string'],
            'sourceType' => ['nullable', 'string'],
            'sourceId' => ['nullable', 'string'],
            'studentName' => ['required', 'string'],
            'title' => ['required', 'string'],
            'issuer' => ['nullable', 'string'],
            'issuedAt' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
        ]);

        $certificateNumber = 'UNIVAI-' . now()->format('Ymd') . '-' . strtoupper(substr(md5(json_encode($payload) . microtime()), 0, 8));

        return $this->insert('certificates', [
            'certificate_number' => $certificateNumber,
            'user_id' => $payload['userId'] ?? null,
            'certificate_type' => $payload['certificateType'],
            'source_type' => $payload['sourceType'] ?? null,
            'source_id' => $payload['sourceId'] ?? null,
            'student_name' => $payload['studentName'],
            'title' => $payload['title'],
            'issuer' => $payload['issuer'] ?? 'UnivAI',
            'verification_url' => '/verify/certificates/' . $certificateNumber,
            'issued_at' => $payload['issuedAt'] ?? now()->toDateString(),
            'status' => $payload['status'] ?? 'issued',
        ]);
    }

    public function storeMessageTemplate(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string'],
            'channel' => ['nullable', 'string'],
            'subject' => ['nullable', 'string'],
            'body' => ['required', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        return $this->insert('message_templates', [
            'name' => $payload['name'],
            'channel' => $payload['channel'] ?? 'email',
            'subject' => $payload['subject'] ?? null,
            'body' => $payload['body'],
            'status' => $payload['status'] ?? 'active',
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $payload = $request->validate([
            'title' => ['required', 'string'],
            'body' => ['required', 'string'],
            'audience' => ['required', 'string'],
            'status' => ['nullable', 'string'],
            'scheduledAt' => ['nullable', 'date'],
        ]);

        return $this->insert('admin_announcements', [
            'title' => $payload['title'],
            'body' => $payload['body'],
            'audience' => $payload['audience'],
            'status' => $payload['status'] ?? 'draft',
            'created_by' => session('user.id'),
            'scheduled_at' => $payload['scheduledAt'] ?? null,
            'published_at' => ($payload['status'] ?? 'draft') === 'published' ? now() : null,
        ]);
    }

    public function storeSavedReport(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string'],
            'reportType' => ['required', 'string'],
            'filters' => ['nullable', 'array'],
            'summary' => ['nullable', 'array'],
        ]);

        return $this->insert('saved_reports', [
            'name' => $payload['name'],
            'report_type' => $payload['reportType'],
            'filters' => json_encode($payload['filters'] ?? []),
            'summary' => json_encode($payload['summary'] ?? []),
            'created_by' => session('user.id'),
        ]);
    }

    private function latest(string $table): array
    {
        if (!Schema::hasTable($table)) {
            return [];
        }

        return DB::table($table)->latest('created_at')->limit(25)->get()->map(fn ($row) => (array) $row)->all();
    }

    private function insert(string $table, array $values)
    {
        abort_unless(Schema::hasTable($table), 503, "{$table} is not migrated yet.");

        $id = DB::table($table)->insertGetId($values + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table($table)->where('id', $id)->first();
    }

    private function instructorIdForSession(): ?int
    {
        if (!Schema::hasTable('instructors')) {
            return null;
        }

        $userId = session('user.id');
        if (!$userId) {
            return null;
        }

        $instructor = DB::table('instructors')->where('user_id', $userId)->first();

        return $instructor?->id ? (int) $instructor->id : null;
    }

    private function buildInstructorCourseDraft(array $payload, $sources): string
    {
        $prompt = trim((string) ($payload['prompt'] ?? ''));
        $generationType = str_replace('_', ' ', (string) $payload['generationType']);
        $sourceTitles = $sources->pluck('title')->filter()->values()->all();
        $sourceText = $sources
            ->map(fn ($source) => trim((string) ($source->extracted_text ?? '')))
            ->filter()
            ->implode("\n\n");

        $topicSeed = $payload['title']
            ?? ($sourceTitles[0] ?? null)
            ?? ($prompt ?: 'Professional Short Course');

        $sourceSummary = $sourceText
            ? $this->summariseSourceText($sourceText)
            : 'The instructor source material is available by title only. Add extracted text for richer lesson detail.';

        $audience = $this->inferAudience($prompt . ' ' . implode(' ', $sourceTitles));
        $title = $this->professionalTitle((string) $topicSeed);

        return implode("\n\n", [
            "Title:\n{$title}",
            "Generation Type:\n" . ucfirst($generationType),
            "Audience:\n{$audience}",
            "Course Positioning:\nA practical UnivAI short course built from instructor-supplied source material. It is AI-assisted, instructor-owned, and must pass human academic review before publication.",
            "Source Material Used:\n- " . implode("\n- ", $sourceTitles ?: ['Instructor source material']),
            "Source-Aware Summary:\n{$sourceSummary}",
            "Learning Outcomes:\n1. Explain the core concepts in {$title} using accurate professional language.\n2. Apply the main techniques from the source material to realistic learner tasks.\n3. Evaluate common mistakes, limitations and ethical considerations.\n4. Complete a practical mini-project that demonstrates job-relevant competence.\n5. Prepare for the final certificate assessment using AI-powered study support without reproducing protected content.",
            "Module Blueprint:\nModule 1: Orientation and Foundations\n- Lesson 1.1: What learners will be able to do by the end of the course\n- Lesson 1.2: Key terms, baseline concepts and diagnostic quiz\n\nModule 2: Core Skills and Guided Practice\n- Lesson 2.1: Step-by-step method from the instructor material\n- Lesson 2.2: Worked examples and guided exercises\n\nModule 3: Applied Scenarios\n- Lesson 3.1: Realistic case study\n- Lesson 3.2: Practice lab or portfolio activity\n\nModule 4: Review and Certification\n- Lesson 4.1: Revision guide and common mistakes\n- Lesson 4.2: Final assessment briefing",
            "Quizzes:\n- Entry diagnostic: 5 questions to place learner confidence.\n- Module checks: 5-8 questions after each module.\n- Final practice quiz: 15 mixed questions with explanations.",
            "Assignments:\n- Practical task: produce a small artefact, analysis, plan or demonstration based on the course topic.\n- Reflection task: identify how the skill applies in a workplace or academic setting.",
            "Certificate Assessment:\n- 60% final quiz or case-based test.\n- 40% practical assignment.\n- Recommended pass mark: 50% with all required activities completed.",
            "AI Study Support:\nAI may generate summaries, flashcards, practice questions, concept explanations and revision timetables. It must not publish raw instructor files, full source reproductions or unreviewed protected notes.",
            "Instructor Review Checklist:\n- Verify every academic claim against the source material.\n- Replace generic examples with domain-specific examples.\n- Check assessment answers and marking guide.\n- Confirm certificate rules, pricing and learner prerequisites.\n- Submit for UnivAI review before publishing.",
            $prompt ? "Original Instructor Prompt:\n{$prompt}" : "Original Instructor Prompt:\nNo detailed prompt was provided, so UnivAI expanded the course from the supplied source material.",
        ]);
    }

    private function summariseSourceText(string $sourceText): string
    {
        $clean = preg_replace('/\s+/', ' ', trim($sourceText));
        if (!$clean) {
            return 'No extracted text was supplied.';
        }

        return strlen($clean) > 900 ? substr($clean, 0, 900) . '...' : $clean;
    }

    private function inferAudience(string $seed): string
    {
        $lower = strtolower($seed);

        if (str_contains($lower, 'nurse') || str_contains($lower, 'clinical') || str_contains($lower, 'health')) {
            return 'Health, clinical and care professionals who need practical, supervised upskilling.';
        }

        if (str_contains($lower, 'business') || str_contains($lower, 'entrepreneur') || str_contains($lower, 'management')) {
            return 'Professionals, founders and team leaders who need practical business capability.';
        }

        if (str_contains($lower, 'data') || str_contains($lower, 'ai') || str_contains($lower, 'software')) {
            return 'Learners and working professionals building applied digital and technical skills.';
        }

        return 'Motivated learners who want a practical, certificate-ready short course with instructor supervision.';
    }

    private function professionalTitle(string $seed): string
    {
        $clean = trim(preg_replace('/\s+/', ' ', $seed));
        if ($clean === '') {
            return 'Professional Short Course';
        }

        $title = ucwords(strtolower($clean));

        return str_starts_with(strtolower($title), 'professional ')
            ? $title
            : "Professional {$title}";
    }
}
