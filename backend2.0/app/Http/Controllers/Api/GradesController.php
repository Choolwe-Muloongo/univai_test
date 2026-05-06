<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseAttempt;
use App\Models\ProgramModule;
use App\Models\User;
use App\Services\AcademicPolicyEngine;
use App\Services\AssessmentEngine;
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
        $assessmentEngine = new AssessmentEngine();
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
                'moderationStatus' => $attempt->moderation_status,
                'releasedAt' => $attempt->released_at?->toISOString(),
                'assessmentBreakdown' => $attempt->assessment_breakdown ?? [],
                'certificateEligible' => (bool) $attempt->certificate_eligible,
                'progressionEligible' => (bool) $attempt->progression_eligible,
                'graduationEligible' => (bool) $attempt->graduation_eligible,
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
            'graduationEligibility' => $assessmentEngine->graduationEligibility($student),
        ]);
    }

    public function recordGrade(Request $request)
    {
        $payload = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'module_id' => ['required', 'string', 'exists:program_modules,id'],
            'final_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'exam_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'result_status' => ['nullable', 'string'],
        ]);

        $student = User::find($payload['student_id']);
        $module = ProgramModule::find($payload['module_id']);

        if (!$student || !$module) {
            return response()->json(['message' => 'Invalid student or module'], 422);
        }

        $engine = new AcademicPolicyEngine();
        $assessmentEngine = new AssessmentEngine();
        $assessmentSummary = $assessmentEngine->calculateModuleAssessment($student, $module);

        if (!isset($payload['final_percentage']) && !$assessmentSummary) {
            return response()->json(['message' => 'Final percentage is required when no assessment blueprint exists.'], 422);
        }

        $finalPercentage = isset($payload['final_percentage'])
            ? (float) $payload['final_percentage']
            : (float) $assessmentSummary['finalPercentage'];
        if (($payload['result_status'] ?? null) === 'published' && $assessmentSummary && $assessmentSummary['resultStatus'] === 'held') {
            return response()->json(['message' => 'Results cannot be published until required moderation and release rules are satisfied.'], 422);
        }

        $policy = $engine->resolvePolicyForStudent($student);

        $existingDraftAttempt = CourseAttempt::query()
            ->where('student_id', $student->id)
            ->where('module_id', $module->id)
            ->where('result_status', 'draft')
            ->orderByDesc('attempt_no')
            ->first();

        $attemptNo = $existingDraftAttempt
            ? (int) $existingDraftAttempt->attempt_no
            : (int) CourseAttempt::query()
                ->where('student_id', $student->id)
                ->where('module_id', $module->id)
                ->max('attempt_no') + 1;

        if (!$existingDraftAttempt && $attemptNo > $policy->max_attempts) {
            return response()->json([
                'message' => 'Maximum attempts reached for this module.',
            ], 422);
        }

        $credits = (int) ($module->credits ?? 3);
        $evaluation = $engine->evaluateAttempt(
            $finalPercentage,
            $credits,
            $policy,
            isset($payload['exam_score']) ? (float) $payload['exam_score'] : null
        );

        $attemptPayload = [
            'student_id' => $student->id,
            'module_id' => $module->id,
            'intake_id' => $student->intake_id,
            'attempt_no' => $attemptNo,
            'final_percentage' => $finalPercentage,
            'exam_score' => $payload['exam_score'] ?? null,
            'letter_grade' => $evaluation['letter'],
            'grade_points' => $evaluation['points'],
            'credits_attempted' => $credits,
            'credits_earned' => $evaluation['credits_earned'],
            'status' => $evaluation['status'],
            'result_status' => $payload['result_status'] ?? 'draft',
            'assessment_breakdown' => $assessmentSummary['components'] ?? [],
            'moderation_status' => $assessmentSummary['moderationStatus'] ?? 'pending',
            'released_at' => ($assessmentSummary && $assessmentSummary['resultStatus'] === 'publishable') ? now() : null,
            'certificate_eligible' => $assessmentSummary['certificateEligible'] ?? false,
            'progression_eligible' => $assessmentSummary['progressionEligible'] ?? false,
            'graduation_eligible' => false,
            'recorded_by' => $request->session()->get('user')['id'] ?? null,
        ];

        $attempt = $existingDraftAttempt
            ? tap($existingDraftAttempt)->update($attemptPayload)
            : CourseAttempt::create($attemptPayload);

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
