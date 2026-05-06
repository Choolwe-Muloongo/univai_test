<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\QualificationLevel;

class ProgramsController extends Controller
{
    public function index()
    {
        return Program::query()
            ->with('qualificationLevel')
            ->orderBy('title')
            ->get()
            ->map(fn (Program $program) => [
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
                'awardType' => $program->award_type,
                'qualificationLevel' => $program->qualification_level,
                'durationSemesters' => $program->duration_semesters,
                'totalCredits' => $program->total_credits,
                'deliveryMode' => $program->delivery_mode,
            ]);
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
