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
        'qualification_level_id',
        'title',
        'description',
        'credits',
        'duration_months',
        'admission_requirements',
        'delivery_modes',
        'exam_clinic_required',
        'requires_accreditation_approval',
        'accreditation_approved_at',
        'launch_status',
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
        'exam_clinic_required' => 'boolean',
        'requires_accreditation_approval' => 'boolean',
        'accreditation_approved_at' => 'datetime',
        'supported_delivery_modes' => 'array',
        'duration_months' => 'integer',
        'credits' => 'integer',
        'duration_semesters' => 'integer',
        'total_credits' => 'integer',
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

    public function qualificationLevel(): BelongsTo
    {
        return $this->belongsTo(QualificationLevel::class);
    }
}
