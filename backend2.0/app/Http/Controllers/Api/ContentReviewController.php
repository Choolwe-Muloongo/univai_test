<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LearningObject;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ContentReviewController extends Controller
{
    public function submitCourseForReview(Request $request, string $courseId)
    {
        $course = Course::with('lessons.learningObjects')->findOrFail($courseId);
        $userId = $this->userId($request);

        return DB::transaction(function () use ($course, $userId) {
            $course->update([
                'status' => 'draft',
                'review_status' => 'needs_review',
            ]);

            foreach ($course->lessons as $lesson) {
                $this->setLessonReviewState($lesson, 'needs_review', $userId, 'Submitted for academic review.');
            }

            $this->logPublication('short_course', $course->id, $userId, $course->status, 'needs_review', 'Course submitted for human review.');
            $this->forgetCourseCaches($course->id);

            return response()->json([
                'id' => $course->id,
                'status' => 'draft',
                'reviewStatus' => 'needs_review',
                'message' => 'Course submitted for review.',
            ]);
        });
    }

    public function approveCourse(Request $request, string $courseId)
    {
        $payload = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $course = Course::with('lessons.learningObjects')->findOrFail($courseId);
        $userId = $this->userId($request);

        return DB::transaction(function () use ($course, $userId, $payload) {
            $course->update([
                'status' => 'draft',
                'review_status' => 'approved',
            ]);

            foreach ($course->lessons as $lesson) {
                $this->setLessonReviewState($lesson, 'approved', $userId, $payload['notes'] ?? 'Approved for publishing.');
            }

            $this->logPublication('short_course', $course->id, $userId, $course->status, 'approved', $payload['notes'] ?? 'Course approved.');
            $this->forgetCourseCaches($course->id);

            return response()->json([
                'id' => $course->id,
                'status' => 'draft',
                'reviewStatus' => 'approved',
                'message' => 'Course approved. You can now publish it.',
            ]);
        });
    }

    public function publishApprovedCourse(Request $request, string $courseId)
    {
        $payload = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $course = Course::with('lessons.learningObjects')->findOrFail($courseId);
        $userId = $this->userId($request);

        if (($course->review_status ?? 'needs_review') !== 'approved') {
            return response()->json([
                'message' => 'This course must be approved by a human reviewer before publishing.',
            ], 422);
        }

        return DB::transaction(function () use ($course, $userId, $payload) {
            $before = $course->status ?? 'draft';
            $course->update([
                'status' => 'published',
                'review_status' => 'approved',
            ]);

            foreach ($course->lessons as $lesson) {
                $lesson->update([
                    'publication_status' => 'published',
                    'published_at' => now(),
                ]);

                foreach ($lesson->learningObjects as $learningObject) {
                    $learningObject->update([
                        'review_status' => 'approved',
                        'publication_status' => 'published',
                        'published_at' => now(),
                    ]);

                    $lesson->learningObjects()->updateExistingPivot($learningObject->id, [
                        'publication_status' => 'published',
                        'updated_at' => now(),
                    ]);
                }

                $this->captureLessonVersion($lesson, 'publish', $userId);
                $this->setLessonReviewState($lesson, 'approved', $userId, $payload['notes'] ?? 'Published after approval.');
            }

            $this->logPublication('short_course', $course->id, $userId, $before, 'published', $payload['notes'] ?? 'Published after approval.');
            $this->forgetCourseCaches($course->id);

            return response()->json([
                'id' => $course->id,
                'status' => 'published',
                'reviewStatus' => 'approved',
                'message' => 'Course published.',
            ]);
        });
    }

    public function reviewLesson(Request $request, string $lessonId)
    {
        $payload = $request->validate([
            'status' => ['required', 'in:needs_review,changes_requested,approved'],
            'notes' => ['nullable', 'string'],
        ]);

        $lesson = Lesson::with('learningObjects')->findOrFail($lessonId);
        $userId = $this->userId($request);

        return DB::transaction(function () use ($lesson, $payload, $userId) {
            $publicationStatus = $payload['status'] === 'approved' ? $lesson->publication_status : 'draft';
            $lesson->update([
                'publication_status' => $publicationStatus,
            ]);

            foreach ($lesson->learningObjects as $learningObject) {
                $learningObject->update([
                    'review_status' => $payload['status'],
                    'publication_status' => $publicationStatus,
                    'reviewed_by' => $userId,
                    'reviewed_at' => now(),
                ]);
            }

            $this->setLessonReviewState($lesson, $payload['status'], $userId, $payload['notes'] ?? null);
            $this->captureLessonVersion($lesson, 'review', $userId);

            return response()->json([
                'id' => $lesson->id,
                'reviewStatus' => $payload['status'],
                'message' => 'Lesson review status updated.',
            ]);
        });
    }

    private function setLessonReviewState(Lesson $lesson, string $status, ?int $userId, ?string $notes): void
    {
        if (Schema::hasTable('lesson_reviews')) {
            DB::table('lesson_reviews')->insert([
                'lesson_id' => $lesson->id,
                'status' => $status,
                'reviewer_id' => $userId,
                'notes' => $notes,
                'reviewed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function captureLessonVersion(Lesson $lesson, string $source, ?int $userId): void
    {
        if (!Schema::hasTable('lesson_versions')) {
            return;
        }

        $nextVersion = ((int) DB::table('lesson_versions')->where('lesson_id', $lesson->id)->max('version_number')) + 1;
        $lesson->loadMissing('learningObjects');

        DB::table('lesson_versions')->insert([
            'lesson_id' => $lesson->id,
            'version_number' => $nextVersion,
            'content_snapshot' => json_encode([
                'lesson' => $lesson->only(['id', 'title', 'summary', 'display_order', 'publication_status', 'published_at']),
                'learningObjects' => $lesson->learningObjects->map(fn (LearningObject $object) => [
                    'id' => $object->id,
                    'type' => $object->type,
                    'title' => $object->title,
                    'body' => $object->body,
                    'payload' => $object->payload,
                    'review_status' => $object->review_status,
                    'publication_status' => $object->publication_status,
                ])->values()->all(),
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'source' => $source,
            'created_by' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function logPublication(string $sourceType, string $sourceId, ?int $userId, ?string $before, string $after, ?string $notes): void
    {
        if (!Schema::hasTable('course_publication_logs')) {
            return;
        }

        DB::table('course_publication_logs')->insert([
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'published_by' => $userId,
            'status_before' => $before,
            'status_after' => $after,
            'notes' => $notes,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function userId(Request $request): ?int
    {
        $user = $request->session()->get('user');
        return is_array($user) && isset($user['id']) && is_numeric($user['id']) ? (int) $user['id'] : null;
    }

    private function forgetCourseCaches(string $courseId): void
    {
        Cache::forget('catalog:courses');
        Cache::forget("catalog:course:{$courseId}");
        Cache::forget("catalog:course:{$courseId}:lessons");
        Cache::forget("catalog:course:{$courseId}:exam");
    }
}
