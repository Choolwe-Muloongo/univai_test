<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Lesson;
use App\Models\School;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function schools()
    {
        return School::query()
            ->orderBy('name')
            ->get()
            ->map(fn (School $school) => [
                'id' => $school->id,
                'code' => $school->code,
                'name' => $school->name,
                'description' => $school->description,
                'status' => $school->status,
            ]);
    }

    public function courses()
    {
        return Course::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'schoolId' => $course->school_id,
                'programmeId' => $course->programme_id,
                'departmentId' => $course->department_id,
                'progress' => $course->progress,
                'imageId' => $course->image_id,
            ]);
    }

    public function course(string $id)
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(null, 404);
        }

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'schoolId' => $course->school_id,
            'programmeId' => $course->programme_id,
            'departmentId' => $course->department_id,
            'progress' => $course->progress,
            'imageId' => $course->image_id,
        ];
    }

    public function lessonsByCourse(string $courseId)
    {
        return Lesson::query()
            ->where('course_id', $courseId)
            ->orderBy('title')
            ->get()
            ->map(fn (Lesson $lesson) => $this->mapLesson($lesson, $courseId));
    }

    public function lesson(string $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(null, 404);
        }

        return $this->mapLesson($lesson, $lesson->course_id);
    }

    public function lessons()
    {
        return Lesson::query()
            ->orderBy('course_id')
            ->orderBy('title')
            ->get()
            ->map(fn (Lesson $lesson) => $this->mapLesson($lesson, $lesson->course_id));
    }

    public function updateLesson(Request $request, string $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'unitId' => ['nullable', 'string'],
            'moduleId' => ['nullable', 'string'],
            'title' => ['nullable', 'string'],
            'summary' => ['nullable', 'string'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'content' => ['nullable', 'string'],
            'videoUrl' => ['nullable', 'string'],
            'quiz' => ['nullable', 'array'],
            'exercise' => ['nullable', 'string'],
        ]);

        $lesson->update([
            'unit_id' => $payload['unitId'] ?? $lesson->unit_id,
            'module_id' => $payload['moduleId'] ?? $lesson->module_id,
            'title' => $payload['title'] ?? $lesson->title,
            'summary' => $payload['summary'] ?? $lesson->summary,
            'sort_order' => $payload['sortOrder'] ?? $lesson->sort_order,
            'content' => $payload['content'] ?? $lesson->content,
            'video_url' => $payload['videoUrl'] ?? $lesson->video_url,
            'quiz' => array_key_exists('quiz', $payload) ? $payload['quiz'] : $lesson->quiz,
            'exercise' => $payload['exercise'] ?? $lesson->exercise,
        ]);

        return $this->mapLesson($lesson, $lesson->course_id);
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

    private function mapLesson(Lesson $lesson, string $courseId): array
    {
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'content' => $lesson->content,
            'courseId' => $courseId,
            'unitId' => $lesson->unit_id,
            'moduleId' => $lesson->module_id,
            'summary' => $lesson->summary,
            'sortOrder' => $lesson->sort_order,
            'videoUrl' => $lesson->video_url,
            'exercise' => $lesson->exercise,
            'quiz' => $lesson->quiz,
        ];
    }

    private function examQuestions(): array
    {
        return [];
    }
}
