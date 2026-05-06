<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchApplication extends Model
{
    protected $fillable = [
        'student_id',
        'research_id',
        'full_name',
        'email',
        'experience',
        'availability',
        'status',
    ];
}
