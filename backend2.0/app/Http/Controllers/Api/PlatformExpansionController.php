<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlatformExpansionController extends Controller
{
    public function adminOverview()
    {
        return [
            'courseOfferings' => $this->latest('course_offerings'),
            'deliveryGroups' => $this->latest('course_delivery_groups'),
            'assessments' => $this->latest('assessments'),
            'gradingPolicies' => $this->latest('grading_policies'),
            'officialContentAssets' => $this->latest('official_content_assets'),
            'testAnnouncements' => $this->latest('test_announcements'),
            'shortCourseCategories' => $this->latest('short_course_categories'),
            'instructorApplications' => $this->latest('instructor_applications'),
            'instructors' => $this->latest('instructors'),
            'aiUsageLogs' => $this->latest('ai_usage_logs'),
            'contentReviewItems' => $this->latest('content_review_items'),
        ];
    }

    public function studentLearning()
    {
        $user = session('user');
        $studentId = $user['id'] ?? null;

        return [
            'courseEnrollments' => $this->whereLatest('course_enrollments', 'student_id', $studentId),
            'testAnnouncements' => $this->latest('test_announcements'),
            'studyDocuments' => $this->whereLatest('student_study_documents', 'student_id', $studentId),
            'studySessions' => $this->whereLatest('ai_study_sessions', 'student_id', $studentId),
        ];
    }

    public function lecturerTesting()
    {
        $user = session('user');
        $lecturerId = $user['id'] ?? null;

        return [
            'courseOfferings' => $this->whereLatest('course_offerings', 'main_lecturer_id', $lecturerId),
            'testAnnouncements' => $this->whereLatest('test_announcements', 'lecturer_id', $lecturerId),
            'assessments' => $this->latest('assessments'),
        ];
    }

    public function instructorPortal()
    {
        $user = session('user');
        $userId = $user['id'] ?? null;
        $instructor = Schema::hasTable('instructors')
            ? DB::table('instructors')->where('user_id', $userId)->first()
            : null;

        return [
            'instructor' => $instructor,
            'applications' => $this->whereLatest('instructor_applications', 'user_id', $userId),
            'earnings' => $instructor ? $this->whereLatest('instructor_earnings', 'instructor_id', $instructor->id) : [],
            'payouts' => $instructor ? $this->whereLatest('instructor_payouts', 'instructor_id', $instructor->id) : [],
            'courseSources' => $instructor ? $this->whereLatest('instructor_course_sources', 'instructor_id', $instructor->id) : [],
            'aiGenerations' => $instructor ? $this->whereLatest('instructor_ai_generations', 'instructor_id', $instructor->id) : [],
            'aiPackages' => $this->latest('instructor_ai_packages'),
        ];
    }

    public function storeCourseOffering(Request $request)
    {
        $payload = $request->validate([
            'programmeCourseId' => ['nullable', 'integer'],
            'academicYearId' => ['nullable', 'integer'],
            'semesterId' => ['nullable', 'integer'],
            'intakeId' => ['nullable', 'string'],
            'mainLecturerId' => ['nullable', 'integer'],
            'status' => ['nullable', 'string'],
        ]);

        return $this->insert('course_offerings', [
            'programme_course_id' => $payload['programmeCourseId'] ?? null,
            'academic_year_id' => $payload['academicYearId'] ?? null,
            'semester_id' => $payload['semesterId'] ?? null,
            'intake_id' => $payload['intakeId'] ?? null,
            'main_lecturer_id' => $payload['mainLecturerId'] ?? null,
            'status' => $payload['status'] ?? 'draft',
        ]);
    }

    public function storeDeliveryGroup(Request $request)
    {
        $payload = $request->validate([
            'courseOfferingId' => ['required', 'integer'],
            'name' => ['required', 'string'],
            'mode' => ['required', 'in:online,hybrid,physical'],
            'cohortId' => ['nullable', 'string'],
            'campusId' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer'],
            'assistantLecturerId' => ['nullable', 'integer'],
            'scheduleNotes' => ['nullable', 'string'],
        ]);

        return $this->insert('course_delivery_groups', [
            'course_offering_id' => $payload['courseOfferingId'],
            'name' => $payload['name'],
            'mode' => $payload['mode'],
            'cohort_id' => $payload['cohortId'] ?? null,
            'campus_id' => $payload['campusId'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'assistant_lecturer_id' => $payload['assistantLecturerId'] ?? null,
            'schedule_notes' => $payload['scheduleNotes'] ?? null,
        ]);
    }

    public function storeAssessment(Request $request)
    {
        $payload = $request->validate([
            'courseOfferingId' => ['required', 'integer'],
            'title' => ['required', 'string'],
            'type' => ['nullable', 'string'],
            'scope' => ['nullable', 'in:all_students,delivery_group,practical_group,individual'],
            'coverage' => ['nullable', 'array'],
            'totalMarks' => ['nullable', 'numeric'],
            'weight' => ['nullable', 'numeric'],
            'deliveryMode' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        return $this->insert('assessments', [
            'course_offering_id' => $payload['courseOfferingId'],
            'title' => $payload['title'],
            'type' => $payload['type'] ?? 'test',
            'scope' => $payload['scope'] ?? 'all_students',
            'coverage' => json_encode($payload['coverage'] ?? []),
            'total_marks' => $payload['totalMarks'] ?? 100,
            'weight' => $payload['weight'] ?? 0,
            'delivery_mode' => $payload['deliveryMode'] ?? 'online',
            'status' => $payload['status'] ?? 'draft',
        ]);
    }

    public function storeGradingPolicy(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string'],
            'passMark' => ['nullable', 'numeric'],
            'examMinimum' => ['nullable', 'numeric'],
            'practicalMinimum' => ['nullable', 'numeric'],
            'repeatRule' => ['nullable', 'string'],
            'maxAttempts' => ['nullable', 'integer'],
            'gpaScaleType' => ['nullable', 'string'],
            'gradeBands' => ['nullable', 'array'],
            'progressionPolicy' => ['nullable', 'array'],
        ]);

        return $this->insert('grading_policies', [
            'name' => $payload['name'],
            'pass_mark' => $payload['passMark'] ?? 50,
            'exam_minimum' => $payload['examMinimum'] ?? null,
            'practical_minimum' => $payload['practicalMinimum'] ?? null,
            'repeat_rule' => $payload['repeatRule'] ?? null,
            'max_attempts' => $payload['maxAttempts'] ?? 1,
            'gpa_scale_type' => $payload['gpaScaleType'] ?? 'standard',
            'grade_bands' => json_encode($payload['gradeBands'] ?? []),
            'progression_policy' => json_encode($payload['progressionPolicy'] ?? []),
        ]);
    }

    public function storeTestAnnouncement(Request $request)
    {
        $user = session('user');
        $payload = $request->validate([
            'courseOfferingId' => ['nullable', 'integer'],
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'testDate' => ['nullable', 'date'],
            'durationMinutes' => ['nullable', 'integer'],
            'format' => ['nullable', 'string'],
            'difficulty' => ['nullable', 'string'],
            'coverage' => ['nullable', 'array'],
            'status' => ['nullable', 'string'],
        ]);

        $announcement = $this->insert('test_announcements', [
            'course_offering_id' => $payload['courseOfferingId'] ?? null,
            'lecturer_id' => $user['id'] ?? null,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'test_date' => $payload['testDate'] ?? null,
            'duration_minutes' => $payload['durationMinutes'] ?? null,
            'format' => $payload['format'] ?? null,
            'difficulty' => $payload['difficulty'] ?? null,
            'status' => $payload['status'] ?? 'draft',
        ]);

        foreach (($payload['coverage'] ?? []) as $item) {
            DB::table('test_coverage_items')->insert([
                'test_announcement_id' => $announcement->id,
                'topic' => is_array($item) ? ($item['topic'] ?? null) : $item,
                'notes' => is_array($item) ? ($item['notes'] ?? null) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $announcement;
    }

    public function storeStudySession(Request $request)
    {
        $user = session('user');
        $payload = $request->validate([
            'courseId' => ['nullable', 'string'],
            'testAnnouncementId' => ['nullable', 'integer'],
            'mode' => ['required', 'in:study_vault,cram_mode,combined'],
            'goal' => ['nullable', 'string'],
            'availableMinutes' => ['nullable', 'integer'],
            'sourceDocumentIds' => ['nullable', 'array'],
            'officialDocumentIds' => ['nullable', 'array'],
        ]);

        return $this->insert('ai_study_sessions', [
            'student_id' => $user['id'] ?? null,
            'course_id' => $payload['courseId'] ?? null,
            'test_announcement_id' => $payload['testAnnouncementId'] ?? null,
            'mode' => $payload['mode'],
            'goal' => $payload['goal'] ?? null,
            'available_minutes' => $payload['availableMinutes'] ?? null,
            'source_document_ids' => json_encode($payload['sourceDocumentIds'] ?? []),
            'official_document_ids' => json_encode($payload['officialDocumentIds'] ?? []),
            'output_summary' => $this->buildStudySessionOutput($payload),
        ]);
    }

    public function storeInstructorApplication(Request $request)
    {
        $payload = $request->validate([
            'fullName' => ['required', 'string'],
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string'],
            'expertise' => ['nullable', 'string'],
            'bio' => ['nullable', 'string'],
            'yearsExperience' => ['nullable', 'integer'],
            'highestQualification' => ['nullable', 'string'],
            'portfolioUrl' => ['nullable', 'string'],
        ]);

        return $this->insert('instructor_applications', [
            'user_id' => session('user.id'),
            'full_name' => $payload['fullName'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? null,
            'expertise' => $payload['expertise'] ?? null,
            'bio' => $payload['bio'] ?? null,
            'years_experience' => $payload['yearsExperience'] ?? null,
            'highest_qualification' => $payload['highestQualification'] ?? null,
            'portfolio_url' => $payload['portfolioUrl'] ?? null,
            'status' => 'submitted',
        ]);
    }

    private function latest(string $table): array
    {
        if (!Schema::hasTable($table)) {
            return [];
        }

        return DB::table($table)->latest('created_at')->limit(20)->get()->map(fn ($row) => (array) $row)->all();
    }

    private function whereLatest(string $table, string $column, $value): array
    {
        if (!Schema::hasTable($table) || $value === null) {
            return [];
        }

        return DB::table($table)->where($column, $value)->latest('created_at')->limit(20)->get()->map(fn ($row) => (array) $row)->all();
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

    private function buildStudySessionOutput(array $payload): string
    {
        $mode = (string) $payload['mode'];
        $goal = trim((string) ($payload['goal'] ?? 'Improve understanding and prepare confidently.'));
        $minutes = max(30, (int) ($payload['availableMinutes'] ?? 120));
        $blocks = $this->studyBlocks($minutes, $mode);
        $sourceCount = count($payload['sourceDocumentIds'] ?? []);
        $officialCount = count($payload['officialDocumentIds'] ?? []);

        $modeLabel = match ($mode) {
            'cram_mode' => 'Cram Mode',
            'combined' => 'Combined Study Mode',
            default => 'AI Study Vault',
        };

        return implode("\n\n", [
            "Mode:\n{$modeLabel}",
            "Goal:\n{$goal}",
            "Approved Sources:\n- Official UnivAI materials selected: {$officialCount}\n- Student uploaded materials selected: {$sourceCount}",
            "Study Timetable:\n" . implode("\n", $blocks),
            "Priority Concepts:\n1. Start with the lecturer-approved coverage and official lesson outcomes.\n2. Identify definitions, formulas, cases or procedures that appear repeatedly.\n3. Compare student notes against official material to find weak or missing areas.\n4. Practise exam-style questions before rereading notes.",
            "Summary Notes:\nUse concise bullet notes focused on concepts, examples, and common mistakes. Do not reproduce protected official notes or full transcripts.",
            "Flashcards:\n- Key term -> plain-language explanation.\n- Process step -> reason it matters.\n- Common mistake -> correction.\n- Example scenario -> best response.",
            "Practice Quiz:\n- 5 recall questions.\n- 5 application questions.\n- 3 scenario questions.\n- 2 confidence-check questions asking what still feels unclear.",
            "Final 30-Minute Review:\n1. Review weak areas only.\n2. Recite key definitions without looking.\n3. Answer one mixed practice set.\n4. Write a final checklist of formulas, concepts or cases to remember.",
            "Content Protection:\nAI can explain, summarise and quiz approved material for the enrolled learner. It must not output raw official files, full protected notes, full video transcripts or downloadable official content.",
        ]);
    }

    private function studyBlocks(int $minutes, string $mode): array
    {
        if ($mode === 'cram_mode') {
            $review = max(15, (int) floor($minutes * 0.25));
            $core = max(30, (int) floor($minutes * 0.45));
            $practice = max(20, $minutes - $review - $core);

            return [
                "- {$review} min: scan coverage, rank weak topics and collect key definitions.",
                "- {$core} min: study the highest-risk concepts with examples.",
                "- {$practice} min: answer practice questions and correct mistakes.",
                "- 10 min: final confidence check and exam-day reminders.",
            ];
        }

        $foundation = max(30, (int) floor($minutes * 0.3));
        $deepWork = max(45, (int) floor($minutes * 0.4));
        $practice = max(30, $minutes - $foundation - $deepWork);

        return [
            "- {$foundation} min: organise official and uploaded sources, then create a topic map.",
            "- {$deepWork} min: work through priority concepts with AI explanations and examples.",
            "- {$practice} min: complete practice questions, flashcards and weak-area review.",
        ];
    }
}
