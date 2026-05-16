<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('short_courses')) {
            Schema::table('short_courses', function (Blueprint $table) {
                if (!Schema::hasColumn('short_courses', 'certificate_fee')) {
                    $table->decimal('certificate_fee', 10, 2)->default(0)->after('currency');
                }
                if (!Schema::hasColumn('short_courses', 'certificate_currency')) {
                    $table->string('certificate_currency', 3)->default('ZMW')->after('certificate_fee');
                }
                if (!Schema::hasColumn('short_courses', 'status')) {
                    $table->string('status')->default('draft')->after('image_id');
                }
                if (!Schema::hasColumn('short_courses', 'review_status')) {
                    $table->string('review_status')->default('needs_review')->after('status');
                }
            });
        }

        if (Schema::hasTable('academic_entitlements') && Schema::hasTable('users')) {
            $adminIds = DB::table('users')
                ->whereIn('role', ['super-admin', 'admin', 'normal-admin', 'admissions-admin', 'lecturer-admin', 'employer-verification-admin', 'finance-admin', 'read-only-admin', 'exam-officer'])
                ->pluck('id');

            foreach ($adminIds as $adminId) {
                DB::table('academic_entitlements')->updateOrInsert(
                    [
                        'user_id' => $adminId,
                        'code' => 'admin_portal',
                        'scope_type' => 'platform',
                        'scope_id' => null,
                    ],
                    [
                        'status' => 'active',
                        'starts_at' => now(),
                        'metadata' => json_encode(['source' => 'runtime_repair_migration']),
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        // Intentionally left empty. This migration repairs production runtime access/schema safely.
    }
};
