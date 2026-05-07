<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('short_courses', function (Blueprint $table) {
            if (!Schema::hasColumn('short_courses', 'certificate_fee')) {
                $table->decimal('certificate_fee', 10, 2)->default(15)->after('currency');
            }
            if (!Schema::hasColumn('short_courses', 'certificate_currency')) {
                $table->string('certificate_currency', 3)->default('USD')->after('certificate_fee');
            }
        });

        Schema::table('programs', function (Blueprint $table) {
            if (!Schema::hasColumn('programs', 'application_fee')) {
                $table->decimal('application_fee', 10, 2)->default(0)->after('launch_status');
            }
            if (!Schema::hasColumn('programs', 'application_currency')) {
                $table->string('application_currency', 3)->default('ZMW')->after('application_fee');
            }
            if (!Schema::hasColumn('programs', 'tuition_fee')) {
                $table->decimal('tuition_fee', 10, 2)->default(0)->after('application_currency');
            }
            if (!Schema::hasColumn('programs', 'tuition_currency')) {
                $table->string('tuition_currency', 3)->default('ZMW')->after('tuition_fee');
            }
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            foreach (['tuition_currency', 'tuition_fee', 'application_currency', 'application_fee'] as $column) {
                if (Schema::hasColumn('programs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('short_courses', function (Blueprint $table) {
            foreach (['certificate_currency', 'certificate_fee'] as $column) {
                if (Schema::hasColumn('short_courses', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
