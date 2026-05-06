<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('cohort_id')->nullable()->after('intake_id');
            $table->string('section_id')->nullable()->after('cohort_id');

            $table->foreign('cohort_id')->references('id')->on('cohorts')->nullOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropForeign(['cohort_id']);
            $table->dropColumn(['cohort_id', 'section_id']);
        });
    }
};
