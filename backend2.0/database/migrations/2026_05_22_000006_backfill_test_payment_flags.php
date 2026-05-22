<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'is_test')) {
            DB::table('payments')
                ->where(function ($query) {
                    $query->where('provider', 'test-mode')
                        ->orWhere('method', 'test-mode')
                        ->orWhere('transaction_reference', 'like', 'test-%')
                        ->orWhere('payment_mode', 'local_test')
                        ->orWhere('payment_mode', 'lenco_test');
                })
                ->update([
                    'is_test' => true,
                    'payment_mode' => DB::raw("CASE WHEN payment_mode IS NULL OR payment_mode = '' OR payment_mode = 'live' THEN 'local_test' ELSE payment_mode END"),
                ]);
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'is_test')) {
            DB::table('invoices')
                ->where(function ($query) {
                    $query->where('transaction_reference', 'like', 'test-%')
                        ->orWhere('payment_mode', 'local_test')
                        ->orWhere('payment_mode', 'lenco_test');
                })
                ->update([
                    'is_test' => true,
                    'payment_mode' => DB::raw("CASE WHEN payment_mode IS NULL OR payment_mode = '' OR payment_mode = 'live' THEN 'local_test' ELSE payment_mode END"),
                ]);
        }
    }

    public function down(): void
    {
        // Production backfill migration: do not unset flags on rollback.
    }
};
