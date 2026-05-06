<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamRoom extends Model
{
    protected $fillable = ['exam_centre_id', 'name', 'code', 'capacity', 'accessibility_notes', 'equipment', 'status'];
    protected $casts = ['equipment' => 'array'];
    public function centre(): BelongsTo { return $this->belongsTo(ExamCentre::class, 'exam_centre_id'); }
    public function sessions(): HasMany { return $this->hasMany(ExamSession::class); }
}
