<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSession extends Model
{
    protected $fillable = ['exam_centre_id', 'exam_room_id', 'exam_invigilator_id', 'exam_id', 'title', 'program_id', 'module_id', 'course_id', 'delivery_mode', 'starts_at', 'ends_at', 'capacity', 'status', 'rules'];
    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'rules' => 'array'];
    public function centre(): BelongsTo { return $this->belongsTo(ExamCentre::class, 'exam_centre_id'); }
    public function room(): BelongsTo { return $this->belongsTo(ExamRoom::class, 'exam_room_id'); }
    public function invigilator(): BelongsTo { return $this->belongsTo(ExamInvigilator::class, 'exam_invigilator_id'); }
    public function bookings(): HasMany { return $this->hasMany(ExamBooking::class); }
    public function incidents(): HasMany { return $this->hasMany(ExamIncident::class); }
}
