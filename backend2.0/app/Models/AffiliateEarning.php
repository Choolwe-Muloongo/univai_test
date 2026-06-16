<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateEarning extends Model
{
    protected $fillable = [
        'affiliate_id',
        'referred_user_id',
        'payment_id',
        'invoice_id',
        'source_type',
        'source_reference',
        'gross_amount',
        'commission_rate',
        'commission_amount',
        'currency',
        'status',
        'metadata',
    ];

    protected $casts = [
        'gross_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(Affiliate::class);
    }

    public function payoutItems(): HasMany
    {
        return $this->hasMany(AffiliatePayoutItem::class, 'affiliate_earning_id');
    }
}
