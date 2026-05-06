<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualificationLevel extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'category',
        'default_credits',
        'minimum_credits',
        'maximum_credits',
        'duration_months',
        'admission_requirements',
        'allowed_delivery_modes',
        'requires_exam_clinic',
        'requires_accreditation_approval',
        'minimum_subject_count',
        'minimum_total_points',
        'required_prior_qualification',
        'sort_order',
    ];

    protected $casts = [
        'allowed_delivery_modes' => 'array',
        'requires_exam_clinic' => 'boolean',
        'requires_accreditation_approval' => 'boolean',
    ];

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }
}
