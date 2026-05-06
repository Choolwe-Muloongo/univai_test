<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Lesson extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'summary',
        'content',
        'video_url',
        'quiz',
        'exercise',
    ];

    protected $casts = [
        'quiz' => 'array',
    ];

    public function shortCourses(): BelongsToMany
    {
        return $this->belongsToMany(ShortCourse::class, 'short_course_lessons', 'lesson_id', 'short_course_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function programModules(): BelongsToMany
    {
        return $this->belongsToMany(ProgramModule::class, 'program_module_lessons', 'lesson_id', 'program_module_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function learningObjects(): BelongsToMany
    {
        return $this->belongsToMany(LearningObject::class, 'lesson_learning_object')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('lesson_learning_object.sort_order');
    }
}
