<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseLecturerAssignment;
use App\Models\ExamQuestion;
use Illuminate\Http\Request;

class LecturerExamQuestionsController extends Controller
{
    public function index(Request $request)
    {
        $lecturerId = $this->resolveLecturerId($request);
        if (!$lecturerId) {
            return [];
        }

        $courseIds = CourseLecturerAssignment::query()
            ->where('lecturer_id', $lecturerId)
            ->pluck('course_id')
            ->unique()
            ->values();

        if ($courseIds->isEmpty()) {
            return [];
        }

        $query = ExamQuestion::query()->whereIn('course_id', $courseIds);
        if ($request->filled('courseId')) {
            $courseId = $request->query('courseId');
            if (!$courseIds->contains($courseId)) {
                return [];
            }
            $query->where('course_id', $courseId);
        }
        if ($request->filled('semester')) {
            $query->where('semester', (int) $request->query('semester'));
        }

        return $query->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => $this->mapQuestion($question));
    }

    public function store(Request $request)
    {
        $lecturerId = $this->resolveLecturerId($request);
        if (!$lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'courseId' => ['required', 'string'],
            'semester' => ['nullable', 'integer', 'min:1'],
            'question' => ['required', 'string'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'answer' => ['nullable', 'string'],
        ]);

        if (!$this->isCourseAssigned($lecturerId, $payload['courseId'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $question = ExamQuestion::create([
            'course_id' => $payload['courseId'],
            'semester' => $payload['semester'] ?? null,
            'question' => $payload['question'],
            'options' => $payload['options'],
            'answer' => $payload['answer'] ?? null,
        ]);

        return response()->json($this->mapQuestion($question), 201);
    }

    public function update(Request $request, ExamQuestion $examQuestion)
    {
        $lecturerId = $this->resolveLecturerId($request);
        if (!$lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'courseId' => ['required', 'string'],
            'semester' => ['nullable', 'integer', 'min:1'],
            'question' => ['required', 'string'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'answer' => ['nullable', 'string'],
        ]);

        if (!$this->isCourseAssigned($lecturerId, $payload['courseId'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $examQuestion->update([
            'course_id' => $payload['courseId'],
            'semester' => $payload['semester'] ?? null,
            'question' => $payload['question'],
            'options' => $payload['options'],
            'answer' => $payload['answer'] ?? null,
        ]);

        return response()->json($this->mapQuestion($examQuestion));
    }

    public function destroy(Request $request, ExamQuestion $examQuestion)
    {
        $lecturerId = $this->resolveLecturerId($request);
        if (!$lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$this->isCourseAssigned($lecturerId, $examQuestion->course_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $examQuestion->delete();
        return response()->noContent();
    }

    private function resolveLecturerId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        if (!is_array($sessionUser) || !isset($sessionUser['id']) || !is_numeric($sessionUser['id'])) {
            return null;
        }
        return (int) $sessionUser['id'];
    }

    private function isCourseAssigned(int $lecturerId, string $courseId): bool
    {
        return CourseLecturerAssignment::query()
            ->where('lecturer_id', $lecturerId)
            ->where('course_id', $courseId)
            ->exists();
    }

    private function mapQuestion(ExamQuestion $question): array
    {
        return [
            'id' => $question->id,
            'courseId' => $question->course_id,
            'semester' => $question->semester,
            'question' => $question->question,
            'options' => $question->options ?? [],
            'answer' => $question->answer,
        ];
    }
}
