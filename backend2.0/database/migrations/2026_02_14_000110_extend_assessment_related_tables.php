<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('assessment_component_id')->nullable()->after('course_id')->constrained('assessment_components')->nullOnDelete();
            $table->decimal('weight', 5, 2)->nullable()->after('max_points');
            $table->decimal('pass_mark', 5, 2)->nullable()->after('weight');
            $table->unsignedInteger('max_attempts')->nullable()->after('pass_mark');
            $table->json('rubric')->nullable()->after('max_attempts');
            $table->string('moderation_status')->default('not_required')->after('status');
            $table->timestamp('results_release_at')->nullable()->after('moderation_status');
        });

        Schema::table('assignment_submissions', function (Blueprint $table) {
            $table->dropUnique(['assignment_id', 'student_id']);
            $table->unsignedInteger('attempt_no')->default(1)->after('student_id');
            $table->decimal('percentage', 5, 2)->nullable()->after('grade');
            $table->json('rubric_scores')->nullable()->after('feedback');
            $table->string('moderation_status')->default('pending')->after('reviewed_by');
            $table->timestamp('released_at')->nullable()->after('moderation_status');
            $table->unique(['assignment_id', 'student_id', 'attempt_no']);
        });

        Schema::table('exam_questions', function (Blueprint $table) {
            $table->foreignId('question_bank_id')->nullable()->after('semester')->constrained('question_banks')->nullOnDelete();
            $table->string('difficulty')->nullable()->after('answer');
            $table->json('outcomes')->nullable()->after('difficulty');
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->string('module_id')->nullable()->after('exam_id');
            $table->foreignId('assessment_component_id')->nullable()->after('module_id')->constrained('assessment_components')->nullOnDelete();
            $table->unsignedInteger('attempt_no')->default(1)->after('assessment_component_id');
            $table->decimal('score', 5, 2)->nullable()->after('attempt_no');
            $table->string('status')->default('submitted')->after('score');
            $table->boolean('exam_booking_confirmed')->default(false)->after('status');
            $table->timestamp('exam_clinic_completed_at')->nullable()->after('exam_booking_confirmed');
            $table->string('moderation_status')->default('pending')->after('exam_clinic_completed_at');
            $table->timestamp('released_at')->nullable()->after('moderation_status');

            $table->foreign('module_id')->references('id')->on('program_modules')->nullOnDelete();
            $table->index(['user_id', 'module_id', 'assessment_component_id']);
        });

        Schema::table('course_attempts', function (Blueprint $table) {
            $table->json('assessment_breakdown')->nullable()->after('exam_score');
            $table->string('moderation_status')->default('pending')->after('result_status');
            $table->timestamp('released_at')->nullable()->after('moderation_status');
            $table->boolean('certificate_eligible')->default(false)->after('released_at');
            $table->boolean('progression_eligible')->default(false)->after('certificate_eligible');
            $table->boolean('graduation_eligible')->default(false)->after('progression_eligible');
        });
    }

    public function down(): void
    {
        Schema::table('course_attempts', function (Blueprint $table) {
            $table->dropColumn(['assessment_breakdown', 'moderation_status', 'released_at', 'certificate_eligible', 'progression_eligible', 'graduation_eligible']);
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropForeign(['module_id']);
            $table->dropConstrainedForeignId('assessment_component_id');
            $table->dropColumn(['module_id', 'attempt_no', 'score', 'status', 'exam_booking_confirmed', 'exam_clinic_completed_at', 'moderation_status', 'released_at']);
        });

        Schema::table('exam_questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('question_bank_id');
            $table->dropColumn(['difficulty', 'outcomes']);
        });

        Schema::table('assignment_submissions', function (Blueprint $table) {
            $table->dropUnique(['assignment_id', 'student_id', 'attempt_no']);
            $table->dropColumn(['attempt_no', 'percentage', 'rubric_scores', 'moderation_status', 'released_at']);
            $table->unique(['assignment_id', 'student_id']);
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assessment_component_id');
            $table->dropColumn(['weight', 'pass_mark', 'max_attempts', 'rubric', 'moderation_status', 'results_release_at']);
        });
    }
};
