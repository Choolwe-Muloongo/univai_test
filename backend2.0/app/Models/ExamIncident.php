<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamIncident extends Model
{
    protected $fillable = ['exam_session_id', 'exam_booking_id', 'severity', 'category', 'description', 'status', 'reported_by', 'actions'];
    protected $casts = ['actions' => 'array'];
    public function session(): BelongsTo { return $this->belongsTo(ExamSession::class, 'exam_session_id'); }
    public function booking(): BelongsTo { return $this->belongsTo(ExamBooking::class, 'exam_booking_id'); }
}
