<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'provider',
        'last4',
        'expiry_month',
        'expiry_year',
        'is_default',
        'status',
    ];
}
