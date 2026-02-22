<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramModule extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'program_id',
        'curriculum_version_id',
        'title',
        'description',
        'credits',
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
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculumVersion(): BelongsTo
    {
        return $this->belongsTo(CurriculumVersion::class, 'curriculum_version_id');
    }
}
