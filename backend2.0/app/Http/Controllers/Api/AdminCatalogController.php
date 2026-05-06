<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Program;
use App\Models\QualificationLevel;
use App\Models\School;
use Illuminate\Http\Request;

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
            'name' => ['required', 'string', 'min:2'],
        ]);

        $id = strtolower(preg_replace('/\s+/', '-', $payload['name']));
        $school = School::updateOrCreate(
            ['id' => $id],
            ['name' => $payload['name']]
        );

        return [
            'id' => $school->id,
            'name' => $school->name,
        ];
    }

    public function createProgram(Request $request)
    {
        $payload = $request->validate([
            'id' => ['required', 'string'],
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'schoolId' => ['required', 'string'],
            'qualificationLevelId' => ['required', 'string', 'exists:qualification_levels,id'],
            'credits' => ['nullable', 'integer', 'min:0'],
            'durationMonths' => ['nullable', 'integer', 'min:1'],
            'admissionRequirements' => ['nullable', 'string'],
            'deliveryModes' => ['nullable', 'array'],
            'deliveryModes.*' => ['string'],
            'examClinicRequired' => ['nullable', 'boolean'],
            'requiresAccreditationApproval' => ['nullable', 'boolean'],
            'accreditationApproved' => ['nullable', 'boolean'],
            'launchStatus' => ['nullable', 'string'],
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
                'qualification_level_id' => $level->id,
                'credits' => $payload['credits'] ?? $level->default_credits,
                'duration_months' => $payload['durationMonths'] ?? $level->duration_months,
                'admission_requirements' => $payload['admissionRequirements'] ?? $level->admission_requirements,
                'delivery_modes' => array_values($deliveryModes),
                'exam_clinic_required' => $payload['examClinicRequired'] ?? $level->requires_exam_clinic,
                'requires_accreditation_approval' => $requiresAccreditation,
                'accreditation_approved_at' => $accreditationApproved ? now() : null,
                'launch_status' => $launchStatus,
                'progress' => 0,
                'image_id' => $payload['imageId'] ?? null,
            ]
        );

        return $this->mapProgram($program->load('qualificationLevel'));
    }

    public function createCourse(Request $request)
    {
        return $this->createProgram($request);
    }

    public function deleteSchool(string $id)
    {
        School::where('id', $id)->delete();
        Course::where('school_id', $id)->delete();
        Program::where('school_id', $id)->delete();

        return response()->noContent();
    }

    public function deleteProgram(string $id)
    {
        Program::where('id', $id)->delete();
        return response()->noContent();
    }

    public function deleteCourse(string $id)
    {
        return $this->deleteProgram($id);
    }

    private function mapProgram(Program $program): array
    {
        return [
            'id' => $program->id,
            'title' => $program->title,
            'description' => $program->description,
            'schoolId' => $program->school_id,
            'qualificationLevelId' => $program->qualification_level_id,
            'qualificationLevel' => $program->qualificationLevel ? $this->mapQualificationLevel($program->qualificationLevel) : null,
            'credits' => $program->credits,
            'durationMonths' => $program->duration_months,
            'admissionRequirements' => $program->admission_requirements,
            'deliveryModes' => $program->delivery_modes ?? [],
            'examClinicRequired' => (bool) $program->exam_clinic_required,
            'requiresAccreditationApproval' => (bool) $program->requires_accreditation_approval,
            'accreditationApprovedAt' => optional($program->accreditation_approved_at)->toISOString(),
            'launchStatus' => $program->launch_status,
            'progress' => $program->progress,
            'imageId' => $program->image_id,
            'modules' => [],
        ];
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
