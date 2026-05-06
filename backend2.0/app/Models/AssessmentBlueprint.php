<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentBlueprint extends Model
{
    protected $fillable = [
        'module_id',
        'title',
        'description',
        'total_weight',
        'pass_mark',
        'max_attempts',
        'pass_rules',
        'exam_clinic_rules',
        'moderation_rules',
        'result_release_rules',
        'progression_rules',
        'certificate_rules',
        'graduation_rules',
        'status',
        'created_by',
    ];

    protected $casts = [
        'total_weight' => 'decimal:2',
        'pass_mark' => 'decimal:2',
        'pass_rules' => 'array',
        'exam_clinic_rules' => 'array',
        'moderation_rules' => 'array',
        'result_release_rules' => 'array',
        'progression_rules' => 'array',
        'certificate_rules' => 'array',
        'graduation_rules' => 'array',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function components(): HasMany
    {
        return $this->hasMany(AssessmentComponent::class)->orderBy('sort_order')->orderBy('id');
    }
}
