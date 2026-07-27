<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchPublication extends Model
{
    protected $fillable = [
        'owner_id',
        'lab_id',
        'title',
        'authors',
        'venue',
        'published_at',
        'link',
        'status',
    ];

    protected $casts = [
        'published_at' => 'date',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function lab(): BelongsTo
    {
        return $this->belongsTo(ResearchLab::class, 'lab_id');
    }
}
