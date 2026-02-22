<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseAttempt extends Model
{
    protected $fillable = [
        'student_id',
        'module_id',
        'intake_id',
        'attempt_no',
        'final_percentage',
        'exam_score',
        'letter_grade',
        'grade_points',
        'credits_attempted',
        'credits_earned',
        'status',
        'result_status',
        'recorded_by',
    ];

    protected $casts = [
        'final_percentage' => 'decimal:2',
        'exam_score' => 'decimal:2',
        'grade_points' => 'decimal:2',
    ];

    public function module()
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
