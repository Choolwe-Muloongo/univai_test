<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index(['student_id', 'intake_id', 'type', 'status'], 'invoices_student_intake_type_status_idx');
                $table->index(['student_id', 'status'], 'invoices_student_status_idx');
            });
        }

        if (Schema::hasTable('enrollments')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->index(['user_id', 'intake_id', 'status'], 'enrollments_user_intake_status_idx');
                $table->index(['intake_id', 'user_id'], 'enrollments_intake_user_idx');
            });
        }

        if (Schema::hasTable('course_sessions')) {
            Schema::table('course_sessions', function (Blueprint $table) {
                $table->index(['intake_id', 'delivery_mode', 'created_at'], 'course_sessions_intake_mode_created_idx');
            });
        }

        if (Schema::hasTable('lesson_documents')) {
            Schema::table('lesson_documents', function (Blueprint $table) {
                $table->index(['lesson_id', 'status'], 'lesson_documents_lesson_status_idx');
                $table->index(['status', 'created_at'], 'lesson_documents_status_created_idx');
            });
        }

        if (Schema::hasTable('short_course_lesson_progress')) {
            Schema::table('short_course_lesson_progress', function (Blueprint $table) {
                $table->index(['student_id', 'short_course_id'], 'sclp_student_course_idx');
                $table->index(['short_course_id', 'lesson_id'], 'sclp_course_lesson_idx');
            });
        }

        if (Schema::hasTable('short_course_lessons')) {
            Schema::table('short_course_lessons', function (Blueprint $table) {
                $table->index(['short_course_id', 'sort_order'], 'short_course_lessons_course_order_idx');
            });
        }

        if (Schema::hasTable('exam_questions')) {
            Schema::table('exam_questions', function (Blueprint $table) {
                $table->index(['course_id', 'difficulty', 'question_type'], 'exam_questions_course_diff_type_idx');
                $table->index(['course_id', 'lesson_id'], 'exam_questions_course_lesson_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('exam_questions')) {
            Schema::table('exam_questions', function (Blueprint $table) {
                $table->dropIndex('exam_questions_course_diff_type_idx');
                $table->dropIndex('exam_questions_course_lesson_idx');
            });
        }

        if (Schema::hasTable('short_course_lessons')) {
            Schema::table('short_course_lessons', function (Blueprint $table) {
                $table->dropIndex('short_course_lessons_course_order_idx');
            });
        }

        if (Schema::hasTable('short_course_lesson_progress')) {
            Schema::table('short_course_lesson_progress', function (Blueprint $table) {
                $table->dropIndex('sclp_student_course_idx');
                $table->dropIndex('sclp_course_lesson_idx');
            });
        }

        if (Schema::hasTable('lesson_documents')) {
            Schema::table('lesson_documents', function (Blueprint $table) {
                $table->dropIndex('lesson_documents_lesson_status_idx');
                $table->dropIndex('lesson_documents_status_created_idx');
            });
        }

        if (Schema::hasTable('course_sessions')) {
            Schema::table('course_sessions', function (Blueprint $table) {
                $table->dropIndex('course_sessions_intake_mode_created_idx');
            });
        }

        if (Schema::hasTable('enrollments')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropIndex('enrollments_user_intake_status_idx');
                $table->dropIndex('enrollments_intake_user_idx');
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropIndex('invoices_student_intake_type_status_idx');
                $table->dropIndex('invoices_student_status_idx');
            });
        }
    }
};
