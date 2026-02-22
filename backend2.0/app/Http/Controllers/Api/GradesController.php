<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseAttempt;
use App\Models\ProgramModule;
use App\Models\User;
use App\Services\AcademicPolicyEngine;
use Illuminate\Http\Request;

class GradesController extends Controller
{
    public function studentGrades(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        if (!$sessionUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $student = User::find($sessionUser['id']);
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $attempts = CourseAttempt::query()
            ->with('module')
            ->where('student_id', $student->id)
            ->where('result_status', 'published')
            ->orderByDesc('created_at')
            ->get();

        $engine = new AcademicPolicyEngine();
        $policy = $engine->resolvePolicyForStudent($student);
        $gpaSummary = $engine->calculateGpa($attempts->all(), $policy);
        $standing = $engine->updateStanding($student, $policy, $gpaSummary);

        $grades = $attempts->map(function (CourseAttempt $attempt) {
            $module = $attempt->module;
            return [
                'moduleId' => $attempt->module_id,
                'moduleTitle' => $module?->title,
                'semester' => $module?->semester,
                'credits' => $attempt->credits_attempted,
                'finalPercentage' => $attempt->final_percentage,
                'letterGrade' => $attempt->letter_grade,
                'status' => $attempt->status,
                'resultStatus' => $attempt->result_status,
                'attempt' => $attempt->attempt_no,
                'recordedAt' => $attempt->created_at,
            ];
        });

        return response()->json([
            'policy' => [
                'id' => $policy->id,
                'name' => $policy->name,
                'passMark' => $policy->pass_mark,
                'repeatRule' => $policy->repeat_rule,
            ],
            'gpa' => $gpaSummary['gpa'],
            'creditsAttempted' => $gpaSummary['credits_attempted'],
            'creditsEarned' => $gpaSummary['credits_earned'],
            'standing' => $standing['standing'],
            'probationCount' => $standing['probation_count'],
            'grades' => $grades,
        ]);
    }

    public function recordGrade(Request $request)
    {
        $payload = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'module_id' => ['required', 'string', 'exists:program_modules,id'],
            'final_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'exam_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'result_status' => ['nullable', 'string'],
        ]);

        $student = User::find($payload['student_id']);
        $module = ProgramModule::find($payload['module_id']);

        if (!$student || !$module) {
            return response()->json(['message' => 'Invalid student or module'], 422);
        }

        $engine = new AcademicPolicyEngine();
        $policy = $engine->resolvePolicyForStudent($student);

        $attemptNo = CourseAttempt::query()
            ->where('student_id', $student->id)
            ->where('module_id', $module->id)
            ->max('attempt_no');
        $attemptNo = $attemptNo ? $attemptNo + 1 : 1;

        if ($attemptNo > $policy->max_attempts) {
            return response()->json([
                'message' => 'Maximum attempts reached for this module.',
            ], 422);
        }

        $credits = (int) ($module->credits ?? 3);
        $evaluation = $engine->evaluateAttempt(
            (float) $payload['final_percentage'],
            $credits,
            $policy,
            isset($payload['exam_score']) ? (float) $payload['exam_score'] : null
        );

        $attempt = CourseAttempt::create([
            'student_id' => $student->id,
            'module_id' => $module->id,
            'intake_id' => $student->intake_id,
            'attempt_no' => $attemptNo,
            'final_percentage' => $payload['final_percentage'],
            'exam_score' => $payload['exam_score'] ?? null,
            'letter_grade' => $evaluation['letter'],
            'grade_points' => $evaluation['points'],
            'credits_attempted' => $credits,
            'credits_earned' => $evaluation['credits_earned'],
            'status' => $evaluation['status'],
            'result_status' => $payload['result_status'] ?? 'draft',
            'recorded_by' => $request->session()->get('user')['id'] ?? null,
        ]);

        if ($attempt->result_status === 'published') {
            $publishedAttempts = CourseAttempt::query()
                ->where('student_id', $student->id)
                ->where('result_status', 'published')
                ->get();

            $gpaSummary = $engine->calculateGpa($publishedAttempts->all(), $policy);
            $engine->updateStanding($student, $policy, $gpaSummary);
        }

        return response()->json($attempt, 201);
    }
}
