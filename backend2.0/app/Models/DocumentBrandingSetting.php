<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentBrandingSetting extends Model
{
    protected $fillable = [
        'registrar_name',
        'registrar_title',
        'registrar_signature',
        'director_name',
        'director_title',
        'director_signature',
        'footer_tagline',
        'verification_url',
        'contact_email',
    ];
}
