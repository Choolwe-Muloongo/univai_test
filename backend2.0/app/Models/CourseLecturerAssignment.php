<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseLecturerAssignment extends Model
{
    protected $fillable = [
        'course_id',
        'module_id',
        'lecturer_id',
        'intake_id',
        'role',
        'assigned_by',
        'meeting_provider',
        'meeting_url',
        'meeting_schedule',
        'meeting_notes',
    ];

    protected $casts = [
        'meeting_schedule' => 'array',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function intake(): BelongsTo
    {
        return $this->belongsTo(Intake::class);
    }

    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
