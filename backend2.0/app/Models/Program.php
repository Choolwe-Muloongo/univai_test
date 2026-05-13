<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'school_id',
        'department_id',
        'qualification_level_id',
        'title',
        'description',
        'credits',
        'duration_months',
        'admission_requirements',
        'required_subjects',
        'delivery_modes',
        'exam_clinic_required',
        'requires_accreditation_approval',
        'accreditation_approved_at',
        'launch_status',
        'application_fee',
        'application_currency',
        'tuition_fee',
        'tuition_currency',
        'award_type',
        'qualification_level',
        'duration_semesters',
        'total_credits',
        'delivery_mode',
        'progress',
        'image_id',
        'supported_delivery_modes',
    ];

    protected $casts = [
        'delivery_modes' => 'array',
        'required_subjects' => 'array',
        'exam_clinic_required' => 'boolean',
        'requires_accreditation_approval' => 'boolean',
        'accreditation_approved_at' => 'datetime',
        'supported_delivery_modes' => 'array',
        'duration_months' => 'integer',
        'credits' => 'integer',
        'duration_semesters' => 'integer',
        'total_credits' => 'integer',
        'application_fee' => 'decimal:2',
        'tuition_fee' => 'decimal:2',
        'department_id' => 'integer',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(ProgramModule::class);
    }

    public function curriculumVersions(): HasMany
    {
        return $this->hasMany(CurriculumVersion::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function programmeCourses(): HasMany
    {
        return $this->hasMany(ProgrammeCourse::class);
    }

    public function qualificationLevel(): BelongsTo
    {
        return $this->belongsTo(QualificationLevel::class);
    }
}
