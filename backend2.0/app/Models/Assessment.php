<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'module_id',
        'unit_id',
        'lesson_id',
        'title',
        'type',
        'weighting',
        'max_score',
        'is_summative',
        'due_at',
        'settings',
    ];

    protected $casts = [
        'weighting' => 'integer',
        'max_score' => 'integer',
        'is_summative' => 'boolean',
        'due_at' => 'datetime',
        'settings' => 'array',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(AcademicModule::class, 'module_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
