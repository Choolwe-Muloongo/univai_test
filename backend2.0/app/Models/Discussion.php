<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discussion extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'author',
        'avatar',
        'snippet',
    ];

    public function comments(): HasMany
    {
        return $this->hasMany(DiscussionComment::class);
    }
}
