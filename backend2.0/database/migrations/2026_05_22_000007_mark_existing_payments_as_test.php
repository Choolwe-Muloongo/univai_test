<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'is_test')) {
            DB::table('payments')->update([
                'is_test' => true,
                'payment_mode' => 'legacy_test',
            ]);
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'is_test')) {
            DB::table('invoices')->update([
                'is_test' => true,
                'payment_mode' => 'legacy_test',
            ]);
        }
    }

    public function down(): void
    {
        // One-time production marker: do not automatically revert payment flags.
    }
};
