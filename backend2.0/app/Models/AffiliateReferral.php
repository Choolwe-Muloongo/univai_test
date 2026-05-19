<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateReferral extends Model
{
    protected $fillable = [
        'affiliate_id',
        'referred_user_id',
        'referral_code',
        'source_type',
        'source_reference',
        'first_paid_at',
        'metadata',
    ];

    protected $casts = [
        'first_paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(Affiliate::class);
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }
}
