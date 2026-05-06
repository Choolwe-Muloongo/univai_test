<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    protected $fillable = [
        'module_id',
        'course_id',
        'assessment_component_id',
        'title',
        'description',
        'instructions',
        'assignment_type',
        'max_points',
        'weight',
        'pass_mark',
        'max_attempts',
        'rubric',
        'due_date',
        'status',
        'moderation_status',
        'results_release_at',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'results_release_at' => 'datetime',
        'weight' => 'decimal:2',
        'pass_mark' => 'decimal:2',
        'rubric' => 'array',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(AssessmentComponent::class, 'assessment_component_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class, 'assignment_id');
    }
}
