<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualificationLevel extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'name',
        'framework_level',
        'sort_order',
        'description',
    ];

    protected $casts = [
        'framework_level' => 'integer',
        'sort_order' => 'integer',
    ];

    public function programmes(): HasMany
    {
        return $this->hasMany(Programme::class);
    }
}
