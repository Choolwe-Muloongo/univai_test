<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'school_id',
        'title',
        'description',
        'progress',
        'image_id',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(ProgramModule::class);
    }

    public function curriculumVersions(): HasMany
    {
        return $this->hasMany(CurriculumVersion::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
