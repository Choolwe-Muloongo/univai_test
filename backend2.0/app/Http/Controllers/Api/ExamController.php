<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentComponent;
use App\Models\ExamQuestion;
use App\Models\ExamResult;
use App\Services\AssessmentEngine;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function semesterExam(string $semesterId)
    {
        $semester = (int) $semesterId;

        return ExamQuestion::query()
            ->where('semester', $semester)
            ->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => $this->mapQuestion($question));
    }

    public function courseExam(string $courseId, Request $request)
    {
        $componentId = $request->query('assessmentComponentId');
        $query = ExamQuestion::query()->where('course_id', $courseId);

        if ($componentId) {
            $component = AssessmentComponent::find($componentId);
            if ($component?->question_bank_id) {
                $query->where('question_bank_id', $component->question_bank_id);
            }
        }

        return $query->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => $this->mapQuestion($question));
    }

    public function saveResult(Request $request, AssessmentEngine $assessmentEngine)
    {
        $payload = $request->validate([
            'examId' => ['required', 'string'],
            'moduleId' => ['nullable', 'string', 'exists:program_modules,id'],
            'assessmentComponentId' => ['nullable', 'integer', 'exists:assessment_components,id'],
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'examBookingConfirmed' => ['nullable', 'boolean'],
            'examClinicCompleted' => ['nullable', 'boolean'],
            'result' => ['nullable', 'array'],
        ]);

        $user = $request->session()->get('user');
        $userId = $user['id'] ?? 'guest';
        $numericUserId = is_numeric($userId) ? (int) $userId : null;

        $component = isset($payload['assessmentComponentId'])
            ? AssessmentComponent::with('blueprint')->find($payload['assessmentComponentId'])
            : null;

        if ($component && $numericUserId) {
            $access = $assessmentEngine->validateComponentAccess($component, $numericUserId);
            if (!$access['allowed']) {
                return response()->json(['message' => $access['message']], 422);
            }

            $attemptCount = ExamResult::query()
                ->where('user_id', (string) $userId)
                ->where('assessment_component_id', $component->id)
                ->count();
            if ($attemptCount >= $assessmentEngine->componentAttemptLimit($component)) {
                return response()->json(['message' => 'Maximum attempts reached for this exam.'], 422);
            }
        }

        $attemptNo = 1;
        if ($component) {
            $attemptNo = (int) ExamResult::query()
                ->where('user_id', (string) $userId)
                ->where('assessment_component_id', $component->id)
                ->max('attempt_no') + 1;
        }

        $releaseAt = $component?->results_release_at;
        $released = !$releaseAt || now()->greaterThanOrEqualTo($releaseAt);

        ExamResult::create([
            'user_id' => (string) $userId,
            'exam_id' => $payload['examId'],
            'module_id' => $payload['moduleId'] ?? $component?->blueprint?->module_id,
            'assessment_component_id' => $component?->id,
            'attempt_no' => $attemptNo,
            'score' => $payload['score'] ?? ($payload['result']['score'] ?? null),
            'status' => 'submitted',
            'exam_booking_confirmed' => $payload['examBookingConfirmed'] ?? (bool) $component?->requires_exam_booking,
            'exam_clinic_completed_at' => ($payload['examClinicCompleted'] ?? false) ? now() : null,
            'moderation_status' => $component?->moderation_rules ? 'pending' : 'not_required',
            'released_at' => $released ? now() : null,
            'result' => $payload['result'] ?? [],
        ]);

        return response()->json(['status' => 'saved', 'attempt' => $attemptNo]);
    }

    public function results(Request $request)
    {
        $user = $request->session()->get('user');
        $userId = $user['id'] ?? 'guest';

        $results = ExamResult::query()
            ->where('user_id', (string) $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $payload = [];
        foreach ($results as $result) {
            $payload[$result->exam_id] = [
                ...($result->result ?? []),
                'moduleId' => $result->module_id,
                'assessmentComponentId' => $result->assessment_component_id,
                'attempt' => $result->attempt_no,
                'score' => $result->score,
                'status' => $result->status,
                'moderationStatus' => $result->moderation_status,
                'releasedAt' => $result->released_at?->toISOString(),
            ];
        }

        return response()->json($payload);
    }

    public function latest(Request $request)
    {
        $user = $request->session()->get('user');
        $userId = $user['id'] ?? 'guest';

        $latest = ExamResult::query()
            ->where('user_id', (string) $userId)
            ->orderBy('created_at', 'desc')
            ->value('exam_id');

        return response()->json($latest);
    }

    private function mapQuestion(ExamQuestion $question): array
    {
        return [
            'question' => $question->question,
            'options' => $question->options ?? [],
            'answer' => $question->answer,
            'questionBankId' => $question->question_bank_id,
            'difficulty' => $question->difficulty,
            'outcomes' => $question->outcomes ?? [],
        ];
    }
}
