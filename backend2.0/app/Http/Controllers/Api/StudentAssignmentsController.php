<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;

class StudentAssignmentsController extends Controller
{
    public function index(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $programId = is_array($sessionUser) ? ($sessionUser['program_id'] ?? null) : null;

        $query = Assignment::query()
            ->with(['module', 'component.blueprint'])
            ->where('status', 'published')
            ->when($programId, function ($builder) use ($programId) {
                $builder->whereHas('module', fn ($q) => $q->where('program_id', $programId));
            })
            ->orderByRaw('due_date is null, due_date asc');

        $assignments = $query->get();

        $submissions = collect();
        if ($studentId) {
            $submissions = AssignmentSubmission::query()
                ->where('student_id', $studentId)
                ->get()
                ->keyBy('assignment_id');
        }

        return $assignments->map(function (Assignment $assignment) use ($submissions) {
            $submission = $submissions->get($assignment->id);
            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'instructions' => $assignment->instructions,
                'moduleId' => $assignment->module_id,
                'moduleTitle' => $assignment->module?->title,
                'courseId' => $assignment->course_id,
                'assignmentType' => $assignment->assignment_type,
                'assessmentComponentId' => $assignment->assessment_component_id,
                'assessmentBlueprintId' => $assignment->component?->assessment_blueprint_id,
                'weight' => $assignment->weight ?? $assignment->component?->weight,
                'passMark' => $assignment->pass_mark ?? $assignment->component?->pass_mark,
                'maxAttempts' => $assignment->max_attempts ?? $assignment->component?->max_attempts,
                'rubric' => $assignment->rubric ?? $assignment->component?->rubric ?? [],
                'maxPoints' => $assignment->max_points,
                'dueDate' => $assignment->due_date?->toISOString(),
                'status' => $assignment->status,
                'submissionStatus' => $submission?->status ?? 'not_submitted',
                'grade' => $submission?->grade,
                'percentage' => $submission?->percentage,
                'attempt' => $submission?->attempt_no,
                'submittedAt' => $submission?->submitted_at?->toISOString(),
            ];
        });
    }

    public function show(Request $request, Assignment $assignment)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $assignment->load(['module', 'component.blueprint']);

        if ($assignment->status !== 'published') {
            return response()->json(['message' => 'Assignment not available yet.'], 404);
        }

        $submission = null;
        if ($studentId) {
            $submission = AssignmentSubmission::query()
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $studentId)
                ->orderByDesc('attempt_no')
                ->first();
        }

        return response()->json([
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'instructions' => $assignment->instructions,
            'moduleId' => $assignment->module_id,
            'moduleTitle' => $assignment->module?->title,
            'courseId' => $assignment->course_id,
            'assignmentType' => $assignment->assignment_type,
            'assessmentComponentId' => $assignment->assessment_component_id,
            'assessmentBlueprintId' => $assignment->component?->assessment_blueprint_id,
            'weight' => $assignment->weight ?? $assignment->component?->weight,
            'passMark' => $assignment->pass_mark ?? $assignment->component?->pass_mark,
            'maxAttempts' => $assignment->max_attempts ?? $assignment->component?->max_attempts,
            'rubric' => $assignment->rubric ?? $assignment->component?->rubric ?? [],
            'maxPoints' => $assignment->max_points,
            'dueDate' => $assignment->due_date?->toISOString(),
            'status' => $assignment->status,
            'submission' => $submission ? [
                'id' => $submission->id,
                'status' => $submission->status,
                'grade' => $submission->grade,
                'percentage' => $submission->percentage,
                'attempt' => $submission->attempt_no,
                'percentage' => $submission->percentage,
                'attempt' => $submission->attempt_no,
                'rubricScores' => $submission->rubric_scores ?? [],
                'releasedAt' => $submission->released_at?->toISOString(),
                'feedback' => $submission->feedback,
                'content' => $submission->content,
                'attachmentUrl' => $submission->attachment_url,
                'submittedAt' => $submission->submitted_at?->toISOString(),
            'attempt' => $submission->attempt_no,
            ] : null,
        ]);
    }

    public function submit(Request $request, Assignment $assignment)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        if (!$studentId) {
            return response()->json(['error' => 'Student not found.'], 401);
        }

        $payload = $request->validate([
            'content' => ['nullable', 'string'],
            'attachmentUrl' => ['nullable', 'string'],
            'rubricScores' => ['nullable', 'array'],
        ]);

        $assignment->load('component.blueprint');
        $maxAttempts = (int) ($assignment->max_attempts ?? $assignment->component?->max_attempts ?? $assignment->component?->blueprint?->max_attempts ?? 1);
        $latestAttempt = (int) AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->where('student_id', $studentId)
            ->max('attempt_no');

        if ($latestAttempt >= $maxAttempts) {
            return response()->json(['message' => 'Maximum attempts reached for this assignment.'], 422);
        }

        $submission = AssignmentSubmission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $studentId,
            'attempt_no' => $latestAttempt + 1,
            'content' => $payload['content'] ?? null,
            'attachment_url' => $payload['attachmentUrl'] ?? null,
            'rubric_scores' => $payload['rubricScores'] ?? [],
            'submitted_at' => now(),
            'status' => 'submitted',
            'moderation_status' => $assignment->moderation_status === 'not_required' ? 'not_required' : 'pending',
            'released_at' => $assignment->results_release_at && now()->greaterThanOrEqualTo($assignment->results_release_at) ? now() : null,
        ]);

        return response()->json([
            'id' => $submission->id,
            'status' => $submission->status,
            'submittedAt' => $submission->submitted_at?->toISOString(),
            'attempt' => $submission->attempt_no,
        ]);
    }

    public function submissions(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        if (!$studentId) {
            return response()->json([]);
        }

        $submissions = AssignmentSubmission::query()
            ->with(['assignment.module', 'assignment.component'])
            ->where('student_id', $studentId)
            ->orderByDesc('submitted_at')
            ->get();

        return $submissions->map(function (AssignmentSubmission $submission) {
            $assignment = $submission->assignment;
            return [
                'id' => $submission->id,
                'assignmentId' => $submission->assignment_id,
                'assignmentTitle' => $assignment?->title,
                'moduleTitle' => $assignment?->module?->title,
                'status' => $submission->status,
                'grade' => $submission->grade,
                'percentage' => $submission->percentage,
                'attempt' => $submission->attempt_no,
                'percentage' => $submission->percentage,
                'attempt' => $submission->attempt_no,
                'rubricScores' => $submission->rubric_scores ?? [],
                'releasedAt' => $submission->released_at?->toISOString(),
                'feedback' => $submission->feedback,
                'submittedAt' => $submission->submitted_at?->toISOString(),
            'attempt' => $submission->attempt_no,
            ];
        });
    }
}
