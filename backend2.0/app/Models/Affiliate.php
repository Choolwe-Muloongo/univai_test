<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Affiliate extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'display_name',
        'scope',
        'status',
        'tier',
        'formal_programme_rate',
        'short_course_rate',
        'lenco_account_id',
        'payout_phone',
        'payout_operator',
        'payout_country',
        'notes',
        'application_reason',
        'promotion_channels',
        'approved_at',
        'rejected_at',
        'terms_accepted_at',
        'recurring_commission_enabled',
        'recurring_months',
        'auto_payout_enabled',
        'auto_payout_daily_limit',
        'last_tier_reviewed_at',
    ];

    protected $casts = [
        'formal_programme_rate' => 'decimal:2',
        'short_course_rate' => 'decimal:2',
        'promotion_channels' => 'array',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'terms_accepted_at' => 'datetime',
        'recurring_commission_enabled' => 'boolean',
        'auto_payout_enabled' => 'boolean',
        'auto_payout_daily_limit' => 'decimal:2',
        'last_tier_reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(AffiliateReferral::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(AffiliateEarning::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(AffiliatePayout::class);
    }
}
