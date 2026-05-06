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
        'supported_delivery_modes' => 'array',
    ];

    protected $casts = [
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
