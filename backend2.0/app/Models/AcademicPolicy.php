<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicPolicy extends Model
{
    protected $fillable = [
        'name',
        'pass_mark',
        'exam_minimum',
        'gpa_scale_type',
        'grade_bands',
        'repeat_rule',
        'max_attempts',
        'include_failed_in_gpa',
        'include_withdrawn_in_gpa',
        'credit_award_policy',
        'condoned_mark',
        'progression_policy',
        'holds_policy',
        'rounding_decimals',
    ];

    protected $casts = [
        'grade_bands' => 'array',
        'progression_policy' => 'array',
        'holds_policy' => 'array',
        'include_failed_in_gpa' => 'boolean',
        'include_withdrawn_in_gpa' => 'boolean',
    ];
}
