<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamQuestion extends Model
{
    protected $fillable = [
        'course_id',
        'semester',
        'question_bank_id',
        'question',
        'options',
        'answer',
        'difficulty',
        'outcomes',
    ];

    protected $casts = [
        'options' => 'array',
        'outcomes' => 'array',
    ];
}
