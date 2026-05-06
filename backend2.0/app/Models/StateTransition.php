<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StateTransition extends Model
{
    protected $fillable = [
        'subject_type',
        'subject_id',
        'state_field',
        'previous_state',
        'new_state',
        'trigger',
        'actor_id',
        'actor_type',
        'actor_role',
        'actor_label',
        'reason',
        'metadata',
        'notification_status',
        'notification_channel',
        'notification_recipient',
        'notification_error',
        'appeal_option',
        'reapply_option',
    ];

    protected $casts = [
        'metadata' => 'array',
        'appeal_option' => 'array',
        'reapply_option' => 'array',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
