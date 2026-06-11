<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            if (!Schema::hasColumn('affiliates', 'tier')) {
                $table->string('tier')->default('starter')->after('status');
            }
            if (!Schema::hasColumn('affiliates', 'application_reason')) {
                $table->text('application_reason')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('affiliates', 'promotion_channels')) {
                $table->json('promotion_channels')->nullable()->after('application_reason');
            }
            if (!Schema::hasColumn('affiliates', 'terms_accepted_at')) {
                $table->timestamp('terms_accepted_at')->nullable()->after('promotion_channels');
            }
            if (!Schema::hasColumn('affiliates', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('affiliates', 'recurring_commission_enabled')) {
                $table->boolean('recurring_commission_enabled')->default(false)->after('rejected_at');
            }
            if (!Schema::hasColumn('affiliates', 'recurring_months')) {
                $table->unsignedSmallInteger('recurring_months')->default(0)->after('recurring_commission_enabled');
            }
            if (!Schema::hasColumn('affiliates', 'auto_payout_enabled')) {
                $table->boolean('auto_payout_enabled')->default(true)->after('recurring_months');
            }
            if (!Schema::hasColumn('affiliates', 'auto_payout_daily_limit')) {
                $table->decimal('auto_payout_daily_limit', 12, 2)->default(100)->after('auto_payout_enabled');
            }
            if (!Schema::hasColumn('affiliates', 'last_tier_reviewed_at')) {
                $table->timestamp('last_tier_reviewed_at')->nullable()->after('auto_payout_daily_limit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            foreach ([
                'last_tier_reviewed_at',
                'auto_payout_daily_limit',
                'auto_payout_enabled',
                'recurring_months',
                'recurring_commission_enabled',
                'rejected_at',
                'terms_accepted_at',
                'promotion_channels',
                'application_reason',
                'tier',
            ] as $column) {
                if (Schema::hasColumn('affiliates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
