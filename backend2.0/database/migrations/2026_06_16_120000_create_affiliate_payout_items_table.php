<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('affiliate_payout_items')) {
            return;
        }

        Schema::create('affiliate_payout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_id')->constrained('affiliate_payouts')->cascadeOnDelete();
            $table->foreignId('affiliate_earning_id')->constrained('affiliate_earnings')->cascadeOnDelete();
            $table->decimal('allocated_amount', 12, 2)->default(0);
            $table->string('status')->default('reserved');
            $table->timestamps();

            $table->index(['payout_id', 'status']);
            $table->index(['affiliate_earning_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_payout_items');
    }
};
