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
        'certificate_fee_paid',
        'exam_score',
        'completed_at',
        'certificate_issued_at',
        'certificate_path',
    ];

    protected $casts = [
        'entry_fee_paid' => 'boolean',
        'certificate_fee_paid' => 'boolean',
        'exam_score' => 'decimal:2',
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
}
