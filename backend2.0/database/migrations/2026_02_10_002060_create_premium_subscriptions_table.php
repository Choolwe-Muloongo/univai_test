<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('premium_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('status')->default('trial');
            $table->json('entitlements')->nullable();
            $table->boolean('premium_features_unlocked')->default(false);
            $table->timestamp('entitlements_activated_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamp('past_due_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->decimal('cashback_amount', 10, 2)->default(0);
            $table->string('cashback_currency')->default('AFTA');
            $table->string('cashback_status')->default('not_qualified');
            $table->timestamp('cashback_created_at')->nullable();
            $table->timestamps();

            $table->unique('user_id');
            $table->index(['status', 'current_period_ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('premium_subscriptions');
    }
};
