<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompletedProgramme extends Model
{
    protected $fillable = [
        'user_id',
        'program_id',
        'program_level',
        'status',
        'final_standing',
        'payment_cleared',
        'completed_at',
        'metadata',
    ];

    protected $casts = [
        'payment_cleared' => 'boolean',
        'completed_at' => 'date',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
