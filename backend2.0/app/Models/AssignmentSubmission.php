<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends Model
{
    protected $fillable = [
        'assignment_id',
        'student_id',
        'attempt_no',
        'submitted_at',
        'content',
        'attachment_url',
        'status',
        'grade',
        'percentage',
        'feedback',
        'rubric_scores',
        'reviewed_by',
        'moderation_status',
        'released_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'released_at' => 'datetime',
        'grade' => 'decimal:2',
        'percentage' => 'decimal:2',
        'rubric_scores' => 'array',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class, 'assignment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
