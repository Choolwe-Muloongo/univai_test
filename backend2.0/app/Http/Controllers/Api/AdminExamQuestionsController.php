<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamQuestion;
use Illuminate\Http\Request;

class AdminExamQuestionsController extends Controller
{
    public function index(Request $request)
    {
        $query = ExamQuestion::query();

        if ($request->filled('courseId')) {
            $query->where('course_id', $request->query('courseId'));
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
        $payload = $request->validate([
            'courseId' => ['nullable', 'string'],
            'semester' => ['nullable', 'integer', 'min:1'],
            'question' => ['required', 'string'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'answer' => ['nullable', 'string'],
        ]);

        $question = ExamQuestion::create([
            'course_id' => $payload['courseId'] ?? null,
            'semester' => $payload['semester'] ?? null,
            'question' => $payload['question'],
            'options' => $payload['options'],
            'answer' => $payload['answer'] ?? null,
        ]);

        return response()->json($this->mapQuestion($question), 201);
    }

    public function update(Request $request, ExamQuestion $examQuestion)
    {
        $payload = $request->validate([
            'courseId' => ['nullable', 'string'],
            'semester' => ['nullable', 'integer', 'min:1'],
            'question' => ['required', 'string'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'answer' => ['nullable', 'string'],
        ]);

        $examQuestion->update([
            'course_id' => $payload['courseId'] ?? null,
            'semester' => $payload['semester'] ?? null,
            'question' => $payload['question'],
            'options' => $payload['options'],
            'answer' => $payload['answer'] ?? null,
        ]);

        return response()->json($this->mapQuestion($examQuestion));
    }

    public function destroy(ExamQuestion $examQuestion)
    {
        $examQuestion->delete();
        return response()->noContent();
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
