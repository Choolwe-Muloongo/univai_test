<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppRating extends Model
{
    protected $fillable = [
        'user_key',
        'author_name',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];
}
