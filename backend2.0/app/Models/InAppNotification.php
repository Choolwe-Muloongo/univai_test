<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InAppNotification extends Model
{
    protected $fillable = [
        'user_key',
        'type',
        'title',
        'body',
        'href',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
