<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouteChangeRequest extends Model
{
    protected $fillable = [
        'student_id',
        'current_intake_id',
        'requested_intake_id',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function currentIntake(): BelongsTo
    {
        return $this->belongsTo(Intake::class, 'current_intake_id');
    }

    public function requestedIntake(): BelongsTo
    {
        return $this->belongsTo(Intake::class, 'requested_intake_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
