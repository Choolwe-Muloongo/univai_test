<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseUnit extends Model
{
    protected $fillable = [
        'programme_course_id',
        'semester_id',
        'title',
        'description',
        'unit_number',
        'estimated_hours',
        'status',
    ];

    protected $casts = [
        'unit_number' => 'integer',
        'estimated_hours' => 'integer',
    ];

    public function programmeCourse(): BelongsTo
    {
        return $this->belongsTo(ProgrammeCourse::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }
}
