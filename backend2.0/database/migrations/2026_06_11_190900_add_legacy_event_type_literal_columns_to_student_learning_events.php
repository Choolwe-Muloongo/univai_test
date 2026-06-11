<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('student_learning_events')) {
            return;
        }

        Schema::table('student_learning_events', function (Blueprint $table) {
            if (!Schema::hasColumn('student_learning_events', 'mission_completed')) {
                $table->string('mission_completed')->default('mission_completed');
            }

            if (!Schema::hasColumn('student_learning_events', 'practice_passed')) {
                $table->string('practice_passed')->default('practice_passed');
            }

            if (!Schema::hasColumn('student_learning_events', 'final_trial_passed')) {
                $table->string('final_trial_passed')->default('final_trial_passed');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('student_learning_events')) {
            return;
        }

        Schema::table('student_learning_events', function (Blueprint $table) {
            foreach (['mission_completed', 'practice_passed', 'final_trial_passed'] as $column) {
                if (Schema::hasColumn('student_learning_events', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
