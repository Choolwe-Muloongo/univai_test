<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletSetting extends Model
{
    protected $fillable = [
        'user_id',
        'wallet_address',
        'payout_currency',
        'status',
    ];
}
