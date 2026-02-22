<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LecturerApplication extends Model
{
    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'department',
        'specialization',
        'highest_qualification',
        'years_experience',
        'program_interest',
        'documents',
        'status',
        'notes',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
    ];

    protected $casts = [
        'documents' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'years_experience' => 'integer',
    ];
}
