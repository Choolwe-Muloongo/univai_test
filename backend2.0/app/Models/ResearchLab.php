<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResearchLab extends Model
{
    protected $fillable = [
        'owner_id',
        'title',
        'description',
        'focus_area',
        'status',
        'collaborators',
    ];

    protected $casts = [
        'collaborators' => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function grants(): HasMany
    {
        return $this->hasMany(ResearchGrant::class, 'lab_id');
    }

    public function publications(): HasMany
    {
        return $this->hasMany(ResearchPublication::class, 'lab_id');
    }
}
