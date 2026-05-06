<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'student_id',
        'intake_id',
        'title',
        'original_amount',
        'amount',
        'paid_amount',
        'discount_amount',
        'alumni_discount_application_id',
        'status',
        'due_date',
    ];

    protected $casts = [
        'original_amount' => 'decimal:2',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function intake(): BelongsTo
    {
        return $this->belongsTo(Intake::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function alumniDiscountApplication(): BelongsTo
    {
        return $this->belongsTo(AlumniDiscountApplication::class);
    }
}
