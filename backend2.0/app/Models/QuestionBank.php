<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionBank extends Model
{
    protected $fillable = [
        'module_id',
        'title',
        'description',
        'outcomes',
        'selection_rules',
        'status',
        'created_by',
    ];

    protected $casts = [
        'outcomes' => 'array',
        'selection_rules' => 'array',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }
}
