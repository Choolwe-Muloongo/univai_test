<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseAttempt;
use App\Models\CourseLecturerAssignment;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Intake;
use App\Models\ProgramModule;
use App\Models\User;
use App\Services\AcademicPolicyEngine;
use Illuminate\Http\Request;

class StudentsController extends Controller
{
    public function checkout(Request $request)
    {
        $user = $request->session()->get('user');
        if (!$user) {
            $user = [
                'id' => 'student-premium',
                'name' => 'Premium Student',
                'email' => 'student.premium@univai.edu',
                'role' => 'premium-student',
                'schoolId' => 'ict',
                'programId' => 'cs101',
            ];
        } else {
            $user['role'] = 'premium-student';
            $user['schoolId'] = $user['schoolId'] ?? 'ict';
            $user['programId'] = $user['programId'] ?? 'cs101';
        }

        if (is_array($user) && isset($user['id']) && is_numeric($user['id'])) {
            $dbUser = User::find($user['id']);
            if ($dbUser) {
                $dbUser->update([
                    'role' => 'premium-student',
                    'school_id' => $user['schoolId'] ?? $dbUser->school_id,
                    'program_id' => $user['programId'] ?? $dbUser->program_id,
                ]);
            }
        }

        $request->session()->put('user', $user);

        return response()->json(['user' => $user]);
    }

    public function enrollment(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        if (!$userId || !is_numeric($userId)) {
            return response()->json(null, 404);
        }

        $enrollment = Enrollment::query()->where('user_id', $userId)->first();
        if (!$enrollment) {
            return response()->json(null, 404);
        }

        return response()->json([
            'status' => $enrollment->status,
            'intakeId' => $enrollment->intake_id,
            'selectedModules' => $enrollment->selected_modules ?? [],
            'enrolledAt' => optional($enrollment->enrolled_at)->toISOString(),
            'confirmedAt' => optional($enrollment->confirmed_at)->toISOString(),
        ]);
    }

    public function saveEnrollmentModules(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $intakeId = is_array($sessionUser) ? ($sessionUser['intakeId'] ?? null) : null;

        if (!$userId || !is_numeric($userId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'modules' => ['required', 'array', 'min:1'],
            'modules.*' => ['string'],
        ]);

        if (!$intakeId) {
            return response()->json(['message' => 'No intake assigned'], 422);
        }

        $enrollment = Enrollment::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'intake_id' => $intakeId,
            ],
            [
                'status' => 'pending',
                'enrolled_at' => null,
            ]
        );

        $enrollment->update([
            'selected_modules' => $payload['modules'],
        ]);

        return response()->json([
            'status' => $enrollment->status,
            'intakeId' => $enrollment->intake_id,
            'selectedModules' => $enrollment->selected_modules ?? [],
            'confirmedAt' => optional($enrollment->confirmed_at)->toISOString(),
        ]);
    }

    public function confirmEnrollment(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        if (!$userId || !is_numeric($userId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $enrollment = Enrollment::query()->where('user_id', $userId)->first();
        if (!$enrollment) {
            return response()->json(['message' => 'Enrollment not found'], 404);
        }

        $hasPaidInvoice = Invoice::query()
            ->where('student_id', $userId)
            ->where('status', 'paid')
            ->exists();

        if (!$hasPaidInvoice) {
            return response()->json(['message' => 'Please complete tuition payment before confirming enrollment.'], 422);
        }

        $enrollment->update([
            'status' => 'active',
            'enrolled_at' => $enrollment->enrolled_at ?? now(),
            'confirmed_at' => now(),
        ]);

        if (is_array($sessionUser)) {
            $sessionUser['role'] = 'premium-student';
            $request->session()->put('user', $sessionUser);
        }

        if (is_numeric($userId)) {
            $user = User::find($userId);
            if ($user) {
                $user->update([
                    'role' => 'premium-student',
                ]);
            }
        }

        return response()->json([
            'status' => $enrollment->status,
            'intakeId' => $enrollment->intake_id,
            'selectedModules' => $enrollment->selected_modules ?? [],
            'enrolledAt' => optional($enrollment->enrolled_at)->toISOString(),
            'confirmedAt' => optional($enrollment->confirmed_at)->toISOString(),
        ]);
    }

    public function courseMeeting(Request $request, string $courseId)
    {
        $user = $request->session()->get('user');
        $intakeId = is_array($user) ? ($user['intakeId'] ?? null) : null;

        if (!$intakeId) {
            return response()->json(null, 404);
        }

        $assignment = CourseLecturerAssignment::with(['lecturer', 'intake'])
            ->where('course_id', $courseId)
            ->where('intake_id', $intakeId)
            ->first();

        if (!$assignment) {
            return response()->json(null, 404);
        }

        return [
            'courseId' => $assignment->course_id,
            'intakeId' => $assignment->intake_id,
            'lecturerName' => $assignment->lecturer?->name,
            'meetingProvider' => $assignment->meeting_provider,
            'meetingUrl' => $assignment->meeting_url,
            'meetingSchedule' => $assignment->meeting_schedule,
            'meetingNotes' => $assignment->meeting_notes,
        ];
    }

    public function lecturerStudents(Request $request)
    {
        $intakeId = $request->query('intakeId');
        if (!$intakeId) {
            return response()->json([]);
        }

        $intake = Intake::find($intakeId);
        if (!$intake) {
            return response()->json([]);
        }

        $students = User::query()
            ->select('users.*')
            ->join('enrollments', 'enrollments.user_id', '=', 'users.id')
            ->where('enrollments.intake_id', $intakeId)
            ->get();

        $moduleQuery = ProgramModule::query()
            ->where('program_id', $intake->program_id);
        if ($intake->curriculum_version_id) {
            $moduleQuery->where('curriculum_version_id', $intake->curriculum_version_id);
        }
        $totalCredits = (int) $moduleQuery->sum('credits');

        $engine = new AcademicPolicyEngine();

        $payload = $students->map(function (User $student) use ($intakeId, $totalCredits, $engine) {
            $attempts = CourseAttempt::query()
                ->where('student_id', $student->id)
                ->get();
            $policy = $engine->resolvePolicyForStudent($student);
            $gpaSummary = $engine->calculateGpa($attempts->all(), $policy);
            $progress = $totalCredits > 0 ? round(($gpaSummary['credits_earned'] / $totalCredits) * 100) : 0;

            $enrollment = Enrollment::query()
                ->where('user_id', $student->id)
                ->where('intake_id', $intakeId)
                ->first();

            return [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'programId' => $student->program_id,
                'intakeId' => $intakeId,
                'avatar' => $student->avatar,
                'progress' => $progress,
                'gpa' => $gpaSummary['gpa'],
                'standing' => $enrollment?->standing ?? 'good',
            ];
        });

        return response()->json($payload);
    }
}
