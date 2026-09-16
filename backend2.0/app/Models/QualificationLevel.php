<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualificationLevel extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'category',
        'default_credits',
        'minimum_credits',
        'maximum_credits',
        'duration_months',
        'admission_requirements',
        'allowed_delivery_modes',
        'requires_exam_clinic',
        'requires_accreditation_approval',
        'minimum_subject_count',
        'minimum_total_points',
        'required_prior_qualification',
        'sort_order',
    ];

    protected $casts = [
        'allowed_delivery_modes' => 'array',
        'requires_exam_clinic' => 'boolean',
        'requires_accreditation_approval' => 'boolean',
    ];

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    /**
     * The camelCase shape the API exposes for a qualification level. Kept on the model so
     * the programme payload and the admin catalogue cannot drift apart.
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'defaultCredits' => $this->default_credits,
            'minimumCredits' => $this->minimum_credits,
            'maximumCredits' => $this->maximum_credits,
            'durationMonths' => $this->duration_months,
            'admissionRequirements' => $this->admission_requirements,
            'allowedDeliveryModes' => $this->allowed_delivery_modes ?? [],
            'requiresExamClinic' => (bool) $this->requires_exam_clinic,
            'requiresAccreditationApproval' => (bool) $this->requires_accreditation_approval,
            'minimumSubjectCount' => $this->minimum_subject_count,
            'minimumTotalPoints' => $this->minimum_total_points,
            'requiredPriorQualification' => $this->required_prior_qualification,
        ];
    }
}
