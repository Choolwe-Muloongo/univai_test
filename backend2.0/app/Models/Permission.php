<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = [
        'key',
        'description',
        'requirements',
    ];

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
        ];
    }
}
