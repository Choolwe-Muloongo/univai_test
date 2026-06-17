<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->indexIfColumnsExist('invoices', ['student_id', 'intake_id', 'type', 'status'], 'invoices_student_intake_type_status_idx');
        $this->indexIfColumnsExist('invoices', ['student_id', 'status'], 'invoices_student_status_idx');
        $this->indexIfColumnsExist('enrollments', ['user_id', 'intake_id', 'status'], 'enrollments_user_intake_status_idx');
        $this->indexIfColumnsExist('enrollments', ['intake_id', 'user_id'], 'enrollments_intake_user_idx');
        $this->indexIfColumnsExist('course_sessions', ['intake_id', 'delivery_mode', 'created_at'], 'course_sessions_intake_mode_created_idx');
        $this->indexIfColumnsExist('lesson_documents', ['lesson_id', 'status'], 'lesson_documents_lesson_status_idx');
        $this->indexIfColumnsExist('lesson_documents', ['status', 'created_at'], 'lesson_documents_status_created_idx');
        $this->indexIfColumnsExist('short_course_lesson_progress', ['student_id', 'short_course_id'], 'sclp_student_course_idx');
        $this->indexIfColumnsExist('short_course_lesson_progress', ['short_course_id', 'lesson_id'], 'sclp_course_lesson_idx');
        $this->indexIfColumnsExist('short_course_lessons', ['short_course_id', 'sort_order'], 'short_course_lessons_course_order_idx');
        $this->indexIfColumnsExist('exam_questions', ['course_id', 'difficulty', 'question_type'], 'exam_questions_course_diff_type_idx');
        $this->indexIfColumnsExist('exam_questions', ['course_id', 'lesson_id'], 'exam_questions_course_lesson_idx');
    }

    public function down(): void
    {
        $this->dropIndexIfTableExists('exam_questions', 'exam_questions_course_diff_type_idx');
        $this->dropIndexIfTableExists('exam_questions', 'exam_questions_course_lesson_idx');
        $this->dropIndexIfTableExists('short_course_lessons', 'short_course_lessons_course_order_idx');
        $this->dropIndexIfTableExists('short_course_lesson_progress', 'sclp_student_course_idx');
        $this->dropIndexIfTableExists('short_course_lesson_progress', 'sclp_course_lesson_idx');
        $this->dropIndexIfTableExists('lesson_documents', 'lesson_documents_lesson_status_idx');
        $this->dropIndexIfTableExists('lesson_documents', 'lesson_documents_status_created_idx');
        $this->dropIndexIfTableExists('course_sessions', 'course_sessions_intake_mode_created_idx');
        $this->dropIndexIfTableExists('enrollments', 'enrollments_user_intake_status_idx');
        $this->dropIndexIfTableExists('enrollments', 'enrollments_intake_user_idx');
        $this->dropIndexIfTableExists('invoices', 'invoices_student_intake_type_status_idx');
        $this->dropIndexIfTableExists('invoices', 'invoices_student_status_idx');
    }

    private function indexIfColumnsExist(string $tableName, array $columns, string $indexName): void
    {
        if (!Schema::hasTable($tableName)) {
            return;
        }

        foreach ($columns as $column) {
            if (!Schema::hasColumn($tableName, $column)) {
                return;
            }
        }

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
            $table->index($columns, $indexName);
        });
    }

    private function dropIndexIfTableExists(string $tableName, string $indexName): void
    {
        if (!Schema::hasTable($tableName)) {
            return;
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        } catch (Throwable) {
            // Some databases may not have received every optional index because the guarded columns were absent.
        }
    }
};
