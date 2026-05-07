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
use App\Support\StudentAccess;
use Illuminate\Http\Request;

class StudentsController extends Controller
{
    public function checkout(Request $request)
    {
        $payload = $request->validate([
            'role' => ['nullable', 'string'],
            'accessTier' => ['nullable', 'string'],
        ]);

        $requestedTier = $payload['accessTier'] ?? StudentAccess::tierFromRole($payload['role'] ?? StudentAccess::ROLE_PREMIUM);
        $requestedRole = StudentAccess::roleFromTier($requestedTier);
        $user = $request->session()->get('user');
        if (!$user) {
            $user = [
                'id' => $requestedTier === StudentAccess::TIER_FREE ? 'student-free' : 'student-premium',
                'name' => $requestedTier === StudentAccess::TIER_FREE ? 'Free Student' : 'Premium Student',
                'email' => $requestedTier === StudentAccess::TIER_FREE ? 'student.free@univai.edu' : 'student.premium@univai.edu',
                'role' => $requestedRole,
                'schoolId' => $requestedTier === StudentAccess::TIER_PROGRAMME ? 'ict' : null,
                'programId' => $requestedTier === StudentAccess::TIER_PROGRAMME ? 'cs101' : null,
            ];
        } else {
            $user['role'] = $requestedRole;
            if ($requestedTier === StudentAccess::TIER_PROGRAMME) {
                $user['schoolId'] = $user['schoolId'] ?? 'ict';
                $user['programId'] = $user['programId'] ?? 'cs101';
            }
        }

        $user = StudentAccess::sessionPayload($user);

        if (is_array($user) && isset($user['id']) && is_numeric($user['id'])) {
            $dbUser = User::find($user['id']);
            if ($dbUser) {
                $dbUser->update([
                    'role' => $requestedRole,
                    'school_id' => $user['schoolId'] ?? $dbUser->school_id,
                    'program_id' => $user['programId'] ?? $dbUser->program_id,
                ]);
                StudentAccess::syncUserEntitlements($dbUser, $requestedTier, 'checkout');
            }
        }

        $request->session()->put('user', $user);

        return response()->json(['user' => $user]);
    }

    public function entitlements(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        if (!is_array($sessionUser)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $sessionUser = StudentAccess::sessionPayload($sessionUser);
        $request->session()->put('user', $sessionUser);

        if (isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $dbUser = User::find((int) $sessionUser['id']);
            if ($dbUser) {
                $active = StudentAccess::activeEntitlementsForUser($dbUser);

                if (empty($active)) {
                    $active = StudentAccess::syncUserEntitlements($dbUser, $sessionUser['accessTier'], 'session-bootstrap');
                }

                $sessionUser['entitlements'] = $active;
                $request->session()->put('user', $sessionUser);
            }
        }

        return response()->json([
            'accessTier' => $sessionUser['accessTier'],
            'entitlements' => $sessionUser['entitlements'],
            'cashbackEligible' => $sessionUser['cashbackEligible'],
        ]);
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
            'deliveryMode' => DeliveryModes::normalize($enrollment->delivery_mode),
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
            'deliveryMode' => ['required', 'string'],
        ]);

        if (!$intakeId) {
            return response()->json(['message' => 'No intake assigned'], 422);
        }

        $intake = Intake::find($intakeId);
        if (!$intake) {
            return response()->json(['message' => 'Intake not found'], 404);
        }

        $selectedMode = DeliveryModes::normalize($payload['deliveryMode']);
        if (!DeliveryModes::supports($intake->program?->supported_delivery_modes, $selectedMode)) {
            return response()->json(['message' => 'Your program does not support the selected delivery mode.'], 422);
        }

        $modules = ProgramModule::query()
            ->whereIn('id', $payload['modules'])
            ->get();

        $unsupported = $modules->first(fn (ProgramModule $module) => !DeliveryModes::supports($module->supported_delivery_modes, $selectedMode));
        if ($unsupported) {
            return response()->json(['message' => "{$unsupported->title} is not available for the selected delivery mode."], 422);
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
            'delivery_mode' => $selectedMode,
        ]);

        return response()->json([
            'status' => $enrollment->status,
            'intakeId' => $enrollment->intake_id,
            'selectedModules' => $enrollment->selected_modules ?? [],
            'deliveryMode' => DeliveryModes::normalize($enrollment->delivery_mode),
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
            $sessionUser['role'] = StudentAccess::ROLE_PROGRAMME;
            $sessionUser['accessTier'] = StudentAccess::TIER_PROGRAMME;
            $sessionUser['entitlements'] = StudentAccess::entitlementsForTier(StudentAccess::TIER_PROGRAMME);
            $sessionUser['cashbackEligible'] = true;
            $request->session()->put('user', $sessionUser);
        }

        if (is_numeric($userId)) {
            $user = User::find($userId);
            if ($user) {
                $user->update([
                    'role' => StudentAccess::ROLE_PROGRAMME,
                ]);
                StudentAccess::syncUserEntitlements($user, StudentAccess::TIER_PROGRAMME, 'enrollment-confirmation');
            }
        }

        return response()->json([
            'status' => $enrollment->status,
            'intakeId' => $enrollment->intake_id,
            'selectedModules' => $enrollment->selected_modules ?? [],
            'deliveryMode' => DeliveryModes::normalize($enrollment->delivery_mode),
            'enrolledAt' => optional($enrollment->enrolled_at)->toISOString(),
            'confirmedAt' => optional($enrollment->confirmed_at)->toISOString(),
        ]);
    }

    public function courseMeeting(Request $request, string $courseId)
    {
        $user = $request->session()->get('user');
        $intakeId = is_array($user) ? ($user['intakeId'] ?? null) : null;
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

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

        $mode = Enrollment::query()
            ->where('user_id', $studentId ?? null)
            ->where('intake_id', $intakeId)
            ->value('delivery_mode') ?? $assignment->intake?->delivery_mode;
        $normalizedMode = DeliveryModes::normalize($mode);
        if ($normalizedMode === DeliveryModes::SOFTWARE_ONLY && empty($assignment->meeting_url)) {
            return response()->json(['message' => 'This meeting is not available for software-only learners.'], 403);
        }
        if ($normalizedMode === DeliveryModes::PHYSICAL && empty($assignment->intake?->campus) && empty($assignment->meeting_notes)) {
            return response()->json(['message' => 'Physical learning venue is not available yet.'], 404);
        }

        return [
            'courseId' => $assignment->course_id,
            'intakeId' => $assignment->intake_id,
            'lecturerName' => $assignment->lecturer?->name,
            'meetingProvider' => $assignment->meeting_provider,
            'meetingUrl' => $assignment->meeting_url,
            'meetingSchedule' => $assignment->meeting_schedule,
            'meetingNotes' => $assignment->meeting_notes,
            'deliveryMode' => $normalizedMode,
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
