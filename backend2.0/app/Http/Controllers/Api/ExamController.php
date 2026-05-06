<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamQuestion;
use App\Models\ExamResult;
use App\Models\User;
use App\Services\NotificationService;
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
            ->map(fn (ExamQuestion $question) => [
                'question' => $question->question,
                'options' => $question->options ?? [],
                'answer' => $question->answer,
            ]);
    }

    public function courseExam(string $courseId)
    {
        return ExamQuestion::query()
            ->where('course_id', $courseId)
            ->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => [
                'question' => $question->question,
                'options' => $question->options ?? [],
                'answer' => $question->answer,
            ]);
    }

    public function saveResult(Request $request)
    {
        $payload = $request->validate([
            'examId' => ['required', 'string'],
            'result' => ['nullable', 'array'],
        ]);

        $user = $request->session()->get('user');
        $userId = $user['id'] ?? 'guest';

        $examResult = ExamResult::create([
            'user_id' => $userId,
            'exam_id' => $payload['examId'],
            'result' => $payload['result'] ?? [],
        ]);

        $recipient = is_numeric($userId) ? User::find((int) $userId) : null;
        if ($recipient) {
            app(NotificationService::class)->stateChange(
                'exam.result_recorded',
                'exams',
                'Exam result saved',
                'Your exam result has been saved and your certificate is ready for verification.',
                $recipient,
                $examResult,
                '/student/certificate/' . $examResult->id,
                ['examId' => $payload['examId'], 'certificateId' => $examResult->id],
                'high'
            );

            app(NotificationService::class)->stateChange(
                'alumni.discount_unlocked',
                'alumni_discounts',
                'Alumni discount unlocked',
                'Your verified certificate unlocks alumni discount eligibility for continuing programs and partner offers.',
                $recipient,
                $examResult,
                '/student/graduation',
                ['examId' => $payload['examId'], 'certificateId' => $examResult->id],
                'normal'
            );
        }

        return response()->json(['status' => 'saved']);
    }

    public function results(Request $request)
    {
        $user = $request->session()->get('user');
        $userId = $user['id'] ?? 'guest';

        $results = ExamResult::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $payload = [];
        foreach ($results as $result) {
            $payload[$result->exam_id] = $result->result;
        }

        return response()->json($payload);
    }

    public function latest(Request $request)
    {
        $user = $request->session()->get('user');
        $userId = $user['id'] ?? 'guest';

        $latest = ExamResult::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->value('exam_id');

        return response()->json($latest);
    }

    private function questions(): array
    {
        return [];
    }
}
