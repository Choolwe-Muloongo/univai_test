<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliatePayoutItem extends Model
{
    protected $fillable = [
        'payout_id',
        'affiliate_earning_id',
        'allocated_amount',
        'status',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
    ];

    public function payout(): BelongsTo
    {
        return $this->belongsTo(AffiliatePayout::class, 'payout_id');
    }

    public function earning(): BelongsTo
    {
        return $this->belongsTo(AffiliateEarning::class, 'affiliate_earning_id');
    }
}
