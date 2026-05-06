<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttendanceRecord extends Model
{
    protected $fillable = ['exam_booking_id', 'status', 'checked_in_at', 'checked_out_at', 'verified_by', 'notes'];
    protected $casts = ['checked_in_at' => 'datetime', 'checked_out_at' => 'datetime'];
    public function booking(): BelongsTo { return $this->belongsTo(ExamBooking::class, 'exam_booking_id'); }
}
