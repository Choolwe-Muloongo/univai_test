<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\LearningObject;
use App\Models\Lesson;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function schools()
    {
        return Cache::remember('catalog:schools', $this->publicCacheSeconds(), fn () => School::query()
            ->orderBy('name')
            ->get()
            ->map(fn (School $school) => [
                'id' => $school->id,
                'name' => $school->name,
            ]));
    }

    public function courses()
    {
        return Cache::remember('catalog:courses', $this->publicCacheSeconds(), fn () => Course::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => $this->mapCourse($course)));
    }

    public function course(string $id)
    {
        $course = $this->findCourseForCatalogue($id);

        if (!$course) {
            return response()->json(null, 404);
        }

        return $this->mapCourse($course);
    }

    public function lessonsByCourse(string $courseId)
    {
        $course = $this->findCourseForCatalogue($courseId);

        if (!$course) {
            return response()->json([], 200);
        }

        return $course->lessons()
            ->with('learningObjects')
            ->get()
            ->map(fn (Lesson $lesson) => $this->mapLesson($lesson, $course->id));
    }

    public function lesson(string $lessonId)
    {
        $lesson = Lesson::with('learningObjects')->find($lessonId);
        if (!$lesson) {
            return response()->json(null, 404);
        }

        $courseId = $lesson->shortCourses()->value('short_courses.id');

        return $this->mapLesson($lesson, $courseId);
    }

    public function lessons()
    {
        return Lesson::query()
            ->with('learningObjects')
            ->orderBy('course_id')
            ->orderBy('display_order')
            ->orderBy('title')
            ->get()
            ->map(fn (Lesson $lesson) => $this->mapLesson($lesson, $lesson->shortCourses()->value('short_courses.id')));
    }

    public function updateLesson(Request $request, string $lessonId)
    {
        $lesson = Lesson::with('learningObjects')->find($lessonId);
        if (!$lesson) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'title' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'videoUrl' => ['nullable', 'string'],
            'quiz' => ['nullable', 'array'],
            'exercise' => ['nullable', 'string'],
            'learningObjects' => ['nullable', 'array'],
        ]);

        $lesson->update([
            'title' => $payload['title'] ?? $lesson->title,
            'summary' => $payload['content'] ?? $lesson->summary,
        ]);

        if (array_key_exists('content', $payload)) {
            $this->upsertLearningObject($lesson, 'content', ['body' => $payload['content']]);
        }

        if (array_key_exists('videoUrl', $payload)) {
            $this->upsertLearningObject($lesson, 'video', ['asset_url' => $payload['videoUrl']]);
        }

        if (array_key_exists('quiz', $payload)) {
            $this->upsertLearningObject($lesson, 'quiz', ['payload' => $payload['quiz']]);
        }

        if (array_key_exists('exercise', $payload)) {
            $this->upsertLearningObject($lesson, 'exercise', ['body' => $payload['exercise']]);
        }

        $courseId = $lesson->shortCourses()->value('short_courses.id');
        if ($courseId) {
            Cache::forget('catalog:course:' . md5($courseId) . ':lessons');
            Cache::forget("catalog:course:{$courseId}:lessons");
        }

        return $this->mapLesson($lesson->fresh('learningObjects'), $courseId);
    }

    public function courseExam(string $courseId)
    {
        $course = $this->findCourseForCatalogue($courseId);
        $resolvedCourseId = $course?->id ?? $courseId;

        return Cache::remember('catalog:course:' . md5($resolvedCourseId) . ':exam', $this->publicCacheSeconds(), fn () => ExamQuestion::query()
            ->where('course_id', $resolvedCourseId)
            ->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => [
                'question' => $question->question,
                'options' => $question->options ?? [],
                'answer' => $question->answer,
            ]));
    }

    private function publicCacheSeconds(): int
    {
        return max(0, (int) config('univai.capacity.public_cache_seconds', 300));
    }

    private function findCourseForCatalogue(string $id): ?Course
    {
        $decoded = rawurldecode($id);
        $normalized = trim($decoded);

        if ($this->isInvalidCatalogueKey($normalized)) {
            return null;
        }

        $slug = Str::slug($normalized);
        $lowerNormalized = Str::lower($normalized);
        $lowerSlug = Str::lower($slug);

        $course = Course::query()
            ->where('id', $normalized)
            ->orWhere('id', $decoded)
            ->orWhere('id', $slug)
            ->orWhere('title', $normalized)
            ->first();

        if ($course) {
            return $course;
        }

        return Course::query()
            ->select(['id', 'title', 'description', 'school_id', 'progress', 'image_id', 'certificate_type', 'pricing_type', 'price', 'currency', 'certificate_fee', 'certificate_currency', 'duration_hours', 'level', 'status'])
            ->get()
            ->first(function (Course $candidate) use ($lowerNormalized, $lowerSlug) {
                $title = Str::lower(trim((string) $candidate->title));
                $titleSlug = Str::lower(Str::slug((string) $candidate->title));
                $idSlug = Str::lower(Str::slug((string) $candidate->id));

                return $title === $lowerNormalized
                    || $titleSlug === $lowerSlug
                    || $idSlug === $lowerSlug;
            });
    }

    private function isInvalidCatalogueKey(string $value): bool
    {
        if ($value === '') {
            return true;
        }

        $lower = Str::lower($value);

        return in_array($lower, ['[object object]', 'object-object', 'undefined', 'null', 'nan'], true)
            || str_contains($lower, '[object')
            || str_contains($lower, 'object%20object');
    }

    private function mapCourse(Course $course): array
    {
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
            'certificateFee' => $course->certificate_fee,
            'certificateCurrency' => $course->certificate_currency,
            'durationHours' => $course->duration_hours,
            'level' => $course->level,
            'status' => $course->status ?? 'draft',
        ];
    }

    private function mapLesson(Lesson $lesson, ?string $courseId): array
    {
        $objects = $lesson->relationLoaded('learningObjects')
            ? $lesson->learningObjects
            : $lesson->learningObjects()->get();
        $firstOfType = fn (string $type) => $objects->firstWhere('type', $type);
        $content = $firstOfType('content');
        $video = $firstOfType('video');
        $exercise = $firstOfType('exercise');
        $quiz = $firstOfType('quiz');
        $contentPayload = is_array($content?->payload) ? $content->payload : [];

        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'content' => $content?->body ?? $lesson->summary ?? '',
            'summary' => $lesson->summary,
            'courseId' => $courseId,
            'moduleTitle' => $contentPayload['moduleTitle'] ?? null,
            'moduleIndex' => $contentPayload['moduleIndex'] ?? null,
            'lessonIndex' => $contentPayload['lessonIndex'] ?? null,
            'isSubLesson' => (bool) ($contentPayload['isSubLesson'] ?? false),
            'parentLessonTitle' => $contentPayload['parentLessonTitle'] ?? null,
            'parentLessonIndex' => $contentPayload['parentLessonIndex'] ?? null,
            'videoUrl' => $video?->asset_url,
            'exercise' => $exercise?->body,
            'quiz' => $quiz?->payload,
            'learningObjects' => $objects->map(fn (LearningObject $object) => $this->mapLearningObject($object))->values(),
        ];
    }

    private function mapLearningObject(LearningObject $object): array
    {
        return [
            'id' => $object->id,
            'type' => $object->type,
            'title' => $object->title,
            'description' => $object->description,
            'body' => $object->body,
            'assetUrl' => $object->asset_url,
            'storagePath' => $object->storage_path,
            'mimeType' => $object->mime_type,
            'payload' => $object->payload,
            'accessRules' => $object->pivot?->access_rules ?? $object->access_rules,
            'version' => $object->version,
            'versionLabel' => $object->version_label,
            'isCurrent' => $object->is_current,
            'isReusable' => $object->is_reusable,
            'reviewStatus' => $object->review_status,
            'publicationStatus' => $object->pivot?->publication_status ?? $object->publication_status,
            'position' => $object->pivot?->position,
            'isRequired' => $object->pivot?->is_required,
            'availableFrom' => $object->pivot?->available_from,
            'availableUntil' => $object->pivot?->available_until,
            'publishedAt' => $object->published_at,
        ];
    }

    private function upsertLearningObject(Lesson $lesson, string $type, array $attributes): void
    {
        $object = $lesson->learningObjects()->where('type', $type)->first();
        if ($object) {
            $object->update($attributes);
            return;
        }

        $lesson->learningObjects()->create(array_merge([
            'type' => $type,
            'title' => ucfirst($type),
            'review_status' => 'draft',
            'publication_status' => 'draft',
        ], $attributes));
    }
}
