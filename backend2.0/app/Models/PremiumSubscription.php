<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PremiumSubscription extends Model
{
    public const STATUS_TRIAL = 'trial';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAST_DUE = 'past_due';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_SUSPENDED = 'suspended';

    public const STATUSES = [
        self::STATUS_TRIAL,
        self::STATUS_ACTIVE,
        self::STATUS_PAST_DUE,
        self::STATUS_EXPIRED,
        self::STATUS_CANCELLED,
        self::STATUS_SUSPENDED,
    ];

    protected $fillable = [
        'user_id',
        'payment_id',
        'status',
        'entitlements',
        'premium_features_unlocked',
        'entitlements_activated_at',
        'trial_ends_at',
        'current_period_ends_at',
        'past_due_at',
        'expired_at',
        'cancelled_at',
        'suspended_at',
        'cashback_amount',
        'cashback_currency',
        'cashback_status',
        'cashback_created_at',
    ];

    protected $casts = [
        'entitlements' => 'array',
        'premium_features_unlocked' => 'boolean',
        'entitlements_activated_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'current_period_ends_at' => 'datetime',
        'past_due_at' => 'datetime',
        'expired_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'suspended_at' => 'datetime',
        'cashback_amount' => 'decimal:2',
        'cashback_created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
