<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamQuestion extends Model
{
    protected $fillable = [
        'course_id',
        'lesson_id',
        'semester',
        'question',
        'question_type',
        'options',
        'answer',
        'explanation',
        'difficulty',
        'time_seconds',
        'source',
        'tags',
    ];

    protected $casts = [
        'options' => 'array',
        'tags' => 'array',
        'time_seconds' => 'integer',
    ];
}