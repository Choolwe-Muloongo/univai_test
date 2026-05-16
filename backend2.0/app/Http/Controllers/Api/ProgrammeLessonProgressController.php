<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProgrammeLessonProgressController extends Controller
{
    public function complete(Request $request, string $lessonId)
    {
        abort_unless(Schema::hasTable('programme_lesson_progress'), 503, 'Programme lesson progress table has not been migrated yet.');

        $studentId = $this->studentId($request);
        $lesson = Lesson::query()->findOrFail($lessonId);
        $sessionUser = $request->session()->get('user');

        $payload = $request->validate([
            'courseId' => ['nullable', 'string'],
            'programId' => ['nullable', 'string'],
            'moduleId' => ['nullable', 'string'],
        ]);

        DB::table('programme_lesson_progress')->updateOrInsert(
            [
                'student_id' => $studentId,
                'lesson_id' => $lesson->id,
            ],
            [
                'course_id' => $payload['courseId'] ?? ($lesson->course_id ?? null),
                'program_id' => $payload['programId'] ?? (is_array($sessionUser) ? ($sessionUser['programId'] ?? $sessionUser['program_id'] ?? null) : null),
                'module_id' => $payload['moduleId'] ?? null,
                'completed_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'lessonId' => $lesson->id,
            'completed' => true,
            'completedAt' => now()->toISOString(),
        ]);
    }

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }
}
