<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    protected $fillable = [
        'student_id',
        'job_id',
        'full_name',
        'email',
        'portfolio',
        'cover_letter',
        'status',
    ];
}
