<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonDocument extends Model
{
    protected $fillable = [
        'lesson_id',
        'intake_id',
        'source',
        'status',
        'uploaded_by',
        'approved_by',
        'approved_at',
        'review_notes',
        'file_name',
        'mime_type',
        'storage_path',
        'extracted_text',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function intake(): BelongsTo
    {
        return $this->belongsTo(Intake::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
