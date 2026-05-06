<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryMode extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'name',
        'description',
        'requires_attendance',
    ];

    protected $casts = [
        'requires_attendance' => 'boolean',
    ];

    public function cohorts(): HasMany
    {
        return $this->hasMany(Cohort::class);
    }
}
