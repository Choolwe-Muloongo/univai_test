<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgrammeCourse extends Model
{
    protected $fillable = [
        'program_id',
        'department_id',
        'course_id',
        'module_id',
        'academic_year_id',
        'semester_id',
        'year_level',
        'semester_number',
        'duration_type',
        'delivery_mode',
        'is_core',
        'credits',
        'status',
    ];

    protected $casts = [
        'year_level' => 'integer',
        'semester_number' => 'integer',
        'is_core' => 'boolean',
        'credits' => 'integer',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(CourseUnit::class);
    }
}
