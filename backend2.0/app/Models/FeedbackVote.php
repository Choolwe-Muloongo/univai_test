<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackVote extends Model
{
    protected $fillable = [
        'feedback_post_id',
        'user_key',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(FeedbackPost::class, 'feedback_post_id');
    }
}
