<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlumniDiscountApplication extends Model
{
    protected $fillable = [
        'campaign_id',
        'user_id',
        'intake_id',
        'invoice_id',
        'completed_programme_id',
        'previous_programme_level',
        'new_programme_id',
        'new_programme_level',
        'requested_discount_amount',
        'approved_discount_amount',
        'status',
        'eligibility_snapshot',
        'decision_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'requested_discount_amount' => 'decimal:2',
        'approved_discount_amount' => 'decimal:2',
        'eligibility_snapshot' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AlumniDiscountCampaign::class, 'campaign_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function completedProgramme(): BelongsTo
    {
        return $this->belongsTo(CompletedProgramme::class);
    }
}
