<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShortCourseBlueprint extends Model
{
    protected $fillable = [
        'course_id',
        'blueprint',
        'source_mode',
        'programme_title',
        'programme_course_title',
    ];

    protected $casts = [
        'blueprint' => 'array',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
}
