<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payment_settings')) {
            Schema::table('payment_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('payment_settings', 'payment_mode')) {
                    $table->string('payment_mode')->default('live')->after('lenco_collections_enabled');
                }
                if (!Schema::hasColumn('payment_settings', 'show_test_payments_in_admin')) {
                    $table->boolean('show_test_payments_in_admin')->default(true)->after('payment_mode');
                }
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('invoices', 'is_test')) {
                    $table->boolean('is_test')->default(false)->after('status')->index();
                }
                if (!Schema::hasColumn('invoices', 'payment_mode')) {
                    $table->string('payment_mode')->default('live')->after('is_test')->index();
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'is_test')) {
                    $table->boolean('is_test')->default(false)->after('status')->index();
                }
                if (!Schema::hasColumn('payments', 'payment_mode')) {
                    $table->string('payment_mode')->default('live')->after('is_test')->index();
                }
            });
        }
    }

    public function down(): void
    {
        // Production repair migration: do not remove columns on rollback.
    }
};
