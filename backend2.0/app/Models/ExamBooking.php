<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamBooking extends Model
{
    protected $fillable = ['exam_session_id', 'student_id', 'student_name', 'student_email', 'status', 'accommodations', 'booked_at'];
    protected $casts = ['booked_at' => 'datetime'];
    public function session(): BelongsTo { return $this->belongsTo(ExamSession::class, 'exam_session_id'); }
    public function attendance(): HasOne { return $this->hasOne(ExamAttendanceRecord::class); }
}
