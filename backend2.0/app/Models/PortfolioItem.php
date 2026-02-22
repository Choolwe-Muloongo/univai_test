<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioItem extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'link',
        'item_type',
        'status',
    ];
}
