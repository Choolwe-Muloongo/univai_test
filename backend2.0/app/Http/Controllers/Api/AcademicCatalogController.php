<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicModule;
use App\Models\Cohort;
use App\Models\DeliveryMode;
use App\Models\Department;
use App\Models\ExamCentre;
use App\Models\Programme;
use App\Models\QualificationLevel;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AcademicCatalogController extends Controller
{
    public function schools()
    {
        return School::query()
            ->with('departments')
            ->orderBy('name')
            ->get()
            ->map(fn (School $school) => [
                'id' => $school->id,
                'code' => $school->code,
                'name' => $school->name,
                'description' => $school->description,
                'status' => $school->status,
                'departments' => $school->departments->map(fn (Department $department) => $this->mapDepartment($department))->values(),
            ]);
    }

    public function departments()
    {
        return Department::query()
            ->orderBy('school_id')
            ->orderBy('name')
            ->get()
            ->map(fn (Department $department) => $this->mapDepartment($department));
    }

    public function qualificationLevels()
    {
        return QualificationLevel::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (QualificationLevel $level) => [
                'id' => $level->id,
                'code' => $level->code,
                'name' => $level->name,
                'frameworkLevel' => $level->framework_level,
                'sortOrder' => $level->sort_order,
                'description' => $level->description,
            ]);
    }

    public function programmes(Request $request)
    {
        return Programme::query()
            ->when($request->query('schoolId'), fn ($query, $schoolId) => $query->where('school_id', $schoolId))
            ->when($request->query('departmentId'), fn ($query, $departmentId) => $query->where('department_id', $departmentId))
            ->with(['school', 'department', 'qualificationLevel'])
            ->orderBy('title')
            ->get()
            ->map(fn (Programme $programme) => $this->mapProgramme($programme));
    }

    public function programme(string $programmeId)
    {
        $programme = Programme::query()
            ->with([
                'school',
                'department',
                'qualificationLevel',
                'curriculumVersions' => fn ($query) => $query->orderByDesc('is_current')->orderByDesc('published_at'),
                'modules' => fn ($query) => $query->orderBy('semester')->orderBy('code'),
                'modules.units' => fn ($query) => $query->orderBy('sort_order')->orderBy('title'),
                'modules.units.lessons' => fn ($query) => $query->orderBy('sort_order')->orderBy('title'),
                'cohorts.deliveryMode',
                'cohorts.examCentre',
            ])
            ->find($programmeId);

        if (!$programme) {
            return response()->json(null, 404);
        }

        return $this->mapProgramme($programme) + [
            'curriculumVersions' => $programme->curriculumVersions->map(fn ($version) => [
                'id' => $version->id,
                'legacyProgramId' => $version->program_id,
                'programmeId' => $version->programme_id,
                'code' => $version->code,
                'name' => $version->name,
                'status' => $version->status,
                'publishedAt' => optional($version->published_at)->toISOString(),
                'effectiveFrom' => optional($version->effective_from)->toDateString(),
                'effectiveTo' => optional($version->effective_to)->toDateString(),
                'isCurrent' => (bool) $version->is_current,
            ])->values(),
            'modules' => $programme->modules->map(fn (AcademicModule $module) => $this->mapModule($module))->values(),
            'cohorts' => $programme->cohorts->map(fn (Cohort $cohort) => $this->mapCohort($cohort))->values(),
        ];
    }

    public function modules(Request $request)
    {
        return AcademicModule::query()
            ->when($request->query('programmeId'), fn ($query, $programmeId) => $query->where('programme_id', $programmeId))
            ->when($request->query('curriculumVersionId'), fn ($query, $versionId) => $query->where('curriculum_version_id', $versionId))
            ->with(['units.lessons', 'assessments'])
            ->orderBy('programme_id')
            ->orderBy('semester')
            ->orderBy('code')
            ->get()
            ->map(fn (AcademicModule $module) => $this->mapModule($module));
    }

    public function deliveryModes()
    {
        return DeliveryMode::query()
            ->orderBy('name')
            ->get()
            ->map(fn (DeliveryMode $mode) => [
                'id' => $mode->id,
                'code' => $mode->code,
                'name' => $mode->name,
                'description' => $mode->description,
                'requiresAttendance' => (bool) $mode->requires_attendance,
            ]);
    }

    public function examCentres()
    {
        return ExamCentre::query()
            ->orderBy('country')
            ->orderBy('city')
            ->orderBy('name')
            ->get()
            ->map(fn (ExamCentre $centre) => [
                'id' => $centre->id,
                'code' => $centre->code,
                'name' => $centre->name,
                'address' => $centre->address,
                'city' => $centre->city,
                'country' => $centre->country,
                'timezone' => $centre->timezone,
                'metadata' => $centre->metadata,
            ]);
    }

    public function cohorts(Request $request)
    {
        return Cohort::query()
            ->when($request->query('programmeId'), fn ($query, $programmeId) => $query->where('programme_id', $programmeId))
            ->with(['deliveryMode', 'examCentre'])
            ->orderByDesc('starts_on')
            ->orderBy('name')
            ->get()
            ->map(fn (Cohort $cohort) => $this->mapCohort($cohort));
    }

    public function createProgramme(Request $request)
    {
        $payload = $request->validate([
            'id' => ['nullable', 'string'],
            'schoolId' => ['required', 'string'],
            'departmentId' => ['nullable', 'string'],
            'qualificationLevelId' => ['nullable', 'string'],
            'code' => ['required', 'string'],
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'durationMonths' => ['nullable', 'integer', 'min:1'],
        ]);

        $programme = Programme::updateOrCreate(
            ['id' => $payload['id'] ?? Str::slug($payload['code'])],
            [
                'school_id' => $payload['schoolId'],
                'department_id' => $payload['departmentId'] ?? null,
                'qualification_level_id' => $payload['qualificationLevelId'] ?? null,
                'code' => strtoupper($payload['code']),
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'status' => $payload['status'] ?? 'draft',
                'duration_months' => $payload['durationMonths'] ?? null,
            ]
        );

        return $this->mapProgramme($programme->fresh(['school', 'department', 'qualificationLevel']));
    }

    private function mapDepartment(Department $department): array
    {
        return [
            'id' => $department->id,
            'schoolId' => $department->school_id,
            'code' => $department->code,
            'name' => $department->name,
            'description' => $department->description,
            'status' => $department->status,
        ];
    }

    private function mapProgramme(Programme $programme): array
    {
        return [
            'id' => $programme->id,
            'schoolId' => $programme->school_id,
            'schoolName' => $programme->school?->name,
            'departmentId' => $programme->department_id,
            'departmentName' => $programme->department?->name,
            'qualificationLevelId' => $programme->qualification_level_id,
            'qualificationLevelName' => $programme->qualificationLevel?->name,
            'code' => $programme->code,
            'title' => $programme->title,
            'description' => $programme->description,
            'status' => $programme->status,
            'durationMonths' => $programme->duration_months,
        ];
    }

    private function mapModule(AcademicModule $module): array
    {
        return [
            'id' => $module->id,
            'programmeId' => $module->programme_id,
            'curriculumVersionId' => $module->curriculum_version_id,
            'departmentId' => $module->department_id,
            'code' => $module->code,
            'title' => $module->title,
            'description' => $module->description,
            'credits' => $module->credits,
            'semester' => $module->semester,
            'level' => $module->level,
            'isCore' => (bool) $module->is_core,
            'status' => $module->status,
            'units' => $module->relationLoaded('units') ? $module->units->map(fn ($unit) => [
                'id' => $unit->id,
                'moduleId' => $unit->module_id,
                'code' => $unit->code,
                'title' => $unit->title,
                'description' => $unit->description,
                'sortOrder' => $unit->sort_order,
                'lessons' => $unit->relationLoaded('lessons') ? $unit->lessons->map(fn ($lesson) => [
                    'id' => $lesson->id,
                    'unitId' => $lesson->unit_id,
                    'moduleId' => $lesson->module_id,
                    'legacyCourseId' => $lesson->course_id,
                    'title' => $lesson->title,
                    'summary' => $lesson->summary,
                    'sortOrder' => $lesson->sort_order,
                ])->values() : [],
            ])->values() : [],
            'assessments' => $module->relationLoaded('assessments') ? $module->assessments->map(fn ($assessment) => [
                'id' => $assessment->id,
                'moduleId' => $assessment->module_id,
                'unitId' => $assessment->unit_id,
                'lessonId' => $assessment->lesson_id,
                'title' => $assessment->title,
                'type' => $assessment->type,
                'weighting' => $assessment->weighting,
                'maxScore' => $assessment->max_score,
                'isSummative' => (bool) $assessment->is_summative,
                'dueAt' => optional($assessment->due_at)->toISOString(),
                'settings' => $assessment->settings,
            ])->values() : [],
        ];
    }

    private function mapCohort(Cohort $cohort): array
    {
        return [
            'id' => $cohort->id,
            'programmeId' => $cohort->programme_id,
            'curriculumVersionId' => $cohort->curriculum_version_id,
            'deliveryModeId' => $cohort->delivery_mode_id,
            'deliveryModeName' => $cohort->deliveryMode?->name,
            'examCentreId' => $cohort->exam_centre_id,
            'examCentreName' => $cohort->examCentre?->name,
            'code' => $cohort->code,
            'name' => $cohort->name,
            'startsOn' => optional($cohort->starts_on)->toDateString(),
            'endsOn' => optional($cohort->ends_on)->toDateString(),
            'capacity' => $cohort->capacity,
            'status' => $cohort->status,
        ];
    }
}
