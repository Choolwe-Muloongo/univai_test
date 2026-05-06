<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProgramModule extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'program_id',
        'curriculum_version_id',
        'code',
        'title',
        'description',
        'credits',
        'hours_per_week',
        'progress',
        'semester',
        'is_exam_available',
        'is_core',
        'track',
    ];

    protected $casts = [
        'is_exam_available' => 'boolean',
        'is_core' => 'boolean',
        'credits' => 'integer',
        'hours_per_week' => 'integer',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculumVersion(): BelongsTo
    {
        return $this->belongsTo(CurriculumVersion::class, 'curriculum_version_id');
    }

    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'program_module_lessons', 'program_module_id', 'lesson_id')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('program_module_lessons.sort_order');
    }
}
