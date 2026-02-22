<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmissionsSetting extends Model
{
    protected $fillable = [
        'is_open',
        'message',
        'updated_by',
    ];
}
