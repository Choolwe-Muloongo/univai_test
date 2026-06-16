<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            if (!Schema::hasColumn('affiliates', 'entry_fee_paid_at')) {
                $table->timestamp('entry_fee_paid_at')->nullable()->after('terms_accepted_at');
            }

            if (!Schema::hasColumn('affiliates', 'access_requirement_met_at')) {
                $table->timestamp('access_requirement_met_at')->nullable()->after('entry_fee_paid_at');
            }

            if (!Schema::hasColumn('affiliates', 'requirements_status')) {
                $table->string('requirements_status')->default('payment_required')->after('access_requirement_met_at');
            }

            if (!Schema::hasColumn('affiliates', 'legacy_application')) {
                $table->boolean('legacy_application')->default(false)->after('requirements_status');
            }

            if (!Schema::hasColumn('affiliates', 'terms_version')) {
                $table->string('terms_version')->nullable()->after('legacy_application');
            }

            if (!Schema::hasColumn('affiliates', 'requirements_snapshot')) {
                $table->json('requirements_snapshot')->nullable()->after('terms_version');
            }
        });

        $now = now();

        DB::table('affiliates')
            ->whereNull('entry_fee_paid_at')
            ->orWhereNull('access_requirement_met_at')
            ->update([
                'status' => 'payment_required',
                'requirements_status' => 'payment_required',
                'legacy_application' => true,
                'updated_at' => $now,
            ]);

        DB::table('affiliates')
            ->whereNotNull('entry_fee_paid_at')
            ->whereNotNull('access_requirement_met_at')
            ->update([
                'requirements_status' => 'complete',
                'updated_at' => $now,
            ]);
    }

    public function down(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            foreach ([
                'entry_fee_paid_at',
                'access_requirement_met_at',
                'requirements_status',
                'legacy_application',
                'terms_version',
                'requirements_snapshot',
            ] as $column) {
                if (Schema::hasColumn('affiliates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
