<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramPolicy extends Model
{
    protected $fillable = [
        'program_id',
        'policy_id',
    ];

    public function policy()
    {
        return $this->belongsTo(AcademicPolicy::class, 'policy_id');
    }
}
