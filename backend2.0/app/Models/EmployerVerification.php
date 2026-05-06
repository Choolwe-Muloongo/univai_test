<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployerVerification extends Model
{
    protected $fillable = [
        'user_id',
        'contact_email',
        'organization_name',
        'workflow_type',
        'status',
        'reviewed_by',
        'reviewed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }
}
