<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Programme extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'school_id',
        'department_id',
        'qualification_level_id',
        'code',
        'title',
        'description',
        'status',
        'duration_months',
    ];

    protected $casts = [
        'duration_months' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function qualificationLevel(): BelongsTo
    {
        return $this->belongsTo(QualificationLevel::class);
    }

    public function curriculumVersions(): HasMany
    {
        return $this->hasMany(CurriculumVersion::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(AcademicModule::class, 'programme_id');
    }

    public function cohorts(): HasMany
    {
        return $this->hasMany(Cohort::class);
    }

    public function legacyPrograms(): HasMany
    {
        return $this->hasMany(Program::class, 'programme_id');
    }

    public function legacyCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'programme_id');
    }
}
