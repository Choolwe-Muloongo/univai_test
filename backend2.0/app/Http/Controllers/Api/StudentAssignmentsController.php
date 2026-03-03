<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentAssignmentsController extends Controller
{
    public function index(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $programId = is_array($sessionUser) ? ($sessionUser['program_id'] ?? null) : null;

        $query = Assignment::query()
            ->with(['module'])
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
                'maxPoints' => $assignment->max_points,
                'dueDate' => $assignment->due_date?->toISOString(),
                'status' => $assignment->status,
                'submissionStatus' => $submission?->status ?? 'not_submitted',
                'grade' => $submission?->grade,
                'submittedAt' => $submission?->submitted_at?->toISOString(),
            ];
        });
    }

    public function show(Request $request, Assignment $assignment)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $assignment->load('module');

        if ($assignment->status !== 'published') {
            return response()->json(['message' => 'Assignment not available yet.'], 404);
        }

        $submission = null;
        if ($studentId) {
            $submission = AssignmentSubmission::query()
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $studentId)
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
            'maxPoints' => $assignment->max_points,
            'dueDate' => $assignment->due_date?->toISOString(),
            'status' => $assignment->status,
            'submission' => $submission ? [
                'id' => $submission->id,
                'status' => $submission->status,
                'grade' => $submission->grade,
                'feedback' => $submission->feedback,
                'content' => $submission->content,
                'attachmentUrl' => $submission->attachment_url,
                'submittedAt' => $submission->submitted_at?->toISOString(),
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
        ]);

        $submission = AssignmentSubmission::query()->updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'student_id' => $studentId,
            ],
            [
                'content' => $payload['content'] ?? null,
                'attachment_url' => $payload['attachmentUrl'] ?? null,
                'submitted_at' => now(),
                'status' => 'submitted',
            ]
        );

        return response()->json([
            'id' => $submission->id,
            'status' => $submission->status,
            'submittedAt' => $submission->submitted_at?->toISOString(),
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
            ->with(['assignment.module'])
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
                'feedback' => $submission->feedback,
                'submittedAt' => $submission->submitted_at?->toISOString(),
            ];
        });
    }
}
