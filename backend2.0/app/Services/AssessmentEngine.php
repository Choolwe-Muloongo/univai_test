<?php

namespace App\Services;

use App\Models\AssessmentBlueprint;
use App\Models\AssessmentBooking;
use App\Models\AssessmentComponent;
use App\Models\AssignmentSubmission;
use App\Models\CourseAttempt;
use App\Models\ExamResult;
use App\Models\ProgramModule;
use App\Models\User;
use Illuminate\Support\Collection;

class AssessmentEngine
{
    public function blueprintForModule(string $moduleId): ?AssessmentBlueprint
    {
        return AssessmentBlueprint::query()
            ->with(['components.questionBank', 'module'])
            ->where('module_id', $moduleId)
            ->whereIn('status', ['published', 'active'])
            ->first();
    }

    public function componentAttemptLimit(AssessmentComponent $component): int
    {
        return (int) ($component->max_attempts ?? $component->blueprint?->max_attempts ?? 1);
    }

    public function validateComponentAccess(AssessmentComponent $component, int $studentId): array
    {
        $booking = AssessmentBooking::query()
            ->where('assessment_component_id', $component->id)
            ->where('student_id', $studentId)
            ->first();

        if ($component->requires_exam_booking && !in_array($booking?->status, ['booked', 'confirmed', 'attended'], true)) {
            return ['allowed' => false, 'message' => 'An exam booking is required before this assessment can be attempted.'];
        }

        if ($component->requires_exam_clinic && !$booking?->clinic_completed_at) {
            return ['allowed' => false, 'message' => 'Complete the required exam clinic before this assessment can be attempted.'];
        }

        return ['allowed' => true, 'booking' => $booking];
    }

    public function calculateModuleAssessment(User $student, ProgramModule $module): ?array
    {
        $blueprint = $this->blueprintForModule($module->id);
        if (!$blueprint) {
            return null;
        }

        $components = $blueprint->components;
        $assignmentSubmissions = AssignmentSubmission::query()
            ->with('assignment')
            ->where('student_id', $student->id)
            ->whereHas('assignment', fn ($query) => $query->where('module_id', $module->id))
            ->get()
            ->groupBy(fn (AssignmentSubmission $submission) => $submission->assignment?->assessment_component_id);

        $examResults = ExamResult::query()
            ->where('user_id', (string) $student->id)
            ->where('module_id', $module->id)
            ->get()
            ->groupBy('assessment_component_id');

        $breakdown = [];
        $weightedTotal = 0.0;
        $totalWeight = 0.0;
        $missingRequired = [];
        $componentFailures = [];
        $heldComponents = [];

        foreach ($components as $component) {
            $score = null;
            $attemptNo = 0;
            $status = 'missing';
            $released = $component->results_release_at ? now()->greaterThanOrEqualTo($component->results_release_at) : true;

            if ($component->type === 'exam') {
                $latest = $examResults->get($component->id, collect())->sortByDesc('attempt_no')->first();
                if ($latest) {
                    $score = $latest->score;
                    $attemptNo = (int) $latest->attempt_no;
                    $status = $latest->status;
                    $released = $released && in_array($latest->moderation_status, ['approved', 'not_required'], true);
                }
            } else {
                $latest = $assignmentSubmissions->get($component->id, collect())->sortByDesc('attempt_no')->first();
                if ($latest) {
                    $score = $latest->percentage ?? $latest->grade;
                    $attemptNo = (int) $latest->attempt_no;
                    $status = $latest->status;
                    $released = $released && in_array($latest->moderation_status, ['approved', 'not_required'], true);
                }
            }

            if ($score === null) {
                $missingRequired[] = $component->id;
            } else {
                $weight = (float) $component->weight;
                $weightedTotal += ((float) $score) * ($weight / 100);
                $totalWeight += $weight;

                $componentPass = $component->pass_mark === null || (float) $score >= (float) $component->pass_mark;
                if (!$componentPass) {
                    $componentFailures[] = $component->id;
                }
            }

            if (!$released) {
                $heldComponents[] = $component->id;
            }

            $breakdown[] = [
                'componentId' => $component->id,
                'type' => $component->type,
                'title' => $component->title,
                'weight' => (float) $component->weight,
                'score' => $score !== null ? (float) $score : null,
                'attempt' => $attemptNo,
                'status' => $status,
                'released' => $released,
                'requiresExamBooking' => (bool) $component->requires_exam_booking,
                'requiresExamClinic' => (bool) $component->requires_exam_clinic,
                'rubric' => $component->rubric ?? [],
            ];
        }

        $final = $totalWeight > 0 ? round($weightedTotal, 2) : null;
        $passRules = $blueprint->pass_rules ?? [];
        $requiresAllComponents = (bool) ($passRules['require_all_components'] ?? true);
        $mustPassComponents = (bool) ($passRules['must_pass_each_component'] ?? false);
        $passed = $final !== null && $final >= (float) $blueprint->pass_mark;
        if ($requiresAllComponents && count($missingRequired) > 0) {
            $passed = false;
        }
        if ($mustPassComponents && count($componentFailures) > 0) {
            $passed = false;
        }

        return [
            'blueprintId' => $blueprint->id,
            'moduleId' => $module->id,
            'finalPercentage' => $final,
            'passed' => $passed,
            'resultStatus' => count($heldComponents) > 0 ? 'held' : 'publishable',
            'moderationStatus' => count($heldComponents) > 0 ? 'pending' : 'approved',
            'missingRequiredComponents' => $missingRequired,
            'failedComponents' => $componentFailures,
            'components' => $breakdown,
            'certificateEligible' => $passed && (bool) (($blueprint->certificate_rules ?? [])['issue_on_pass'] ?? true),
            'progressionEligible' => $passed && count($missingRequired) === 0,
        ];
    }

    public function graduationEligibility(User $student): array
    {
        $moduleQuery = ProgramModule::query()->where('program_id', $student->program_id);
        $modules = $moduleQuery->get();
        $totalCredits = (int) $modules->sum('credits');
        $publishedAttempts = CourseAttempt::query()
            ->with('module')
            ->where('student_id', $student->id)
            ->where('result_status', 'published')
            ->get();
        $earnedCredits = (int) $publishedAttempts->whereIn('status', ['pass', 'condoned'])->sum('credits_earned');
        $failedCore = $publishedAttempts->filter(fn (CourseAttempt $attempt) => $attempt->module?->is_core && !in_array($attempt->status, ['pass', 'condoned'], true))->count();

        return [
            'eligible' => $totalCredits > 0 && $earnedCredits >= $totalCredits && $failedCore === 0,
            'totalCredits' => $totalCredits,
            'earnedCredits' => $earnedCredits,
            'remainingCredits' => max(0, $totalCredits - $earnedCredits),
            'failedCoreModules' => $failedCore,
        ];
    }
}
