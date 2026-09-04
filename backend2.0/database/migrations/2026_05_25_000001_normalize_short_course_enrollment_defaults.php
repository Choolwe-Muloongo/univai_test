<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('short_course_enrollments')) {
            return;
        }

        // PostgreSQL supports ALTER COLUMN ... TYPE/SET DEFAULT/SET NOT NULL,
        // but SQLite does not. Use Laravel's schema builder for SQLite so the
        // migration remains portable across local/dev and production databases.
        $driver = DB::connection()->getDriverName();

        if (Schema::hasColumn('short_course_enrollments', 'ai_plan')) {
            DB::table('short_course_enrollments')
                ->where(function ($query) {
                    $query->whereNull('ai_plan')->orWhere('ai_plan', '');
                })
                ->update(['ai_plan' => 'none']);

            if ($driver === 'sqlite') {
                Schema::table('short_course_enrollments', function (Blueprint $table) {
                    $table->string('ai_plan', 255)->default('none')->nullable(false)->change();
                });
            } else {
                DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN ai_plan TYPE VARCHAR(255)");
                DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN ai_plan SET DEFAULT 'none'");
                DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN ai_plan SET NOT NULL");
            }
        }

        if (Schema::hasColumn('short_course_enrollments', 'hourly_ai_quota')) {
            DB::table('short_course_enrollments')
                ->whereNull('hourly_ai_quota')
                ->update(['hourly_ai_quota' => 0]);

            if ($driver === 'sqlite') {
                Schema::table('short_course_enrollments', function (Blueprint $table) {
                    $table->integer('hourly_ai_quota')->default(0)->nullable(false)->change();
                });
            } else {
                DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN hourly_ai_quota TYPE INTEGER USING hourly_ai_quota::integer');
                DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN hourly_ai_quota SET DEFAULT 0');
                DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN hourly_ai_quota SET NOT NULL');
            }
        }

        if (Schema::hasColumn('short_course_enrollments', 'daily_ai_quota')) {
            DB::table('short_course_enrollments')
                ->whereNull('daily_ai_quota')
                ->update(['daily_ai_quota' => 0]);

            if ($driver === 'sqlite') {
                Schema::table('short_course_enrollments', function (Blueprint $table) {
                    $table->integer('daily_ai_quota')->default(0)->nullable(false)->change();
                });
            } else {
                DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN daily_ai_quota TYPE INTEGER USING daily_ai_quota::integer');
                DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN daily_ai_quota SET DEFAULT 0');
                DB::statement('ALTER TABLE short_course_enrollments ALTER COLUMN daily_ai_quota SET NOT NULL');
            }
        }

        if (Schema::hasColumn('short_course_enrollments', 'access_plan')) {
            DB::table('short_course_enrollments')
                ->where(function ($query) {
                    $query->whereNull('access_plan')->orWhere('access_plan', '');
                })
                ->update(['access_plan' => 'starter_access']);

            if ($driver === 'sqlite') {
                Schema::table('short_course_enrollments', function (Blueprint $table) {
                    $table->string('access_plan', 255)->default('starter_access')->nullable(false)->change();
                });
            } else {
                DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN access_plan TYPE VARCHAR(255)");
                DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN access_plan SET DEFAULT 'starter_access'");
                DB::statement("ALTER TABLE short_course_enrollments ALTER COLUMN access_plan SET NOT NULL");
            }
        }
    }

    public function down(): void
    {
        // Production safety migration: keep the normalized defaults on rollback.
    }
};
