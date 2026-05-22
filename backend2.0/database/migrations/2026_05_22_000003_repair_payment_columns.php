<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'currency')) {
                $table->string('currency', 3)->default('ZMW')->after('amount');
            }
            if (!Schema::hasColumn('payments', 'provider')) {
                $table->string('provider')->default('manual')->after('method');
            }
            if (!Schema::hasColumn('payments', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->index()->after('provider');
            }
            if (!Schema::hasColumn('payments', 'payload')) {
                $table->json('payload')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        // Production repair migration: do not remove columns on rollback.
    }
};
