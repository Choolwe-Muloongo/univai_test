<?php

namespace App\Services;

use App\Models\AcademicPolicy;
use App\Models\CourseAttempt;
use App\Models\CurriculumVersionPolicy;
use App\Models\Enrollment;
use App\Models\Intake;
use App\Models\ProgramModule;
use App\Models\ProgramPolicy;
use App\Models\User;

class AcademicPolicyEngine
{
    public function resolvePolicyForStudent(User $student): AcademicPolicy
    {
        $policy = null;
        $intakeId = $student->intake_id;
        $programId = $student->program_id;

        if ($intakeId) {
            $curriculumVersionId = Intake::query()
                ->where('id', $intakeId)
                ->value('curriculum_version_id');

            if ($curriculumVersionId) {
                $policyId = CurriculumVersionPolicy::query()
                    ->where('curriculum_version_id', $curriculumVersionId)
                    ->value('policy_id');
                if ($policyId) {
                    $policy = AcademicPolicy::find($policyId);
                }
            }
        }

        if (!$policy && $programId) {
            $policyId = ProgramPolicy::query()
                ->where('program_id', $programId)
                ->value('policy_id');
            if ($policyId) {
                $policy = AcademicPolicy::find($policyId);
            }
        }

        if (!$policy) {
            $policy = AcademicPolicy::query()->orderBy('id')->first();
        }

        return $policy ?? new AcademicPolicy([
            'name' => 'Default Policy',
            'pass_mark' => 50,
            'grade_bands' => [
                ['min' => 70, 'max' => 100, 'letter' => 'A', 'points' => 4.0],
                ['min' => 60, 'max' => 69, 'letter' => 'B', 'points' => 3.0],
                ['min' => 50, 'max' => 59, 'letter' => 'C', 'points' => 2.0],
                ['min' => 40, 'max' => 49, 'letter' => 'D', 'points' => 1.0],
                ['min' => 0, 'max' => 39, 'letter' => 'F', 'points' => 0.0],
            ],
            'repeat_rule' => 'best',
            'max_attempts' => 3,
            'include_failed_in_gpa' => true,
            'rounding_decimals' => 2,
        ]);
    }

    public function evaluateAttempt(float $percentage, int $credits, AcademicPolicy $policy, ?float $examScore = null): array
    {
        $passMark = (int) $policy->pass_mark;
        $examMinimum = $policy->exam_minimum;
        $pass = $percentage >= $passMark;
        if ($examMinimum !== null && $examScore !== null) {
            $pass = $pass && $examScore >= $examMinimum;
        }

        $gradeBand = $this->resolveGradeBand($percentage, $policy);
        $letter = $gradeBand['letter'] ?? 'N/A';
        $points = (float) ($gradeBand['points'] ?? 0);

        $creditsEarned = 0;
        $status = $pass ? 'pass' : 'fail';

        if ($pass) {
            $creditsEarned = $credits;
        } elseif ($policy->credit_award_policy === 'condoned' && $policy->condoned_mark !== null) {
            if ($percentage >= $policy->condoned_mark) {
                $creditsEarned = $credits;
                $status = 'condoned';
            }
        }

        return [
            'status' => $status,
            'letter' => $letter,
            'points' => $points,
            'credits_earned' => $creditsEarned,
        ];
    }

    public function calculateGpa(array $attempts, AcademicPolicy $policy): array
    {
        $repeatRule = $policy->repeat_rule ?? 'best';
        $grouped = [];

        foreach ($attempts as $attempt) {
            $grouped[$attempt->module_id][] = $attempt;
        }

        $selected = [];
        foreach ($grouped as $moduleId => $records) {
            if ($repeatRule === 'all') {
                foreach ($records as $record) {
                    $selected[] = $record;
                }
                continue;
            }

            if ($repeatRule === 'latest') {
                $selected[] = collect($records)->sortByDesc('attempt_no')->first();
                continue;
            }

            if ($repeatRule === 'average') {
                $credits = (int) ($records[0]->credits_attempted ?? 0);
                $avgPoints = collect($records)->avg('grade_points') ?? 0;
                $clone = clone $records[0];
                $clone->grade_points = $avgPoints;
                $clone->credits_attempted = $credits;
                $selected[] = $clone;
                continue;
            }

            $selected[] = collect($records)->sortByDesc('grade_points')->first();
        }

        $totalCredits = 0;
        $qualityPoints = 0;
        $creditsEarned = 0;

        foreach ($selected as $record) {
            if (!$record) {
                continue;
            }
            if ($record->status === 'withdrawn' && !$policy->include_withdrawn_in_gpa) {
                continue;
            }
            if ($record->status === 'fail' && !$policy->include_failed_in_gpa) {
                continue;
            }

            $credits = (int) ($record->credits_attempted ?? 0);
            $totalCredits += $credits;
            $qualityPoints += ((float) ($record->grade_points ?? 0)) * $credits;
            $creditsEarned += (int) ($record->credits_earned ?? 0);
        }

        $gpa = $totalCredits > 0 ? $qualityPoints / $totalCredits : 0;
        $decimals = (int) ($policy->rounding_decimals ?? 2);

        return [
            'gpa' => round($gpa, $decimals),
            'credits_attempted' => $totalCredits,
            'credits_earned' => $creditsEarned,
        ];
    }

    public function updateStanding(User $student, AcademicPolicy $policy, array $gpaSummary): array
    {
        $progression = $policy->progression_policy ?? [];
        $minPass = (float) ($progression['min_pass_percent'] ?? 0.6);
        $probationLimit = (int) ($progression['probation_limit'] ?? 2);

        $creditsAttempted = (int) $gpaSummary['credits_attempted'];
        $creditsEarned = (int) $gpaSummary['credits_earned'];
        $ratio = $creditsAttempted > 0 ? $creditsEarned / $creditsAttempted : 1;

        $enrollment = Enrollment::query()
            ->where('user_id', $student->id)
            ->where('intake_id', $student->intake_id)
            ->first();

        $standing = 'good';
        $probationCount = $enrollment?->probation_count ?? 0;

        if ($ratio < $minPass) {
            $probationCount += 1;
            $standing = $probationCount >= $probationLimit ? 'suspended' : 'probation';
        } else {
            $probationCount = 0;
            $standing = 'good';
        }

        if ($enrollment) {
            $enrollment->standing = $standing;
            $enrollment->probation_count = $probationCount;
            $enrollment->last_reviewed_at = now();
            $enrollment->save();
        }

        return [
            'standing' => $standing,
            'probation_count' => $probationCount,
            'pass_ratio' => $ratio,
        ];
    }

    private function resolveGradeBand(float $percentage, AcademicPolicy $policy): array
    {
        $bands = $policy->grade_bands ?? [];
        foreach ($bands as $band) {
            $min = $band['min'] ?? 0;
            $max = $band['max'] ?? 100;
            if ($percentage >= $min && $percentage <= $max) {
                return $band;
            }
        }

        return ['letter' => 'F', 'points' => 0];
    }
}
