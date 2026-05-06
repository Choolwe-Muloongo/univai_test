<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('cashback_source')->nullable()->after('status');
            $table->boolean('cashback_finance_approved')->default(false)->after('cashback_source');
            $table->decimal('cashback_rate', 5, 4)->default(0.4000)->after('cashback_finance_approved');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['cashback_source', 'cashback_finance_approved', 'cashback_rate']);
        });
    }
};
