<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicModule extends Model
{
    protected $table = 'modules';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'programme_id',
        'curriculum_version_id',
        'department_id',
        'code',
        'title',
        'description',
        'credits',
        'semester',
        'level',
        'is_core',
        'status',
    ];

    protected $casts = [
        'credits' => 'integer',
        'semester' => 'integer',
        'level' => 'integer',
        'is_core' => 'boolean',
    ];

    public function programme(): BelongsTo
    {
        return $this->belongsTo(Programme::class);
    }

    public function curriculumVersion(): BelongsTo
    {
        return $this->belongsTo(CurriculumVersion::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class, 'module_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'module_id');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class, 'module_id');
    }

    public function legacyProgramModules(): HasMany
    {
        return $this->hasMany(ProgramModule::class, 'module_id');
    }
}
