<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModulePrerequisite extends Model
{
    protected $fillable = [
        'module_id',
        'prerequisite_module_id',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'module_id');
    }

    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'prerequisite_module_id');
    }
}
