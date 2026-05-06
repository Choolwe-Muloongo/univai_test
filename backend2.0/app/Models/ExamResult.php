<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamResult extends Model
{
    protected $fillable = [
        'user_id',
        'exam_id',
        'module_id',
        'assessment_component_id',
        'attempt_no',
        'score',
        'status',
        'exam_booking_confirmed',
        'exam_clinic_completed_at',
        'moderation_status',
        'released_at',
        'result',
    ];

    protected $casts = [
        'result' => 'array',
        'score' => 'decimal:2',
        'exam_booking_confirmed' => 'boolean',
        'exam_clinic_completed_at' => 'datetime',
        'released_at' => 'datetime',
    ];
}
