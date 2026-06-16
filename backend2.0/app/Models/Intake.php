<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intake extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'program_id',
        'curriculum_version_id',
        'name',
        'delivery_mode',
        'campus',
        'capacity',
        'start_date',
        'end_date',
        'status',
        'registration_opens_at',
        'registration_closes_at',
        'orientation_date',
        'classes_start_date',
        'add_drop_deadline',
        'ca_starts_at',
        'ca_ends_at',
        'exam_registration_deadline',
        'exam_starts_at',
        'exam_ends_at',
        'results_release_date',
        'progression_opens_at',
        'calendar_status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'registration_opens_at' => 'date',
        'registration_closes_at' => 'date',
        'orientation_date' => 'date',
        'classes_start_date' => 'date',
        'add_drop_deadline' => 'date',
        'ca_starts_at' => 'date',
        'ca_ends_at' => 'date',
        'exam_registration_deadline' => 'date',
        'exam_starts_at' => 'date',
        'exam_ends_at' => 'date',
        'results_release_date' => 'date',
        'progression_opens_at' => 'date',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculumVersion(): BelongsTo
    {
        return $this->belongsTo(CurriculumVersion::class, 'curriculum_version_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }
}
