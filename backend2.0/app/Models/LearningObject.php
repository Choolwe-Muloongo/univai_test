<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LearningObject extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'type',
        'title',
        'description',
        'body',
        'asset_url',
        'storage_path',
        'mime_type',
        'payload',
        'access_rules',
        'version',
        'version_label',
        'is_current',
        'is_reusable',
        'review_status',
        'publication_status',
        'created_by',
        'updated_by',
        'reviewed_by',
        'reviewed_at',
        'published_at',
        'retracted_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'access_rules' => 'array',
        'version' => 'integer',
        'is_current' => 'boolean',
        'is_reusable' => 'boolean',
        'reviewed_at' => 'datetime',
        'published_at' => 'datetime',
        'retracted_at' => 'datetime',
        'body',
        'url',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'lesson_learning_objects')
            ->withPivot(['position', 'is_required', 'access_rules', 'publication_status', 'available_from', 'available_until'])
            ->withTimestamps();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
        return $this->belongsToMany(Lesson::class, 'lesson_learning_object')
            ->withPivot('sort_order')
            ->withTimestamps();
    }
}
