<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentComponent extends Model
{
    protected $fillable = [
        'assessment_blueprint_id',
        'type',
        'title',
        'description',
        'weight',
        'pass_mark',
        'max_attempts',
        'requires_exam_booking',
        'requires_exam_clinic',
        'question_bank_id',
        'rubric',
        'grading_rules',
        'moderation_rules',
        'opens_at',
        'closes_at',
        'results_release_at',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'pass_mark' => 'decimal:2',
        'requires_exam_booking' => 'boolean',
        'requires_exam_clinic' => 'boolean',
        'rubric' => 'array',
        'grading_rules' => 'array',
        'moderation_rules' => 'array',
        'opens_at' => 'datetime',
        'closes_at' => 'datetime',
        'results_release_at' => 'datetime',
    ];

    public function blueprint(): BelongsTo
    {
        return $this->belongsTo(AssessmentBlueprint::class, 'assessment_blueprint_id');
    }

    public function questionBank(): BelongsTo
    {
        return $this->belongsTo(QuestionBank::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(AssessmentBooking::class);
    }
}
