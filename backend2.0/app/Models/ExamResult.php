<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamResult extends Model
{
    protected $fillable = [
        'user_id',
        'exam_id',
        'result',
    ];

    protected $casts = [
        'result' => 'array',
    ];
}
