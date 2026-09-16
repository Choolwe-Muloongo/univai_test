<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\QualificationLevel;
use App\Support\DeliveryModes;
use Illuminate\Http\Request;

class ProgramsController extends Controller
{
    public function index()
    {
        return Program::query()
            ->with(['qualificationLevel', 'department', 'school'])
            ->orderBy('title')
            ->get()
            ->map(fn (Program $program) => $this->mapProgram($program));
    }

    public function updateDeliveryModes(Request $request, Program $program)
    {
        $payload = $request->validate([
            'supportedDeliveryModes' => ['required', 'array', 'min:1'],
            'supportedDeliveryModes.*' => ['string'],
        ]);

        $program->update([
            'supported_delivery_modes' => DeliveryModes::normalizeMany($payload['supportedDeliveryModes']),
        ]);

        return $this->mapProgram($program);
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
            'deliveryModes' => $program->delivery_modes ?? [],
            'examClinicRequired' => (bool) $program->exam_clinic_required,
            'requiresAccreditationApproval' => (bool) $program->requires_accreditation_approval,
            'accreditationApprovedAt' => optional($program->accreditation_approved_at)->toISOString(),
            'launchStatus' => $program->launch_status,
            'progress' => $program->progress,
            'imageId' => $program->image_id,
            'awardType' => $program->award_type,
            'qualificationLevelName' => $program->qualification_level,
            'durationSemesters' => $program->duration_semesters,
            'totalCredits' => $program->total_credits,
            'deliveryMode' => $program->delivery_mode,
            'supportedDeliveryModes' => DeliveryModes::normalizeMany($program->supported_delivery_modes),
        ];
    }

    private function mapQualificationLevel(QualificationLevel $level): array
    {
        return $level->toApiArray();
    }
}
