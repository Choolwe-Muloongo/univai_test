<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmissionsSetting extends Model
{
    protected $fillable = [
        'is_open',
        'message',
        'lecturer_applications_open',
        'lecturer_applications_message',
        'updated_by',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'lecturer_applications_open' => 'boolean',
    ];
}
