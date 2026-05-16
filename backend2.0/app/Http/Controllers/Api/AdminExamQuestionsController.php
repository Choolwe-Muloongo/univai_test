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
        if ($request->filled('lessonId')) {
            $query->where('lesson_id', $request->query('lessonId'));
        }
        if ($request->filled('semester')) {
            $query->where('semester', (int) $request->query('semester'));
        }
        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->query('difficulty'));
        }
        if ($request->filled('questionType')) {
            $query->where('question_type', $request->query('questionType'));
        }

        return $query->orderBy('difficulty')->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => $this->mapQuestion($question));
    }

    public function store(Request $request)
    {
        $payload = $this->validatedQuestion($request);
        $question = ExamQuestion::create($this->modelPayload($payload));
        return response()->json($this->mapQuestion($question), 201);
    }

    public function bulkStore(Request $request)
    {
        $payload = $request->validate([
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.courseId' => ['nullable', 'string'],
            'questions.*.lessonId' => ['nullable', 'string'],
            'questions.*.semester' => ['nullable', 'integer', 'min:1'],
            'questions.*.question' => ['required', 'string'],
            'questions.*.questionType' => ['nullable', 'string'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['string'],
            'questions.*.answer' => ['nullable', 'string'],
            'questions.*.explanation' => ['nullable', 'string'],
            'questions.*.difficulty' => ['nullable', 'string'],
            'questions.*.timeSeconds' => ['nullable', 'integer', 'min:15', 'max:3600'],
            'questions.*.source' => ['nullable', 'string'],
            'questions.*.tags' => ['nullable', 'array'],
        ]);

        $created = collect($payload['questions'])->map(function (array $row) {
            $question = ExamQuestion::create($this->modelPayload($row));
            return $this->mapQuestion($question);
        });

        return response()->json(['created' => $created->values(), 'count' => $created->count()], 201);
    }

    public function update(Request $request, ExamQuestion $examQuestion)
    {
        $payload = $this->validatedQuestion($request);
        $examQuestion->update($this->modelPayload($payload));
        return response()->json($this->mapQuestion($examQuestion));
    }

    public function destroy(ExamQuestion $examQuestion)
    {
        $examQuestion->delete();
        return response()->noContent();
    }

    private function validatedQuestion(Request $request): array
    {
        return $request->validate([
            'courseId' => ['nullable', 'string'],
            'lessonId' => ['nullable', 'string'],
            'semester' => ['nullable', 'integer', 'min:1'],
            'question' => ['required', 'string'],
            'questionType' => ['nullable', 'string'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string'],
            'answer' => ['nullable', 'string'],
            'explanation' => ['nullable', 'string'],
            'difficulty' => ['nullable', 'string'],
            'timeSeconds' => ['nullable', 'integer', 'min:15', 'max:3600'],
            'source' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
        ]);
    }

    private function modelPayload(array $payload): array
    {
        $type = $payload['questionType'] ?? 'mcq';
        return [
            'course_id' => $payload['courseId'] ?? null,
            'lesson_id' => $payload['lessonId'] ?? null,
            'semester' => $payload['semester'] ?? null,
            'question' => $payload['question'],
            'question_type' => $type,
            'options' => $payload['options'] ?? [],
            'answer' => $payload['answer'] ?? null,
            'explanation' => $payload['explanation'] ?? null,
            'difficulty' => $payload['difficulty'] ?? 'easy',
            'time_seconds' => $payload['timeSeconds'] ?? $this->defaultTimeFor($payload['difficulty'] ?? 'easy', $type),
            'source' => $payload['source'] ?? 'manual',
            'tags' => $payload['tags'] ?? [],
        ];
    }

    private function defaultTimeFor(string $difficulty, string $type): int
    {
        if (in_array($type, ['short_answer', 'explanation', 'essay'], true)) {
            return match ($difficulty) {
                'hard' => 180,
                'very_hard' => 300,
                'medium' => 120,
                default => 90,
            };
        }

        return match ($difficulty) {
            'hard' => 90,
            'very_hard' => 120,
            'medium' => 60,
            default => 45,
        };
    }

    private function mapQuestion(ExamQuestion $question): array
    {
        return [
            'id' => $question->id,
            'courseId' => $question->course_id,
            'lessonId' => $question->lesson_id,
            'semester' => $question->semester,
            'question' => $question->question,
            'questionType' => $question->question_type ?? 'mcq',
            'options' => $question->options ?? [],
            'answer' => $question->answer,
            'explanation' => $question->explanation,
            'difficulty' => $question->difficulty ?? 'easy',
            'timeSeconds' => $question->time_seconds ?? 60,
            'source' => $question->source ?? 'manual',
            'tags' => $question->tags ?? [],
        ];
    }
}
