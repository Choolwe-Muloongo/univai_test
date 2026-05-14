<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use App\Models\QualificationLevel;
use App\Models\School;
use App\Support\DeliveryModes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminCatalogController extends Controller
{
    public function qualificationLevels()
    {
        return QualificationLevel::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (QualificationLevel $level) => $this->mapQualificationLevel($level));
    }

    public function createSchool(Request $request)
    {
        $payload = $request->validate([
            'id' => ['nullable', 'string'],
            'name' => ['required', 'string', 'min:2'],
        ]);

        $school = School::updateOrCreate(
            ['id' => $payload['id'] ?? $this->slug($payload['name'])],
            ['name' => $payload['name']]
        );

        Cache::forget('catalog:schools');

        return $this->mapSchool($school);
    }

    public function updateSchool(Request $request, string $id)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
        ]);

        $school = School::findOrFail($id);
        $school->update(['name' => $payload['name']]);
        Cache::forget('catalog:schools');

        return $this->mapSchool($school);
    }

    public function createProgram(Request $request)
    {
        $payload = $request->validate([
            'id' => ['required', 'string'],
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'schoolId' => ['required', 'string', 'exists:schools,id'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'qualificationLevelId' => ['required', 'string', 'exists:qualification_levels,id'],
            'credits' => ['nullable', 'integer', 'min:0'],
            'durationMonths' => ['nullable', 'integer', 'min:1'],
            'admissionRequirements' => ['nullable', 'string'],
            'requiredSubjects' => ['nullable', 'array'],
            'requiredSubjects.*.subjectId' => ['nullable', 'string'],
            'requiredSubjects.*.subjectName' => ['required_with:requiredSubjects', 'string'],
            'requiredSubjects.*.minimumPoints' => ['nullable', 'integer', 'min:0'],
            'deliveryModes' => ['nullable', 'array'],
            'deliveryModes.*' => ['string'],
            'examClinicRequired' => ['nullable', 'boolean'],
            'requiresAccreditationApproval' => ['nullable', 'boolean'],
            'accreditationApproved' => ['nullable', 'boolean'],
            'launchStatus' => ['nullable', 'string'],
            'applicationFee' => ['nullable', 'numeric', 'min:0'],
            'applicationCurrency' => ['nullable', 'string', 'size:3'],
            'tuitionFee' => ['nullable', 'numeric', 'min:0'],
            'tuitionCurrency' => ['nullable', 'string', 'size:3'],
            'imageId' => ['nullable', 'string'],
        ]);

        $level = QualificationLevel::findOrFail($payload['qualificationLevelId']);
        $deliveryModes = $payload['deliveryModes'] ?? $level->allowed_delivery_modes ?? ['hybrid'];
        $requiresAccreditation = $payload['requiresAccreditationApproval'] ?? $level->requires_accreditation_approval;
        $accreditationApproved = (bool) ($payload['accreditationApproved'] ?? false);
        $launchStatus = $payload['launchStatus'] ?? 'draft';

        if ($requiresAccreditation && !$accreditationApproved && $launchStatus === 'published') {
            return response()->json([
                'message' => 'Accreditation approval is required before this qualification can be launched.',
            ], 422);
        }

        $program = Program::updateOrCreate(
            ['id' => $payload['id']],
            [
                'title' => $payload['title'],
                'description' => $payload['description'],
                'school_id' => $payload['schoolId'],
                'department_id' => $payload['departmentId'] ?? null,
                'qualification_level_id' => $level->id,
                'credits' => $payload['credits'] ?? $level->default_credits,
                'duration_months' => $payload['durationMonths'] ?? $level->duration_months,
                'admission_requirements' => $payload['admissionRequirements'] ?? $level->admission_requirements,
                'required_subjects' => $this->normalizeRequiredSubjects($payload['requiredSubjects'] ?? []),
                'delivery_modes' => array_values($deliveryModes),
                'supported_delivery_modes' => DeliveryModes::normalizeMany($deliveryModes),
                'exam_clinic_required' => $payload['examClinicRequired'] ?? $level->requires_exam_clinic,
                'requires_accreditation_approval' => $requiresAccreditation,
                'accreditation_approved_at' => $accreditationApproved ? now() : null,
                'launch_status' => $launchStatus,
                'application_fee' => $payload['applicationFee'] ?? 0,
                'application_currency' => strtoupper($payload['applicationCurrency'] ?? 'ZMW'),
                'tuition_fee' => $payload['tuitionFee'] ?? 0,
                'tuition_currency' => strtoupper($payload['tuitionCurrency'] ?? 'ZMW'),
                'progress' => 0,
                'image_id' => $payload['imageId'] ?? null,
            ]
        );

        Cache::forget('catalog:programs');

        return $this->mapProgram($program->fresh(['qualificationLevel', 'department', 'school']));
    }

    public function updateProgram(Request $request, string $id)
    {
        $request->merge(['id' => $id] + $request->all());
        return $this->createProgram($request);
    }

    public function createCourse(Request $request)
    {
        $payload = $request->validate([
            'id' => ['nullable', 'string'],
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'schoolId' => ['required', 'string', 'exists:schools,id'],
            'certificateType' => ['nullable', 'string'],
            'pricingType' => ['nullable', 'in:free,paid'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'certificateFee' => ['nullable', 'numeric', 'min:0'],
            'certificateCurrency' => ['nullable', 'string', 'size:3'],
            'durationHours' => ['nullable', 'integer', 'min:0'],
            'level' => ['nullable', 'string'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'imageId' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,published'],
            'modules' => ['nullable', 'array'],
            'modules.*.title' => ['required_with:modules', 'string'],
            'lessons' => ['nullable', 'array'],
            'lessons.*.title' => ['required_with:lessons', 'string'],
            'outcomes' => ['nullable', 'array'],
            'outcomes.*' => ['string'],
        ]);

        $status = $payload['status'] ?? 'draft';
        $moduleCount = count($payload['modules'] ?? []);
        $lessonCount = count($payload['lessons'] ?? []);
        $outcomeCount = count($payload['outcomes'] ?? []);
        if (!empty($payload['id'])) {
            $existing = Course::withCount('lessons')->find($payload['id']);
            if ($existing) {
                $lessonCount = max($lessonCount, (int) $existing->lessons_count);
            }
        }
        if ($status === 'published' && ($moduleCount < 1 || $lessonCount < 1 || $outcomeCount < 1)) {
            return response()->json([
                'message' => 'Published short courses require at least 1 module, 1 lesson and 1 learning outcome.',
                'errors' => [
                    'modules' => $moduleCount < 1 ? ['Add at least one module.'] : [],
                    'lessons' => $lessonCount < 1 ? ['Add at least one lesson.'] : [],
                    'outcomes' => $outcomeCount < 1 ? ['Add at least one learning outcome.'] : [],
                ],
            ], 422);
        }

        $course = Course::updateOrCreate(
            ['id' => $payload['id'] ?? $this->slug($payload['title'])],
            [
                'title' => $payload['title'],
                'description' => $payload['description'],
                'school_id' => $payload['schoolId'],
                'certificate_type' => $payload['certificateType'] ?? 'certificate',
                'pricing_type' => $payload['pricingType'] ?? 'paid',
                'price' => $payload['price'] ?? 50,
                'currency' => strtoupper($payload['currency'] ?? 'ZMW'),
                'certificate_fee' => $payload['certificateFee'] ?? 15,
                'certificate_currency' => strtoupper($payload['certificateCurrency'] ?? 'USD'),
                'duration_hours' => $payload['durationHours'] ?? 0,
                'level' => $payload['level'] ?? 'beginner',
                'progress' => $payload['progress'] ?? 0,
                'image_id' => $payload['imageId'] ?? null,
                'status' => $status,
            ]
        );

        $this->forgetCourseCaches($course->id);

        return $this->mapCourse($course);
    }

    public function updateCourse(Request $request, string $id)
    {
        $request->merge(['id' => $id] + $request->all());
        return $this->createCourse($request);
    }

    public function deleteSchool(string $id)
    {
        $courseIds = Course::where('school_id', $id)->pluck('id');
        School::where('id', $id)->delete();
        Course::where('school_id', $id)->delete();
        Program::where('school_id', $id)->delete();

        Cache::forget('catalog:schools');
        Cache::forget('catalog:courses');
        foreach ($courseIds as $courseId) {
            $this->forgetCourseCaches($courseId);
        }

        return response()->noContent();
    }

    public function deleteProgram(string $id)
    {
        Program::where('id', $id)->delete();
        Cache::forget('catalog:programs');
        return response()->noContent();
    }

    public function deleteCourse(string $id)
    {
        Course::where('id', $id)->delete();
        $this->forgetCourseCaches($id);

        return response()->noContent();
    }

    private function mapProgram(Program $program): array
    {
        return [
            'id' => $program->id,
            'title' => $program->title,
            'description' => $program->description,
            'schoolId' => $program->school_id,
            'schoolName' => $program->school?->name,
            'departmentId' => $program->department_id,
            'departmentName' => $program->department?->name,
            'qualificationLevelId' => $program->qualification_level_id,
            'qualificationLevel' => $program->qualificationLevel ? $this->mapQualificationLevel($program->qualificationLevel) : null,
            'credits' => $program->credits,
            'durationMonths' => $program->duration_months,
            'admissionRequirements' => $program->admission_requirements,
            'requiredSubjects' => $program->required_subjects ?? [],
            'deliveryModes' => DeliveryModes::normalizeMany($program->delivery_modes),
            'examClinicRequired' => (bool) $program->exam_clinic_required,
            'requiresAccreditationApproval' => (bool) $program->requires_accreditation_approval,
            'accreditationApprovedAt' => optional($program->accreditation_approved_at)->toISOString(),
            'launchStatus' => $program->launch_status,
            'applicationFee' => $program->application_fee ?? 0,
            'applicationCurrency' => $program->application_currency ?? 'ZMW',
            'tuitionFee' => $program->tuition_fee ?? 0,
            'tuitionCurrency' => $program->tuition_currency ?? 'ZMW',
            'progress' => $program->progress,
            'imageId' => $program->image_id,
            'awardType' => $program->award_type,
            'qualificationLevelName' => $program->qualification_level,
            'durationSemesters' => $program->duration_semesters,
            'totalCredits' => $program->total_credits,
            'deliveryMode' => $program->delivery_mode,
            'supportedDeliveryModes' => DeliveryModes::normalizeMany($program->supported_delivery_modes),
            'modules' => [],
        ];
    }

    private function mapSchool(School $school): array
    {
        return [
            'id' => $school->id,
            'name' => $school->name,
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
            'certificateFee' => $course->certificate_fee ?? 15,
            'certificateCurrency' => $course->certificate_currency ?? 'USD',
            'durationHours' => $course->duration_hours,
            'level' => $course->level,
            'status' => $course->status ?? 'draft',
        ];
    }

    private function slug(string $value): string
    {
        return trim(strtolower(preg_replace('/[^a-z0-9]+/i', '-', $value)), '-');
    }

    private function normalizeRequiredSubjects(array $subjects): array
    {
        return collect($subjects)
            ->map(function ($subject) {
                $name = trim((string) ($subject['subjectName'] ?? ''));
                if ($name === '') {
                    return null;
                }

                return [
                    'subjectId' => $subject['subjectId'] ?? $this->slug($name),
                    'subjectName' => $name,
                    'minimumPoints' => isset($subject['minimumPoints']) ? (int) $subject['minimumPoints'] : null,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function forgetCourseCaches(string $courseId): void
    {
        Cache::forget('catalog:courses');
        Cache::forget("catalog:course:{$courseId}");
        Cache::forget("catalog:course:{$courseId}:lessons");
        Cache::forget("catalog:course:{$courseId}:exam");
    }

    private function mapQualificationLevel(QualificationLevel $level): array
    {
        return [
            'id' => $level->id,
            'name' => $level->name,
            'category' => $level->category,
            'defaultCredits' => $level->default_credits,
            'minimumCredits' => $level->minimum_credits,
            'maximumCredits' => $level->maximum_credits,
            'durationMonths' => $level->duration_months,
            'admissionRequirements' => $level->admission_requirements,
            'allowedDeliveryModes' => $level->allowed_delivery_modes ?? [],
            'requiresExamClinic' => (bool) $level->requires_exam_clinic,
            'requiresAccreditationApproval' => (bool) $level->requires_accreditation_approval,
            'minimumSubjectCount' => $level->minimum_subject_count,
            'minimumTotalPoints' => $level->minimum_total_points,
            'requiredPriorQualification' => $level->required_prior_qualification,
        ];
    }
}
