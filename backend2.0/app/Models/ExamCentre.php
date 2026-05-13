<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamCentre extends Model
{
    protected $fillable = ['name', 'code', 'location', 'timezone', 'capacity', 'approval_status', 'approval_notes', 'approved_at', 'approved_by', 'metadata'];

    protected $casts = ['approved_at' => 'datetime', 'metadata' => 'array'];

    public function rooms(): HasMany { return $this->hasMany(ExamRoom::class); }
    public function sessions(): HasMany { return $this->hasMany(ExamSession::class); }
}
