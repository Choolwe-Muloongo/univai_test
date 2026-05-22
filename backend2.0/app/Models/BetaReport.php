<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BetaReport extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'source',
        'severity',
        'status',
        'title',
        'description',
        'page_url',
        'browser',
        'device',
        'error_name',
        'error_message',
        'stack_trace',
        'context',
        'resolved_at',
        'resolved_by',
    ];

    protected $casts = [
        'context' => 'array',
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
