<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResultsSyncLog extends Model
{
    protected $fillable = ['exam_session_id', 'status', 'records_synced', 'message', 'synced_at', 'triggered_by'];
    protected $casts = ['synced_at' => 'datetime'];
    public function session(): BelongsTo { return $this->belongsTo(ExamSession::class, 'exam_session_id'); }
}
