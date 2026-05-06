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
        'amount',
        'paid_amount',
        'status',
        'cashback_source',
        'cashback_finance_approved',
        'cashback_rate',
        'due_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'cashback_finance_approved' => 'boolean',
        'cashback_rate' => 'decimal:4',
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

    public function cashbackLedgers(): HasMany
    {
        return $this->hasMany(CashbackLedger::class);
    }
}
