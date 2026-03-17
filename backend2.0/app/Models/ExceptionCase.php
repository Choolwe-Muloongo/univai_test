<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExceptionCase extends Model
{
    public const STATUSES = [
        'open',
        'under_review',
        'approved_override',
        'rejected',
        'closed',
    ];

    protected $fillable = [
        'exceptionable_type',
        'exceptionable_id',
        'exception_type',
        'reason_code',
        'evidence_attachments',
        'escalation_target_type',
        'escalation_target_id',
        'approval_chain',
        'expiry_rollback_condition',
        'status',
        'created_by',
        'updated_by',
        'closed_at',
    ];

    protected $casts = [
        'evidence_attachments' => 'array',
        'approval_chain' => 'array',
        'closed_at' => 'datetime',
    ];
}
