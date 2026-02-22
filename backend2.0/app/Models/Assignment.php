<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    protected $fillable = [
        'module_id',
        'course_id',
        'title',
        'description',
        'instructions',
        'assignment_type',
        'max_points',
        'due_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class, 'assignment_id');
    }
}
