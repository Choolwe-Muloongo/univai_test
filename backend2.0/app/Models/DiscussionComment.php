<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscussionComment extends Model
{
    protected $fillable = [
        'discussion_id',
        'author',
        'avatar',
        'content',
        'upvotes',
    ];

    public function discussion(): BelongsTo
    {
        return $this->belongsTo(Discussion::class);
    }
}
