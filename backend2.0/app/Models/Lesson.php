<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Lesson extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'course_id',
        'title',
        'summary',
        'display_order',
        'publication_status',
        'published_at',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'published_at' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function learningObjects(): BelongsToMany
    {
        return $this->belongsToMany(LearningObject::class, 'lesson_learning_objects')
            ->withPivot(['position', 'is_required', 'access_rules', 'publication_status', 'available_from', 'available_until'])
            ->withTimestamps()
            ->orderBy('lesson_learning_objects.position');
    }
}
