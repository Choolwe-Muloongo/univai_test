<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('intakes', function (Blueprint $table) {
            if (!Schema::hasColumn('intakes', 'registration_opens_at')) {
                $table->date('registration_opens_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('intakes', 'registration_closes_at')) {
                $table->date('registration_closes_at')->nullable()->after('registration_opens_at');
            }
            if (!Schema::hasColumn('intakes', 'orientation_date')) {
                $table->date('orientation_date')->nullable()->after('registration_closes_at');
            }
            if (!Schema::hasColumn('intakes', 'classes_start_date')) {
                $table->date('classes_start_date')->nullable()->after('orientation_date');
            }
            if (!Schema::hasColumn('intakes', 'add_drop_deadline')) {
                $table->date('add_drop_deadline')->nullable()->after('classes_start_date');
            }
            if (!Schema::hasColumn('intakes', 'ca_starts_at')) {
                $table->date('ca_starts_at')->nullable()->after('add_drop_deadline');
            }
            if (!Schema::hasColumn('intakes', 'ca_ends_at')) {
                $table->date('ca_ends_at')->nullable()->after('ca_starts_at');
            }
            if (!Schema::hasColumn('intakes', 'exam_registration_deadline')) {
                $table->date('exam_registration_deadline')->nullable()->after('ca_ends_at');
            }
            if (!Schema::hasColumn('intakes', 'exam_starts_at')) {
                $table->date('exam_starts_at')->nullable()->after('exam_registration_deadline');
            }
            if (!Schema::hasColumn('intakes', 'exam_ends_at')) {
                $table->date('exam_ends_at')->nullable()->after('exam_starts_at');
            }
            if (!Schema::hasColumn('intakes', 'results_release_date')) {
                $table->date('results_release_date')->nullable()->after('exam_ends_at');
            }
            if (!Schema::hasColumn('intakes', 'progression_opens_at')) {
                $table->date('progression_opens_at')->nullable()->after('results_release_date');
            }
            if (!Schema::hasColumn('intakes', 'calendar_status')) {
                $table->string('calendar_status')->default('draft')->after('progression_opens_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('intakes', function (Blueprint $table) {
            foreach ([
                'registration_opens_at',
                'registration_closes_at',
                'orientation_date',
                'classes_start_date',
                'add_drop_deadline',
                'ca_starts_at',
                'ca_ends_at',
                'exam_registration_deadline',
                'exam_starts_at',
                'exam_ends_at',
                'results_release_date',
                'progression_opens_at',
                'calendar_status',
            ] as $column) {
                if (Schema::hasColumn('intakes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
