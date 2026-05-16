<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('short_course_enrollments', function (Blueprint $table) {
            if (!Schema::hasColumn('short_course_enrollments', 'access_expires_at')) {
                $table->timestamp('access_expires_at')->nullable()->after('entry_fee_paid')->index();
            }
            if (!Schema::hasColumn('short_course_enrollments', 'access_plan')) {
                $table->string('access_plan')->default('entry')->after('access_expires_at');
            }
            if (!Schema::hasColumn('short_course_enrollments', 'ai_plan')) {
                $table->string('ai_plan')->default('included')->after('access_plan');
            }
            if (!Schema::hasColumn('short_course_enrollments', 'ai_access_expires_at')) {
                $table->timestamp('ai_access_expires_at')->nullable()->after('ai_plan')->index();
            }
            if (!Schema::hasColumn('short_course_enrollments', 'hourly_ai_quota')) {
                $table->unsignedInteger('hourly_ai_quota')->default(20)->after('ai_access_expires_at');
            }
            if (!Schema::hasColumn('short_course_enrollments', 'daily_ai_quota')) {
                $table->unsignedInteger('daily_ai_quota')->default(120)->after('hourly_ai_quota');
            }
            if (!Schema::hasColumn('short_course_enrollments', 'certificate_included')) {
                $table->boolean('certificate_included')->default(false)->after('daily_ai_quota');
            }
        });
    }

    public function down(): void
    {
        Schema::table('short_course_enrollments', function (Blueprint $table) {
            foreach (['access_expires_at', 'access_plan', 'ai_plan', 'ai_access_expires_at', 'hourly_ai_quota', 'daily_ai_quota', 'certificate_included'] as $column) {
                if (Schema::hasColumn('short_course_enrollments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
