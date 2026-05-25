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
            DB::statement("UPDATE short_course_enrollments SET ai_plan = 'none' WHERE ai_plan IS NULL OR ai_plan = ''");
            DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN ai_plan TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN ai_plan SET DEFAULT 'none'");
            DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN ai_plan SET NOT NULL");
        }

        if (Schema::hasColumn('short_course_enrollments', 'hourly_ai_quota')) {
            DB::statement('UPDATE short_course_enrollments SET hourly_ai_quota = 0 WHERE hourly_ai_quota IS NULL');
            DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN hourly_ai_quota TYPE INTEGER USING hourly_ai_quota::integer');
            DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN hourly_ai_quota SET DEFAULT 0');
            DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN hourly_ai_quota SET NOT NULL');
        }

        if (Schema::hasColumn('short_course_enrollments', 'daily_ai_quota')) {
            DB::statement('UPDATE short_course_enrollments SET daily_ai_quota = 0 WHERE daily_ai_quota IS NULL');
            DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN daily_ai_quota TYPE INTEGER USING daily_ai_quota::integer');
            DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN daily_ai_quota SET DEFAULT 0');
            DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN daily_ai_quota SET NOT NULL');
        }

        if (Schema::hasColumn('short_course_enrollments', 'access_plan')) {
            DB::statement("UPDATE short_course_enrollments SET access_plan = 'starter_access' WHERE access_plan IS NULL OR access_plan = ''");
            DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN access_plan TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN access_plan SET DEFAULT 'starter_access'");
            DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN access_plan SET NOT NULL");
        }
    }

    public function down(): void
    {
        // Production safety migration: keep the normalized defaults on rollback.
    }
};
