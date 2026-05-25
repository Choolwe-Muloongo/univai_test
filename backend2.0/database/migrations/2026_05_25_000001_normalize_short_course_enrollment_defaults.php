<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('short_course_enrollments')) {
            return;
        }

        if (Schema::hasColumn('short_course_enrollments', 'ai_plan')) {
            DB::statement("ALTER TABLE short_course_enrollments MODIFY ai_plan VARCHAR(255) NOT NULL DEFAULT 'none'");
        }

        if (Schema::hasColumn('short_course_enrollments', 'hourly_ai_quota')) {
            DB::statement('ALTER TABLE short_course_enrollments MODIFY hourly_ai_quota INT UNSIGNED NOT NULL DEFAULT 0');
        }

        if (Schema::hasColumn('short_course_enrollments', 'daily_ai_quota')) {
            DB::statement('ALTER TABLE short_course_enrollments MODIFY daily_ai_quota INT UNSIGNED NOT NULL DEFAULT 0');
        }

        if (Schema::hasColumn('short_course_enrollments', 'access_plan')) {
            DB::statement("ALTER TABLE short_course_enrollments MODIFY access_plan VARCHAR(255) NOT NULL DEFAULT 'starter_access'");
        }
    }

    public function down(): void
    {
        // Production safety migration: keep the normalized defaults on rollback.
    }
};
