<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultantApplication extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'department',
        'status',
        'avatar',
        'documents',
    ];

    protected $casts = [
        'documents' => 'array',
    ];
}
