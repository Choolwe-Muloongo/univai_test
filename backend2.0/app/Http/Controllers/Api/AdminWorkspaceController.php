<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminWorkspaceController extends Controller
{
    public function today()
    {
        return response()->json([
            'title' => "Today's Tasks",
            'metrics' => [
                $this->metric('Pending admissions', $this->countWhereIn('applications', 'status', ['submitted', 'under_review', 'pending'])),
                $this->metric('Lecturer applications', $this->countWhereIn('lecturer_applications', 'status', ['submitted', 'under_review', 'pending'])),
                $this->metric('Open feedback', $this->countWhereIn('feedback_posts', 'status', ['open', 'planned', 'under_review'])),
                $this->metric('Unverified bug reports', $this->countWhereIn('beta_reports', 'status', ['new', 'open', 'unverified'])),
                $this->metric('Unpaid invoices', $this->countWhereIn('invoices', 'status', ['pending', 'unpaid', 'overdue'])),
            ],
            'queues' => [
                'admissions' => $this->latestRows('applications', 8),
                'lecturerApplications' => $this->latestRows('lecturer_applications', 8),
                'feedback' => $this->latestRows('feedback_posts', 8),
                'errors' => $this->latestRows('beta_reports', 8),
                'invoices' => $this->latestRows('invoices', 8),
            ],
        ]);
    }

    public function workspace(Request $request, ?string $workspace = null)
    {
        $slug = trim((string) $workspace, '/');
        $config = $this->workspaceConfig($slug);

        return response()->json(array_merge($config, [
            'metrics' => $this->workspaceMetrics($slug),
            'records' => $this->workspaceRecords($slug),
            'actions' => $this->workspaceActions($slug),
            'endpoints' => $this->workspaceEndpoints($slug),
            'generatedAt' => now()->toISOString(),
        ]));
    }

    public function report(Request $request, string $type)
    {
        $type = Str::slug($type);
        $records = match ($type) {
            'admissions' => $this->latestRows('applications', 100),
            'learners' => $this->usersByRoles(['student', 'freemium-student', 'premium-student', 'certificate-student', 'programme-student', 'program-student', 'enrolled'], 100),
            'academic' => [
                'programs' => $this->latestRows('programs', 50),
                'intakes' => $this->latestRows('intakes', 50),
                'programmeCourses' => $this->latestRows('programme_courses', 50),
                'assignments' => $this->latestRows('lecturer_assignments', 50),
            ],
            'short-courses' => [
                'courses' => $this->latestRows('short_courses', 80),
                'drafts' => $this->latestRows('short_course_drafts', 80),
                'enrolments' => $this->latestRows('short_course_enrollments', 80),
            ],
            'ai-content' => [
                'aiGenerations' => $this->latestRows('ai_generations', 100),
                'instructorAiGenerations' => $this->latestRows('instructor_ai_generations', 100),
                'contentReviews' => $this->latestRows('content_reviews', 100),
            ],
            'system' => [
                'betaReports' => $this->latestRows('beta_reports', 100),
                'auditLogs' => $this->latestRows('user_state_transitions', 100),
                'notifications' => $this->latestRows('in_app_notifications', 100),
            ],
            default => ['savedReports' => $this->latestRows('saved_reports', 100)],
        };

        return response()->json([
            'type' => $type,
            'title' => Str::headline($type) . ' Report',
            'metrics' => $this->reportMetrics($type),
            'records' => $records,
            'generatedAt' => now()->toISOString(),
        ]);
    }

    public function usersByGroup(string $group)
    {
        $roles = match (Str::slug($group)) {
            'learners' => ['student', 'freemium-student', 'premium-student', 'certificate-student', 'programme-student', 'program-student', 'enrolled'],
            'programme-students' => ['programme-student', 'program-student', 'enrolled'],
            'lecturers' => ['lecturer'],
            'instructors' => ['instructor'],
            'employers' => ['employer'],
            default => [],
        };

        return response()->json([
            'group' => $group,
            'roles' => $roles,
            'data' => $roles ? $this->usersByRoles($roles, 150) : [],
            'count' => $roles ? $this->countWhereIn('users', 'role', $roles) : 0,
        ]);
    }

    public function createWorkspaceRecord(Request $request, string $workspace)
    {
        $slug = Str::slug($workspace);
        $payload = $request->all();

        $result = match ($slug) {
            'notifications' => $this->createNotification($payload),
            'delivery-logs' => $this->createDeliveryLog($payload),
            'saved-reports', 'reports' => $this->createSavedReport($payload),
            default => response()->json([
                'message' => 'This workspace is read-only or uses a dedicated endpoint.',
                'workspace' => $slug,
                'dedicatedEndpoints' => $this->workspaceEndpoints($slug),
            ], 422),
        };

        return $result;
    }

    private function workspaceConfig(string $slug): array
    {
        return match ($slug) {
            'results' => ['title' => 'Results / Grades', 'section' => 'Formal Programmes', 'description' => 'Academic results and grade monitoring across formal programme students.'],
            'financial-clearance' => ['title' => 'Financial Clearance', 'section' => 'Formal Programmes', 'description' => 'Registration, exam, results and progression clearance based on invoices/payments.'],
            'progression' => ['title' => 'Progression', 'section' => 'Formal Programmes', 'description' => 'Students eligible to progress to the next semester/year.'],
            'delivery-groups' => ['title' => 'Delivery Groups', 'section' => 'Mode & Delivery', 'description' => 'Class/delivery groups for timetable and teaching operations.'],
            'timetables' => ['title' => 'Timetables', 'section' => 'Mode & Delivery', 'description' => 'Student and lecturer schedule data from course sessions.'],
            'attendance' => ['title' => 'Attendance', 'section' => 'Mode & Delivery', 'description' => 'Attendance readiness and session participation records.'],
            'live-classes' => ['title' => 'Live Class Links', 'section' => 'Mode & Delivery', 'description' => 'Online class meeting links and active course sessions.'],
            'notifications' => ['title' => 'Notifications', 'section' => 'Communication', 'description' => 'In-app notification records and delivery readiness.'],
            'delivery-logs' => ['title' => 'Delivery Logs', 'section' => 'Communication', 'description' => 'Email/SMS/in-app delivery logs and failures.'],
            'audit' => ['title' => 'Audit Logs', 'section' => 'System', 'description' => 'Admin and account state transition logs.'],
            'integrations' => ['title' => 'Integrations', 'section' => 'System', 'description' => 'SMTP, payment, storage and AI integration readiness.'],
            default => ['title' => Str::headline(str_replace('/', ' ', $slug ?: 'workspace')), 'section' => 'Admin', 'description' => 'Operational workspace backed by live platform records where available.'],
        };
    }

    private function workspaceMetrics(string $slug): array
    {
        return match ($slug) {
            'financial-clearance' => [
                $this->metric('Invoices', $this->countTable('invoices')),
                $this->metric('Unpaid', $this->countWhereIn('invoices', 'status', ['pending', 'unpaid', 'overdue'])),
                $this->metric('Payments', $this->countTable('payments')),
            ],
            'progression' => [
                $this->metric('Programme students', $this->countWhereIn('users', 'role', ['programme-student', 'program-student', 'enrolled'])),
                $this->metric('Intakes', $this->countTable('intakes')),
                $this->metric('Results', $this->countTable('grades')),
            ],
            'results' => [
                $this->metric('Grades', $this->countTable('grades')),
                $this->metric('Exam results', $this->countTable('exam_results')),
                $this->metric('Assignments', $this->countTable('student_assignment_submissions')),
            ],
            'notifications' => [
                $this->metric('Notifications', $this->countTable('in_app_notifications')),
                $this->metric('Unread', $this->countWhereNull('in_app_notifications', 'read_at')),
            ],
            default => [
                $this->metric('Users', $this->countTable('users')),
                $this->metric('Programs', $this->countTable('programs')),
                $this->metric('Short courses', $this->countTable('short_courses')),
                $this->metric('Invoices', $this->countTable('invoices')),
            ],
        };
    }

    private function workspaceRecords(string $slug): array
    {
        return match ($slug) {
            'results' => ['grades' => $this->latestRows('grades', 50), 'examResults' => $this->latestRows('exam_results', 50)],
            'financial-clearance' => ['invoices' => $this->latestRows('invoices', 60), 'payments' => $this->latestRows('payments', 60)],
            'progression' => ['students' => $this->usersByRoles(['programme-student', 'program-student', 'enrolled'], 80), 'intakes' => $this->latestRows('intakes', 30)],
            'delivery-groups' => ['groups' => $this->latestRows('course_delivery_groups', 80), 'offerings' => $this->latestRows('course_offerings', 80)],
            'timetables', 'live-classes', 'attendance' => ['sessions' => $this->latestRows('course_sessions', 80), 'practicals' => $this->latestRows('practical_sessions', 50)],
            'notifications' => ['notifications' => $this->latestRows('in_app_notifications', 80)],
            'delivery-logs' => ['notifications' => $this->latestRows('in_app_notifications', 100), 'messages' => $this->latestRows('message_deliveries', 100)],
            'audit' => ['transitions' => $this->latestRows('user_state_transitions', 100), 'auditLogs' => $this->latestRows('audit_logs', 100)],
            'integrations' => ['paymentSettings' => $this->latestRows('payment_settings', 20), 'systemHealth' => []],
            default => ['data' => []],
        };
    }

    private function workspaceActions(string $slug): array
    {
        return match ($slug) {
            'financial-clearance' => ['Review unpaid invoices', 'Verify payments', 'Check registration deposit', 'Unlock exam/results clearance'],
            'progression' => ['Review eligible students', 'Check results release', 'Check full clearance', 'Prepare next intake progression'],
            'notifications' => ['Create notification', 'Review unread notifications', 'Check delivery target', 'Archive old notices'],
            default => ['Review live records', 'Create via dedicated endpoint where supported', 'Export/report', 'Escalate issues'],
        };
    }

    private function workspaceEndpoints(string $slug): array
    {
        return match ($slug) {
            'financial-clearance' => ['/admin/workspace/financial-clearance', '/admin/invoices', '/admin/payments'],
            'progression' => ['/admin/workspace/progression', '/admin/reports/academic'],
            'notifications' => ['/admin/workspace/notifications', '/notifications'],
            'reports' => ['/admin/reports/{type}', '/admin/saved-reports'],
            default => ['/admin/workspace/' . $slug],
        };
    }

    private function reportMetrics(string $type): array
    {
        return match ($type) {
            'admissions' => [$this->metric('Applications', $this->countTable('applications')), $this->metric('Offers', $this->countWhereIn('applications', 'status', ['offer_sent', 'approved'])), $this->metric('Admitted', $this->countWhereIn('applications', 'status', ['admitted']))],
            'learners' => [$this->metric('Learners', $this->countWhereIn('users', 'role', ['student', 'freemium-student', 'premium-student', 'certificate-student', 'programme-student', 'program-student', 'enrolled']))],
            'short-courses' => [$this->metric('Courses', $this->countTable('short_courses')), $this->metric('Enrolments', $this->countTable('short_course_enrollments'))],
            'system' => [$this->metric('Errors', $this->countTable('beta_reports')), $this->metric('Audit records', $this->countTable('user_state_transitions'))],
            default => [$this->metric('Records', 0)],
        };
    }

    private function createNotification(array $payload)
    {
        if (!Schema::hasTable('in_app_notifications')) {
            return response()->json(['message' => 'Notifications table does not exist.'], 503);
        }

        $data = [
            'user_key' => (string) ($payload['userKey'] ?? $payload['user_key'] ?? 'broadcast'),
            'type' => (string) ($payload['type'] ?? 'admin'),
            'title' => (string) ($payload['title'] ?? 'Admin notification'),
            'body' => $payload['body'] ?? null,
            'href' => $payload['href'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $id = DB::table('in_app_notifications')->insertGetId($data);
        return response()->json(array_merge(['id' => $id], $data), 201);
    }

    private function createDeliveryLog(array $payload)
    {
        if (!Schema::hasTable('message_deliveries')) {
            return response()->json(['message' => 'Message delivery log table does not exist yet.'], 503);
        }

        $data = [
            'channel' => (string) ($payload['channel'] ?? 'admin'),
            'recipient' => (string) ($payload['recipient'] ?? 'unknown'),
            'subject' => $payload['subject'] ?? null,
            'body' => $payload['body'] ?? null,
            'status' => (string) ($payload['status'] ?? 'logged'),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $id = DB::table('message_deliveries')->insertGetId($data);
        return response()->json(array_merge(['id' => $id], $data), 201);
    }

    private function createSavedReport(array $payload)
    {
        if (!Schema::hasTable('saved_reports')) {
            return response()->json(['message' => 'Saved reports table does not exist yet.'], 503);
        }

        $data = [
            'name' => (string) ($payload['name'] ?? 'Untitled report'),
            'report_type' => (string) ($payload['reportType'] ?? $payload['report_type'] ?? 'admin'),
            'summary' => $payload['summary'] ?? null,
            'filters' => json_encode($payload['filters'] ?? []),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $id = DB::table('saved_reports')->insertGetId($data);
        return response()->json(array_merge(['id' => $id], $data), 201);
    }

    private function usersByRoles(array $roles, int $limit = 100): array
    {
        if (!Schema::hasTable('users')) return [];
        $query = DB::table('users')->whereIn('role', $roles);
        if (Schema::hasColumn('users', 'updated_at')) {
            $query->orderByDesc('updated_at');
        }
        return $query->limit($limit)->get()->map(fn ($row) => (array) $row)->all();
    }

    private function latestRows(string $table, int $limit = 20): array
    {
        if (!Schema::hasTable($table)) return [];
        $query = DB::table($table);
        if (Schema::hasColumn($table, 'created_at')) {
            $query->orderByDesc('created_at');
        } elseif (Schema::hasColumn($table, 'updated_at')) {
            $query->orderByDesc('updated_at');
        }
        return $query->limit($limit)->get()->map(fn ($row) => (array) $row)->all();
    }

    private function countTable(string $table): int
    {
        return Schema::hasTable($table) ? DB::table($table)->count() : 0;
    }

    private function countWhereIn(string $table, string $column, array $values): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) return 0;
        return DB::table($table)->whereIn($column, $values)->count();
    }

    private function countWhereNull(string $table, string $column): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) return 0;
        return DB::table($table)->whereNull($column)->count();
    }

    private function metric(string $label, int|float|string $value): array
    {
        return ['label' => $label, 'value' => $value];
    }
}
