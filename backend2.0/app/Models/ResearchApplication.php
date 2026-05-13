<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchApplication extends Model
{
    protected $fillable = [
        'research_id',
        'full_name',
        'email',
        'experience',
        'availability',
        'status',
    ];
}
