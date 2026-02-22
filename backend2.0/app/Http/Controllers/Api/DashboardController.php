<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLecturerAssignment;
use App\Models\CourseAttempt;
use App\Models\Enrollment;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\Lesson;
use App\Models\LessonDocument;
use App\Models\Payment;
use App\Models\ProgramModule;
use App\Models\ResearchApplication;
use App\Models\ResearchOpportunity;
use App\Models\User;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function student(Request $request)
    {
        $role = $request->session()->get('user')['role'] ?? null;

        $actions = DB::table('student_actions')
            ->when($role, fn ($query) => $query->whereNull('role')->orWhere('role', $role))
            ->orderBy('priority')
            ->get(['id', 'title', 'description', 'href']);

        $deadlines = DB::table('student_deadlines')
            ->when($role, fn ($query) => $query->whereNull('role')->orWhere('role', $role))
            ->orderBy('due_date')
            ->get(['id', 'title', 'type', 'due_date']);

        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $walletValue = '0 AFTA';
        $walletNote = 'AFTACOIN Balance';
        if ($studentId && is_numeric($studentId)) {
            $totalPaid = Payment::query()
                ->whereHas('invoice', fn ($query) => $query->where('student_id', $studentId))
                ->sum('amount');
            $walletValue = number_format((float) $totalPaid, 2) . ' AFTA';
            $walletNote = 'Tuition paid to date';
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

        $courseIds = $assignments->pluck('course_id')->unique()->filter();
        $intakeIds = $assignments->pluck('intake_id')->unique()->filter();

        $studentsCount = $intakeIds->isNotEmpty()
            ? Enrollment::query()->whereIn('intake_id', $intakeIds)->distinct('user_id')->count('user_id')
            : 0;

        $pendingReviews = 0;
        if ($courseIds->isNotEmpty()) {
            $lessonIds = Lesson::query()->whereIn('course_id', $courseIds)->pluck('id');
            if ($lessonIds->isNotEmpty()) {
                $pendingReviews = LessonDocument::query()
                    ->whereIn('lesson_id', $lessonIds)
                    ->where('status', 'pending')
                    ->count();
            }
        }

        $metrics = collect([
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
        ]);

        $courseAttemptStats = CourseAttempt::query()
            ->select('program_modules.program_id', DB::raw('avg(course_attempts.final_percentage) as avg_score'))
            ->join('program_modules', 'program_modules.id', '=', 'course_attempts.module_id')
            ->groupBy('program_modules.program_id')
            ->get()
            ->keyBy('program_id');

        $managedCourses = $assignments->isNotEmpty()
            ? $assignments->map(function (CourseLecturerAssignment $assignment, $index) use ($courseAttemptStats) {
                $course = $assignment->course;
                if (!$course) {
                    return null;
                }
                $metric = $courseAttemptStats->get($course->id);
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'studentCount' => Enrollment::query()->where('intake_id', $assignment->intake_id)->distinct('user_id')->count('user_id'),
                    'avgProgress' => $metric?->avg_score ? round($metric->avg_score) : 0,
                    'intakeId' => $assignment->intake_id,
                    'intakeName' => $assignment->intake?->name,
                ];
            })->filter()->values()
            : $courses->map(function ($course, $index) use ($courseAttemptStats) {
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
            'metrics' => $metrics->map(fn ($item) => [
                'key' => $item->key,
                'label' => $item->label,
                'value' => $item->value,
                'note' => $item->note,
            ]),
            'managedCourses' => $managedCourses,
        ]);
    }

    public function employer()
    {
        $jobs = JobPosting::query()->orderBy('created_at', 'desc')->get();
        $jobApplicants = JobApplication::query()->select('job_id', DB::raw('count(*) as total'))->groupBy('job_id')->pluck('total', 'job_id');
        $research = ResearchOpportunity::query()->orderBy('created_at', 'desc')->get();
        $researchApplicants = ResearchApplication::query()->count();
        $today = now()->toDateString();
        $todayApplicants = JobApplication::query()->whereDate('created_at', $today)->count()
            + ResearchApplication::query()->whereDate('created_at', $today)->count();
        $todayNote = $todayApplicants > 0 ? "+{$todayApplicants} new today" : 'No new applicants today';

        return response()->json([
            'stats' => [
                'activeJobs' => [
                    'value' => $jobs->count(),
                    'note' => 'Active job listings',
                ],
                'activeResearch' => [
                    'value' => $research->count(),
                    'note' => 'Open research opportunities',
                ],
                'totalApplicants' => [
                    'value' => $jobApplicants->sum() + $researchApplicants,
                    'note' => $todayNote,
                ],
            ],
            'postedJobs' => $jobs->take(3)->map(fn ($job) => [
                'id' => $job->id,
                'title' => $job->title,
                'status' => 'Open',
                'applicants' => (int) ($jobApplicants[$job->id] ?? 0),
            ]),
            'research' => $research->take(3)->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'field' => $item->field,
                'description' => $item->description,
            ]),
        ]);
    }

    public function admin()
    {
        $revenue = Payment::query()->sum('amount');
        $studentCount = User::query()->where('role', 'like', '%student%')->count();
        $courseCount = Course::query()->count();
        $recentApplications = Application::query()
            ->whereDate('created_at', '>=', now()->subDays(7)->toDateString())
            ->count();

        return response()->json([
            'metrics' => [
                [
                    'key' => 'revenue',
                    'label' => 'Total Revenue',
                    'value' => '$' . number_format((float) $revenue, 2),
                    'note' => 'Tuition payments received',
                ],
                [
                    'key' => 'students',
                    'label' => 'Total Students',
                    'value' => (string) $studentCount,
                    'note' => 'Active student accounts',
                ],
                [
                    'key' => 'courses',
                    'label' => 'Total Courses',
                    'value' => (string) $courseCount,
                    'note' => 'Programs and courses offered',
                ],
                [
                    'key' => 'activity',
                    'label' => 'Platform Activity',
                    'value' => (string) $recentApplications,
                    'note' => 'Applications in last 7 days',
                ],
            ],
        ]);
    }
}
