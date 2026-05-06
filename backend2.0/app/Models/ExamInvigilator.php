<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamInvigilator extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'phone', 'certifications', 'status'];
    protected $casts = ['certifications' => 'array'];
    public function sessions(): HasMany { return $this->hasMany(ExamSession::class); }
}
