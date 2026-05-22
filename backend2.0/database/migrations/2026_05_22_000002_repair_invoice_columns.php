<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('invoices')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('invoices', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            if (!Schema::hasColumn('invoices', 'currency')) {
                $table->string('currency', 3)->default('ZMW')->after('amount');
            }
            if (!Schema::hasColumn('invoices', 'type')) {
                $table->string('type')->default('tuition_fee')->after('status')->index();
            }
            if (!Schema::hasColumn('invoices', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->unique()->after('type');
            }
            if (!Schema::hasColumn('invoices', 'checkout_url')) {
                $table->text('checkout_url')->nullable()->after('transaction_reference');
            }
            if (!Schema::hasColumn('invoices', 'metadata')) {
                $table->json('metadata')->nullable()->after('checkout_url');
            }
            if (!Schema::hasColumn('invoices', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('due_date');
            }
        });
    }

    public function down(): void
    {
        // Production repair migration: do not remove columns on rollback.
    }
};
