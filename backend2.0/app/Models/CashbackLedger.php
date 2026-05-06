<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashbackLedger extends Model
{
    public const STATUS_LOCKED = 'locked';
    public const STATUS_EARNED = 'earned';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';

    public const SOURCE_PREMIUM_SUBSCRIPTION = 'premium_subscription';
    public const SOURCE_PROGRAMME_TUITION = 'programme_tuition';
    public const SOURCE_ALUMNI_CAMPAIGN = 'alumni_campaign';
    public const SOURCE_FINANCE_PROMOTION = 'finance_promotion';

    public const ELIGIBLE_SOURCES = [
        self::SOURCE_PREMIUM_SUBSCRIPTION,
        self::SOURCE_PROGRAMME_TUITION,
        self::SOURCE_ALUMNI_CAMPAIGN,
        self::SOURCE_FINANCE_PROMOTION,
    ];

    protected $fillable = [
        'user_id',
        'invoice_id',
        'payment_id',
        'source',
        'status',
        'amount',
        'currency',
        'description',
        'eligible_basis',
        'locked_at',
        'earned_at',
        'approved_at',
        'paid_at',
        'cancelled_at',
        'expired_at',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'locked_at' => 'datetime',
        'earned_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expired_at' => 'datetime',
        'expires_at' => 'datetime',
        'eligible_basis' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
