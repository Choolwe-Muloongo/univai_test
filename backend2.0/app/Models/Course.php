<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Course extends Model
{
    protected $table = 'short_courses';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'school_id',
        'title',
        'description',
        'certificate_type',
        'pricing_type',
        'price',
        'currency',
        'certificate_fee',
        'certificate_currency',
        'duration_hours',
        'level',
        'progress',
        'image_id',
        'status',
        'review_status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'certificate_fee' => 'decimal:2',
        'duration_hours' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'short_course_lessons', 'short_course_id', 'lesson_id')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('short_course_lessons.sort_order');
    }
}
