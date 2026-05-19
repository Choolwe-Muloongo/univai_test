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
        'formal_programme_rate',
        'short_course_rate',
        'lenco_account_id',
        'payout_phone',
        'payout_operator',
        'payout_country',
        'notes',
        'approved_at',
    ];

    protected $casts = [
        'formal_programme_rate' => 'decimal:2',
        'short_course_rate' => 'decimal:2',
        'approved_at' => 'datetime',
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
