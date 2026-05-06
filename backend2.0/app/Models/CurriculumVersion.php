<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumVersion extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'program_id',
        'programme_id',
        'code',
        'name',
        'status',
        'published_at',
        'effective_from',
        'effective_to',
        'is_current',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_current' => 'boolean',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function programme(): BelongsTo
    {
        return $this->belongsTo(Programme::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(ProgramModule::class, 'curriculum_version_id');
    }

    public function academicModules(): HasMany
    {
        return $this->hasMany(AcademicModule::class, 'curriculum_version_id');
    }

    public function cohorts(): HasMany
    {
        return $this->hasMany(Cohort::class);
    }
}
