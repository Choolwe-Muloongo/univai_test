<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShortCourseEnrollment extends Model
{
    protected $fillable = [
        'student_id',
        'short_course_id',
        'status',
        'progress',
        'entry_fee_paid',
        'access_expires_at',
        'access_plan',
        'ai_plan',
        'ai_access_expires_at',
        'hourly_ai_quota',
        'daily_ai_quota',
        'certificate_included',
        'certificate_fee_paid',
        'exam_score',
        'completed_at',
        'certificate_issued_at',
        'certificate_path',
    ];

    protected $casts = [
        'entry_fee_paid' => 'boolean',
        'certificate_fee_paid' => 'boolean',
        'certificate_included' => 'boolean',
        'hourly_ai_quota' => 'integer',
        'daily_ai_quota' => 'integer',
        'exam_score' => 'decimal:2',
        'access_expires_at' => 'datetime',
        'ai_access_expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'certificate_issued_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'short_course_id');
    }

    public function hasActiveCourseAccess(): bool
    {
        return $this->entry_fee_paid && (!$this->access_expires_at || $this->access_expires_at->isFuture());
    }

    public function hasActiveAiAccess(): bool
    {
        return $this->hasActiveCourseAccess() && (!$this->ai_access_expires_at || $this->ai_access_expires_at->isFuture());
    }
}