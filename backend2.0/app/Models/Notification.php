<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'recipient_email',
        'recipient_name',
        'type',
        'category',
        'title',
        'message',
        'action_url',
        'priority',
        'channels',
        'data',
        'notifiable_type',
        'notifiable_id',
        'read_at',
        'sent_at',
    ];

    protected $casts = [
        'channels' => 'array',
        'data' => 'array',
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }
}
