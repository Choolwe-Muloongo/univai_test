<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLecturerAssignment;
use App\Models\CourseAttempt;
use App\Models\Enrollment;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\LessonDocument;
use App\Models\Payment;
use App\Models\ResearchApplication;
use App\Models\ResearchOpportunity;
use App\Models\ResearcherApplication;
use App\Models\Application;
use App\Support\Notifications\InAppNotifier;
use Illuminate\Http\Request;
use App\Support\StudentAccess;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function student(Request $request, InAppNotifier $notifier)
    {
        $sessionUser = StudentAccess::sessionPayload($request->session()->get('user') ?? []);
        $request->session()->put('user', $sessionUser);
        $notifier->notifyMonthlyRatingReminder($sessionUser);
        $role = $sessionUser['role'] ?? null;

        $actions = DB::table('student_actions')
            ->when($role, fn ($query) => $query->whereNull('role')->orWhere('role', $role))
            ->orderBy('priority')
            ->get(['id', 'title', 'description', 'href']);

        $deadlines = DB::table('student_deadlines')
            ->when($role, fn ($query) => $query->whereNull('role')->orWhere('role', $role))
            ->orderBy('due_date')
            ->get(['id', 'title', 'type', 'due_date']);

        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $isCashbackEligible = StudentAccess::cashbackEligible($sessionUser['accessTier'] ?? null);
        $walletValue = '0 AFTA';
        $walletNote = 'AFTACOIN Balance';
        if ($studentId && is_numeric($studentId) && $isCashbackEligible) {
            $totalPaid = Payment::query()
                ->whereHas('invoice', fn ($query) => $query->where('student_id', $studentId))
                ->sum('amount');
            $walletValue = number_format((float) $totalPaid, 2) . ' AFTA';
            $walletNote = 'Tuition paid to date';
        } elseif (!$isCashbackEligible) {
            $walletNote = 'Free learning tier is not eligible for cashback';
        }

        return response()->json([
            'actions' => $actions->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'description' => $item->description,
                'href' => $item->href,
            ]),
            'deadlines' => $deadlines->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'type' => $item->type,
                'date' => optional($item->due_date)->format('M d'),
            ]),
            'wallet' => [
                'label' => 'Wallet Balance',
                'value' => $walletValue,
                'note' => $walletNote,
                'cashbackEligible' => $isCashbackEligible,
            ],
        ]);
    }

    public function lecturer()
    {
        $sessionUser = request()->session()->get('user');
        $lecturerId = $sessionUser['id'] ?? null;

        $assignments = collect();
        if ($lecturerId) {
            $assignments = CourseLecturerAssignment::with(['course', 'intake'])
                ->where('lecturer_id', $lecturerId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        $courses = $assignments->isNotEmpty()
            ? $assignments->map(fn (CourseLecturerAssignment $assignment) => $assignment->course)->filter()
            : Course::query()->orderBy('title')->take(4)->get();

        $courseIds = $assignments->pluck('course_id')->unique()->filter()->values();
        $intakeIds = $assignments->pluck('intake_id')->unique()->filter()->values();

        $studentCountsByIntake = $intakeIds->isNotEmpty()
            ? Enrollment::query()
                ->whereIn('intake_id', $intakeIds)
                ->select('intake_id', DB::raw('count(distinct user_id) as total'))
                ->groupBy('intake_id')
                ->pluck('total', 'intake_id')
            : collect();

        $studentsCount = (int) $studentCountsByIntake->sum();

        $pendingReviews = 0;
        if ($courseIds->isNotEmpty()) {
            $lessonIds = DB::table('short_course_lessons')
                ->whereIn('short_course_id', $courseIds)
                ->pluck('lesson_id');

            if ($lessonIds->isNotEmpty()) {
                $pendingReviews = LessonDocument::query()
                    ->whereIn('lesson_id', $lessonIds)
                    ->where('status', 'pending')
                    ->count();
            }
        }

        $courseAttemptStats = CourseAttempt::query()
            ->select('program_modules.program_id', DB::raw('avg(course_attempts.final_percentage) as avg_score'))
            ->join('program_modules', 'program_modules.id', '=', 'course_attempts.module_id')
            ->groupBy('program_modules.program_id')
            ->get()
            ->keyBy('program_id');

        $managedCourses = $assignments->isNotEmpty()
            ? $assignments->map(function (CourseLecturerAssignment $assignment) use ($courseAttemptStats, $studentCountsByIntake) {
                $course = $assignment->course;
                if (!$course) {
                    return null;
                }
                $metric = $courseAttemptStats->get($course->id);
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'studentCount' => (int) ($studentCountsByIntake[$assignment->intake_id] ?? 0),
                    'avgProgress' => $metric?->avg_score ? round($metric->avg_score) : 0,
                    'intakeId' => $assignment->intake_id,
                    'intakeName' => $assignment->intake?->name,
                ];
            })->filter()->values()
            : $courses->map(function ($course) use ($courseAttemptStats) {
                $metric = $courseAttemptStats->get($course->id);
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'studentCount' => 0,
                    'avgProgress' => $metric?->avg_score ? round($metric->avg_score) : 0,
                    'intakeId' => null,
                    'intakeName' => null,
                ];
            });

        return response()->json([
            'metrics' => [
                [
                    'key' => 'courses',
                    'label' => 'Courses Taught',
                    'value' => (string) $courseIds->count(),
                    'note' => 'Active this semester',
                ],
                [
                    'key' => 'students',
                    'label' => 'Total Students',
                    'value' => (string) $studentsCount,
                    'note' => 'Across assigned intakes',
                ],
                [
                    'key' => 'messages',
                    'label' => 'Pending Reviews',
                    'value' => (string) $pendingReviews,
                    'note' => 'Lesson documents awaiting approval',
                ],
            ],
            'managedCourses' => $managedCourses,
        ]);
    }

    public function researcher()
    {
        $sessionUser = request()->session()->get('user');
        $email = $sessionUser['email'] ?? null;

        $application = $email
            ? ResearcherApplication::query()->where('email', $email)->where('status', 'approved')->latest('reviewed_at')->first()
            : null;

        return response()->json([
            'profile' => [
                'name' => $sessionUser['name'] ?? null,
                'email' => $sessionUser['email'] ?? null,
                'institutionAffiliation' => $application?->institution_affiliation,
                'researchArea' => $application?->research_area,
                'orcidId' => $application?->orcid_id,
            ],
            'metrics' => [
                [
                    'key' => 'status',
                    'label' => 'Portal Access',
                    'value' => 'Active',
                    'note' => 'Researcher account approved',
                ],
            ],
        ]);
    }

    public function employer()
    {
        $activeJobs = JobPosting::query()->count();
        $postedJobs = JobPosting::query()->orderBy('created_at', 'desc')->take(3)->get();
        $activeResearch = ResearchOpportunity::query()->count();
        $research = ResearchOpportunity::query()->orderBy('created_at', 'desc')->take(3)->get();
        $jobApplicants = JobApplication::query()->select('job_id', DB::raw('count(*) as total'))->groupBy('job_id')->pluck('total', 'job_id');
        $researchApplicants = ResearchApplication::query()->count();
        $today = now()->toDateString();
        $todayApplicants = JobApplication::query()->whereDate('created_at', $today)->count()
            + ResearchApplication::query()->whereDate('created_at', $today)->count();
        $todayNote = $todayApplicants > 0 ? "+{$todayApplicants} new today" : 'No new applicants today';

        return response()->json([
            'stats' => [
                'activeJobs' => [
                    'value' => $activeJobs,
                    'note' => 'Active job listings',
                ],
                'activeResearch' => [
                    'value' => $activeResearch,
                    'note' => 'Open research opportunities',
                ],
                'totalApplicants' => [
                    'value' => $jobApplicants->sum() + $researchApplicants,
                    'note' => $todayNote,
                ],
            ],
            'postedJobs' => $postedJobs->map(fn ($job) => [
                'id' => $job->id,
                'title' => $job->title,
                'status' => 'Open',
                'applicants' => (int) ($jobApplicants[$job->id] ?? 0),
            ]),
            'research' => $research->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'field' => $item->field,
                'description' => $item->description,
            ]),
        ]);
    }

    public function admin()
    {
        $pendingAdmissions = Application::query()->whereIn('status', ['submitted', 'under_review'])->count();
        $pendingLecturerApplications = DB::table('lecturer_applications')->whereIn('status', ['submitted', 'under_review'])->count();
        $pendingLessonDocuments = LessonDocument::query()->where('status', 'pending')->count();
        $failedPayments = Payment::query()->whereIn('status', ['failed', 'rejected'])->count();

        return response()->json([
            'metrics' => [
                ['label' => 'Admissions Pending', 'value' => $pendingAdmissions, 'note' => 'Awaiting review'],
                ['label' => 'Lecturer Applications', 'value' => $pendingLecturerApplications, 'note' => 'Awaiting decision'],
                ['label' => 'Content Reviews', 'value' => $pendingLessonDocuments, 'note' => 'Documents pending'],
                ['label' => 'Payment Exceptions', 'value' => $failedPayments, 'note' => 'Failed or rejected payments'],
            ],
        ]);
    }
}
