<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'user_id',
        'reference',
        'full_name',
        'email',
        'program_id',
        'intake_id',
        'school_id',
        'status',
        'submitted_at',
        'subject_points',
        'subject_count',
        'total_points',
        'delivery_mode',
        'learning_style',
        'study_pace',
        'country',
        'notes',
        'offer_letter_message',
        'offer_letter_url',
        'offer_issued_at',
        'offer_accepted_at',
        'needs_info_message',
        'needs_info_at',
        'admission_fee_paid',
        'premium_requirements',
        'premium_requirement_status',
        'review_started_at',
        'entitlements_activated_at',
        'enrolled_at',
    ];

    protected $casts = [
        'subject_points' => 'array',
        'admission_fee_paid' => 'boolean',
        'premium_requirements' => 'array',
        'submitted_at' => 'datetime',
        'offer_issued_at' => 'datetime',
        'offer_accepted_at' => 'datetime',
        'needs_info_at' => 'datetime',
        'review_started_at' => 'datetime',
        'entitlements_activated_at' => 'datetime',
        'enrolled_at' => 'datetime',
    ];
}
