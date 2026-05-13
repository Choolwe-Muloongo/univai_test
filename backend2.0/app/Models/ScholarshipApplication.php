<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScholarshipApplication extends Model
{
    protected $fillable = [
        'user_id',
        'program_id',
        'statement',
        'status',
        'submitted_at',
        'reviewed_at',
        'decision_notes',
    ];
}
