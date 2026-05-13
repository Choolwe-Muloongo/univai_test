<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
    protected $fillable = [
        'name',
        'type',
        'location',
        'capacity',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];
}
