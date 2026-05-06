<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cashback_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('payment_id')->nullable()->unique()->constrained('payments')->nullOnDelete();
            $table->string('source');
            $table->string('status')->default('locked');
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('AFTA');
            $table->string('description')->nullable();
            $table->json('eligible_basis')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamp('earned_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['source', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashback_ledgers');
    }
};
