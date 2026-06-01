<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ShortCourseBlueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminShortCourseDraftsController extends Controller
{
    public function index()
    {
        return Course::query()
            ->withCount('lessons')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Course $course) => $this->mapCourse($course))
            ->values();
    }

    public function store(Request $request)
    {
        $payload = $this->validateDraftPayload($request);

        return DB::transaction(function () use ($payload) {
            $result = app(AdminCatalogController::class)->createShortCourseDraft($this->requestFromPayload($payload));
            $courseId = (string) ($payload['course']['id'] ?? data_get($result, 'id'));

            if ($courseId !== '') {
                $this->storeBlueprint($courseId, $payload);
            }

            return $result;
        });
    }

    public function blueprint(string $id)
    {
        $course = Course::with(['lessons.learningObjects'])->findOrFail($id);
        $stored = ShortCourseBlueprint::where('course_id', $course->id)->first();

        return response()->json([
            'course' => $this->mapCourse($course),
            'blueprint' => $stored?->blueprint ?? $this->rebuildBlueprint($course),
            'sourceMode' => $stored?->source_mode ?? 'rebuilt-from-course',
            'programmeTitle' => $stored?->programme_title,
            'programmeCourseTitle' => $stored?->programme_course_title,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $payload = $this->validateDraftPayload($request);
        $payload['course']['id'] = $id;
        $payload['course']['replaceExistingContent'] = true;

        return DB::transaction(function () use ($payload, $id) {
            $result = app(AdminCatalogController::class)->createShortCourseDraft($this->requestFromPayload($payload));
            $this->storeBlueprint($id, $payload);
            $this->forgetCourseCaches($id);

            return $result;
        });
    }

    private function validateDraftPayload(Request $request): array
    {
        return $request->validate([
            'course' => ['required', 'array'],
            'blueprint' => ['required', 'array'],
            'sourceMode' => ['nullable', 'string'],
            'programmeTitle' => ['nullable', 'string'],
            'programmeCourseTitle' => ['nullable', 'string'],
        ]);
    }

    private function requestFromPayload(array $payload): Request
    {
        $forwarded = Request::create('/api/admin/short-courses/drafts', 'POST', $payload);
        $forwarded->setUserResolver(fn () => request()->user());

        return $forwarded;
    }

    private function storeBlueprint(string $courseId, array $payload): void
    {
        ShortCourseBlueprint::updateOrCreate(
            ['course_id' => $courseId],
            [
                'blueprint' => $payload['blueprint'],
                'source_mode' => $payload['sourceMode'] ?? null,
                'programme_title' => $payload['programmeTitle'] ?? null,
                'programme_course_title' => $payload['programmeCourseTitle'] ?? null,
            ]
        );
    }

    private function rebuildBlueprint(Course $course): array
    {
        $modules = [];

        foreach ($course->lessons as $lesson) {
            $learningObject = $lesson->learningObjects->first();
            $payload = is_array($learningObject?->payload) ? $learningObject->payload : [];
            $blocks = $payload['blocks'] ?? [];
            $moduleTitle = $payload['moduleTitle'] ?? 'Imported lessons';
            $moduleIndex = (int) ($payload['moduleIndex'] ?? 0);

            if (!isset($modules[$moduleIndex])) {
                $modules[$moduleIndex] = [
                    'id' => 'module-' . ($moduleIndex + 1),
                    'title' => $moduleTitle,
                    'description' => $moduleTitle,
                    'outcomes' => [],
                    'lessons' => [],
                ];
            }

            $modules[$moduleIndex]['lessons'][] = [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'summary' => $lesson->summary ?? '',
                'outcomes' => $payload['outcomes'] ?? [],
                'cards' => is_array($blocks) ? $blocks : [],
                'subLessons' => [],
            ];
        }

        ksort($modules);

        return [
            'course' => [
                'title' => $course->title,
                'description' => $course->description,
                'schoolId' => $course->school_id,
                'level' => $course->level,
                'durationHours' => $course->duration_hours,
                'entryFee' => (float) $course->price,
                'currency' => $course->currency,
                'certificateFee' => (float) $course->certificate_fee,
                'audience' => 'Learners',
                'prerequisites' => [],
                'outcomes' => [],
            ],
            'modules' => array_values($modules),
            'questions' => [],
        ];
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
            'status' => $course->status,
            'reviewStatus' => $course->review_status,
            'lessonCount' => $course->lessons_count ?? $course->lessons?->count() ?? 0,
            'updatedAt' => optional($course->updated_at)->toISOString(),
            'createdAt' => optional($course->created_at)->toISOString(),
        ];
    }

    private function forgetCourseCaches(string $courseId): void
    {
        Cache::forget('catalog:courses');
        Cache::forget("catalog:course:{$courseId}");
        Cache::forget("catalog:lessons:{$courseId}");
        Cache::forget("catalog:course:{$courseId}:lessons");
        Cache::forget('catalog:lessons:all');
    }
}
