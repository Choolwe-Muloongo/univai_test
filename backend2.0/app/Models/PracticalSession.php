<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticalSession extends Model
{
    protected $fillable = [
        'course_offering_id',
        'programme_course_id',
        'delivery_group_id',
        'title',
        'description',
        'venue_id',
        'partner_institution_id',
        'starts_at',
        'ends_at',
        'capacity',
        'supervisor_id',
        'status',
    ];

    protected $casts = [
        'course_offering_id' => 'integer',
        'programme_course_id' => 'integer',
        'delivery_group_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'capacity' => 'integer',
    ];

    public function programmeCourse(): BelongsTo
    {
        return $this->belongsTo(ProgrammeCourse::class);
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function partnerInstitution(): BelongsTo
    {
        return $this->belongsTo(PartnerInstitution::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
