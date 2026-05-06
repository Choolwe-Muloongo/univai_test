<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentBooking extends Model
{
    protected $fillable = [
        'assessment_component_id',
        'student_id',
        'booked_for',
        'status',
        'clinic_completed_at',
        'metadata',
    ];

    protected $casts = [
        'booked_for' => 'datetime',
        'clinic_completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function component(): BelongsTo
    {
        return $this->belongsTo(AssessmentComponent::class, 'assessment_component_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
