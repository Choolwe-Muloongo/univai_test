<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearcherApplication extends Model
{
    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'institution_affiliation',
        'research_area',
        'highest_qualification',
        'years_experience',
        'orcid_id',
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
