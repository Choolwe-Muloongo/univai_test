<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentEntitlement extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'status',
        'source',
        'metadata',
        'starts_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
