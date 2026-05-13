<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
    ];

    public function shortCourses(): HasMany
    {
        return $this->hasMany(ShortCourse::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}
