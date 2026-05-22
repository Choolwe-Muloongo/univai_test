<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = [
        'lenco_collections_enabled',
        'payment_mode',
        'show_test_payments_in_admin',
        'test_mode_message',
        'updated_by',
    ];

    protected $casts = [
        'lenco_collections_enabled' => 'boolean',
        'show_test_payments_in_admin' => 'boolean',
    ];
}
