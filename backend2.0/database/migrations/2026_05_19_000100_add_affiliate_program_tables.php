<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'referred_by_affiliate_code')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('referred_by_affiliate_code')->nullable();
            });
        }

        if (!Schema::hasTable('affiliates')) {
            Schema::create('affiliates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
                $table->string('code')->unique();
                $table->string('display_name');
                $table->string('scope')->default('all');
                $table->string('status')->default('active');
                $table->decimal('formal_programme_rate', 5, 2)->default(10);
                $table->decimal('short_course_rate', 5, 2)->default(5);
                $table->string('lenco_account_id')->nullable();
                $table->string('payout_phone')->nullable();
                $table->string('payout_operator')->nullable();
                $table->string('payout_country', 5)->default('zm');
                $table->text('notes')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('affiliate_referrals')) {
            Schema::create('affiliate_referrals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->foreignId('referred_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('referral_code');
                $table->string('source_type');
                $table->string('source_reference')->nullable();
                $table->timestamp('first_paid_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->unique(['affiliate_id', 'referred_user_id', 'source_type', 'source_reference'], 'affiliate_referrals_unique');
            });
        }

        if (!Schema::hasTable('affiliate_earnings')) {
            Schema::create('affiliate_earnings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->foreignId('referred_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
                $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
                $table->string('source_type');
                $table->string('source_reference')->nullable();
                $table->decimal('gross_amount', 12, 2)->default(0);
                $table->decimal('commission_rate', 5, 2)->default(0);
                $table->decimal('commission_amount', 12, 2)->default(0);
                $table->string('currency', 3)->default('ZMW');
                $table->string('status')->default('available');
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->unique(['affiliate_id', 'source_type', 'source_reference', 'payment_id'], 'affiliate_earnings_unique');
            });
        }

        if (!Schema::hasTable('affiliate_payouts')) {
            Schema::create('affiliate_payouts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->string('reference')->unique();
                $table->decimal('amount', 12, 2)->default(0);
                $table->decimal('fee', 12, 2)->default(0);
                $table->string('currency', 3)->default('ZMW');
                $table->string('method')->default('lenco_mobile_money');
                $table->string('phone')->nullable();
                $table->string('operator')->nullable();
                $table->string('country', 5)->default('zm');
                $table->string('status')->default('pending');
                $table->unsignedBigInteger('requested_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->string('lenco_reference')->nullable();
                $table->json('lenco_payload')->nullable();
                $table->text('failure_reason')->nullable();
                $table->timestamp('requested_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_payouts');
        Schema::dropIfExists('affiliate_earnings');
        Schema::dropIfExists('affiliate_referrals');
        Schema::dropIfExists('affiliates');

        if (Schema::hasColumn('users', 'referred_by_affiliate_code')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('referred_by_affiliate_code');
            });
        }
    }
};
