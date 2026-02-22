<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchOpportunity extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'company',
        'field',
        'description',
    ];
}
