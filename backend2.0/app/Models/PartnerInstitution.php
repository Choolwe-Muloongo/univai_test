<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerInstitution extends Model
{
    protected $fillable = [
        'name',
        'type',
        'location',
        'contact_person',
        'contact_email',
        'status',
    ];
}
