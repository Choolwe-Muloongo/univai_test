<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('affiliate_monthly_scores')) {
            Schema::create('affiliate_monthly_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->unsignedTinyInteger('month');
                $table->unsignedSmallInteger('year');
                $table->string('tier')->default('starter');
                $table->unsignedInteger('entry_fees_paid')->default(0);
                $table->unsignedInteger('access_purchases_paid')->default(0);
                $table->decimal('access_revenue', 12, 2)->default(0);
                $table->unsignedInteger('retained_learners')->default(0);
                $table->unsignedInteger('refund_count')->default(0);
                $table->unsignedInteger('risk_flags_count')->default(0);
                $table->integer('score')->default(0);
                $table->boolean('qualified')->default(false);
                $table->unsignedInteger('rank')->nullable();
                $table->timestamp('calculated_at')->nullable();
                $table->timestamps();

                $table->unique(['affiliate_id', 'month', 'year'], 'affiliate_monthly_scores_unique');
                $table->index(['year', 'month', 'tier', 'qualified']);
            });
        }

        if (!Schema::hasTable('affiliate_monthly_bonuses')) {
            Schema::create('affiliate_monthly_bonuses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->foreignId('monthly_score_id')->nullable()->constrained('affiliate_monthly_scores')->nullOnDelete();
                $table->unsignedTinyInteger('month');
                $table->unsignedSmallInteger('year');
                $table->string('tier')->default('starter');
                $table->unsignedInteger('rank')->nullable();
                $table->decimal('bonus_amount', 12, 2)->default(0);
                $table->string('currency', 3)->default('ZMW');
                $table->string('status')->default('pending_review');
                $table->text('review_notes')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->unsignedBigInteger('rejected_by')->nullable();
                $table->unsignedBigInteger('paid_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();

                $table->index(['year', 'month', 'tier', 'status']);
            });
        }

        if (!Schema::hasTable('affiliate_tier_upgrade_requests')) {
            Schema::create('affiliate_tier_upgrade_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->string('from_tier');
                $table->string('to_tier');
                $table->unsignedInteger('paid_access_purchases')->default(0);
                $table->decimal('access_revenue', 12, 2)->default(0);
                $table->unsignedInteger('active_months')->default(0);
                $table->decimal('refund_rate', 5, 2)->default(0);
                $table->unsignedInteger('risk_flags_count')->default(0);
                $table->string('status')->default('pending');
                $table->text('affiliate_message')->nullable();
                $table->text('admin_notes')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();

                $table->index(['status', 'from_tier', 'to_tier']);
            });
        }

        if (!Schema::hasTable('affiliate_tier_reviews')) {
            Schema::create('affiliate_tier_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->unsignedTinyInteger('month');
                $table->unsignedSmallInteger('year');
                $table->string('tier_at_review');
                $table->unsignedInteger('entry_fees_paid')->default(0);
                $table->unsignedInteger('access_purchases_paid')->default(0);
                $table->decimal('access_revenue', 12, 2)->default(0);
                $table->decimal('refund_rate', 5, 2)->default(0);
                $table->unsignedInteger('risk_flags_count')->default(0);
                $table->string('maintenance_status')->default('safe');
                $table->unsignedInteger('missed_months_count')->default(0);
                $table->string('action_taken')->default('none');
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamps();

                $table->unique(['affiliate_id', 'month', 'year'], 'affiliate_tier_reviews_unique');
                $table->index(['year', 'month', 'tier_at_review', 'maintenance_status']);
            });
        }

        if (!Schema::hasTable('affiliate_badges')) {
            Schema::create('affiliate_badges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('affiliate_id')->constrained('affiliates')->cascadeOnDelete();
                $table->string('badge_key');
                $table->string('badge_label');
                $table->text('badge_description')->nullable();
                $table->unsignedTinyInteger('earned_for_month')->nullable();
                $table->unsignedSmallInteger('earned_for_year')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->unique(['affiliate_id', 'badge_key', 'earned_for_month', 'earned_for_year'], 'affiliate_badges_unique');
            });
        }

        if (!Schema::hasTable('financial_allocations')) {
            Schema::create('financial_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
                $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
                $table->string('revenue_source')->default('other');
                $table->boolean('is_affiliate_sourced')->default(false);
                $table->foreignId('affiliate_id')->nullable()->constrained('affiliates')->nullOnDelete();
                $table->string('affiliate_tier_at_payment')->nullable();
                $table->decimal('gross_amount', 12, 2)->default(0);
                $table->string('currency', 3)->default('ZMW');
                $table->decimal('affiliate_commission_amount', 12, 2)->default(0);
                $table->string('leaderboard_pool_tier')->nullable();
                $table->decimal('leaderboard_pool_amount', 12, 2)->default(0);
                $table->decimal('operating_reserve_amount', 12, 2)->default(0);
                $table->decimal('retained_business_amount', 12, 2)->default(0);
                $table->decimal('product_content_ai_amount', 12, 2)->default(0);
                $table->decimal('marketing_growth_amount', 12, 2)->default(0);
                $table->decimal('owner_profit_amount', 12, 2)->default(0);
                $table->decimal('refund_reserve_amount', 12, 2)->default(0);
                $table->string('allocation_status')->default('locked');
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['revenue_source', 'is_affiliate_sourced']);
                $table->index(['leaderboard_pool_tier', 'allocation_status']);
            });
        }

        if (!Schema::hasTable('finance_bucket_balances')) {
            Schema::create('finance_bucket_balances', function (Blueprint $table) {
                $table->id();
                $table->string('bucket_key')->unique();
                $table->string('bucket_name');
                $table->string('currency', 3)->default('ZMW');
                $table->decimal('balance', 12, 2)->default(0);
                $table->timestamp('last_calculated_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('finance_bucket_transactions')) {
            Schema::create('finance_bucket_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('bucket_key');
                $table->string('type')->default('allocation_in');
                $table->decimal('amount', 12, 2)->default(0);
                $table->string('currency', 3)->default('ZMW');
                $table->text('description')->nullable();
                $table->string('reference')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index(['bucket_key', 'type']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_bucket_transactions');
        Schema::dropIfExists('finance_bucket_balances');
        Schema::dropIfExists('financial_allocations');
        Schema::dropIfExists('affiliate_badges');
        Schema::dropIfExists('affiliate_tier_reviews');
        Schema::dropIfExists('affiliate_tier_upgrade_requests');
        Schema::dropIfExists('affiliate_monthly_bonuses');
        Schema::dropIfExists('affiliate_monthly_scores');
    }
};