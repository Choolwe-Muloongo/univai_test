<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliatePayout extends Model
{
    protected $fillable = [
        'affiliate_id',
        'reference',
        'amount',
        'fee',
        'currency',
        'method',
        'phone',
        'operator',
        'country',
        'status',
        'requested_by',
        'approved_by',
        'lenco_reference',
        'lenco_payload',
        'failure_reason',
        'requested_at',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'lenco_payload' => 'array',
        'requested_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function getProviderReferenceAttribute(): ?string
    {
        return $this->lenco_reference;
    }

    public function getPaidAtAttribute()
    {
        return $this->completed_at;
    }

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(Affiliate::class);
    }
}
