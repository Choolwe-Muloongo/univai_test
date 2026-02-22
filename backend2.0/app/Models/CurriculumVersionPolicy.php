<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CurriculumVersionPolicy extends Model
{
    protected $fillable = [
        'curriculum_version_id',
        'policy_id',
    ];

    public function policy()
    {
        return $this->belongsTo(AcademicPolicy::class, 'policy_id');
    }
}
