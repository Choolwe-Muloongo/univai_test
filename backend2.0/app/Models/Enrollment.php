<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id',
        'intake_id',
        'selected_modules',
        'status',
        'standing',
        'probation_count',
        'enrolled_at',
        'confirmed_at',
        'last_reviewed_at',
    ];

    protected $casts = [
        'selected_modules' => 'array',
        'enrolled_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'last_reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function intake(): BelongsTo
    {
        return $this->belongsTo(Intake::class);
    }
}
