<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamQuestion extends Model
{
    protected $fillable = [
        'course_id',
        'semester',
        'question',
        'options',
        'answer',
    ];

    protected $casts = [
        'options' => 'array',
    ];
}
