<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('programs') && !Schema::hasColumn('programs', 'required_subjects')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->json('required_subjects')->nullable()->after('admission_requirements');
            });
        }

        if (Schema::hasTable('admissions_settings')) {
            Schema::table('admissions_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('admissions_settings', 'lecturer_applications_open')) {
                    $table->boolean('lecturer_applications_open')->default(false)->after('message');
                }
                if (!Schema::hasColumn('admissions_settings', 'lecturer_applications_message')) {
                    $table->text('lecturer_applications_message')->nullable()->after('lecturer_applications_open');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('programs') && Schema::hasColumn('programs', 'required_subjects')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->dropColumn('required_subjects');
            });
        }

        if (Schema::hasTable('admissions_settings')) {
            Schema::table('admissions_settings', function (Blueprint $table) {
                if (Schema::hasColumn('admissions_settings', 'lecturer_applications_message')) {
                    $table->dropColumn('lecturer_applications_message');
                }
                if (Schema::hasColumn('admissions_settings', 'lecturer_applications_open')) {
                    $table->dropColumn('lecturer_applications_open');
                }
            });
        }
    }
};
