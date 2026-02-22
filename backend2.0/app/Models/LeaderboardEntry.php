<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaderboardEntry extends Model
{
    protected $fillable = [
        'rank',
        'name',
        'avatar',
        'school',
        'points',
    ];
}
