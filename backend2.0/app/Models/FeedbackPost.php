<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeedbackPost extends Model
{
    protected $fillable = [
        'user_key',
        'author_name',
        'author_email',
        'type',
        'title',
        'body',
        'rating',
        'status',
        'admin_response',
        'duplicate_of',
        'upvotes_count',
        'comments_count',
    ];

    protected $casts = [
        'rating' => 'integer',
        'upvotes_count' => 'integer',
        'comments_count' => 'integer',
    ];

    public function votes(): HasMany
    {
        return $this->hasMany(FeedbackVote::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(FeedbackComment::class);
    }
}
