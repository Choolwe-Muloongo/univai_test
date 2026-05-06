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
                'name' => $school->name,
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
                'progress' => $course->progress,
                'imageId' => $course->image_id,
                'certificateType' => $course->certificate_type,
                'pricingType' => $course->pricing_type,
                'price' => $course->price,
                'currency' => $course->currency,
                'durationHours' => $course->duration_hours,
                'level' => $course->level,
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
            'progress' => $course->progress,
            'imageId' => $course->image_id,
            'certificateType' => $course->certificate_type,
            'pricingType' => $course->pricing_type,
            'price' => $course->price,
            'currency' => $course->currency,
            'durationHours' => $course->duration_hours,
            'level' => $course->level,
        ];
    }

    public function lessonsByCourse(string $courseId)
    {
        $course = Course::find($courseId);
        if (!$course) {
            return response()->json([], 404);
        }

        return $course->lessons
            ->map(fn (Lesson $lesson) => $this->mapLesson($lesson, $courseId));
    }

    public function lesson(string $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(null, 404);
        }

        $courseId = $lesson->shortCourses()->value('short_courses.id');

        return $this->mapLesson($lesson, $courseId);
    }

    public function lessons()
    {
        return Lesson::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Lesson $lesson) => $this->mapLesson($lesson, $lesson->shortCourses()->value('short_courses.id')));
    }

    public function updateLesson(Request $request, string $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'title' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'videoUrl' => ['nullable', 'string'],
            'quiz' => ['nullable', 'array'],
            'exercise' => ['nullable', 'string'],
        ]);

        $lesson->update([
            'title' => $payload['title'] ?? $lesson->title,
            'content' => $payload['content'] ?? $lesson->content,
            'video_url' => $payload['videoUrl'] ?? $lesson->video_url,
            'quiz' => array_key_exists('quiz', $payload) ? $payload['quiz'] : $lesson->quiz,
            'exercise' => $payload['exercise'] ?? $lesson->exercise,
        ]);

        $courseId = $lesson->shortCourses()->value('short_courses.id');

        return $this->mapLesson($lesson, $courseId);
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

    private function mapLesson(Lesson $lesson, ?string $courseId): array
    {
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'summary' => $lesson->summary,
            'content' => $lesson->content,
            'courseId' => $courseId,
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
