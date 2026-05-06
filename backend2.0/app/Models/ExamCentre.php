<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamCentre extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'name',
        'address',
        'city',
        'country',
        'timezone',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function cohorts(): HasMany
    {
        return $this->hasMany(Cohort::class);
    }
}
