<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlumniDiscountCampaign extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'discount_type',
        'discount_value',
        'starts_at',
        'ends_at',
        'previous_programme_levels',
        'new_programme_levels',
        'requires_good_standing',
        'requires_payment_clearance',
        'blocks_suspended_alumni',
        'automatic',
        'requires_admin_approval',
        'is_active',
        'max_uses',
        'uses_count',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'starts_at' => 'date',
        'ends_at' => 'date',
        'previous_programme_levels' => 'array',
        'new_programme_levels' => 'array',
        'requires_good_standing' => 'boolean',
        'requires_payment_clearance' => 'boolean',
        'blocks_suspended_alumni' => 'boolean',
        'automatic' => 'boolean',
        'requires_admin_approval' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(AlumniDiscountApplication::class, 'campaign_id');
    }
}
