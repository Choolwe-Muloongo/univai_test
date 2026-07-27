<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchGrant extends Model
{
    protected $fillable = [
        'owner_id',
        'lab_id',
        'title',
        'funder',
        'amount',
        'currency',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
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
