<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_questions', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_questions', 'lesson_id')) {
                $table->string('lesson_id')->nullable()->after('course_id')->index();
            }
            if (!Schema::hasColumn('exam_questions', 'question_type')) {
                $table->string('question_type')->default('mcq')->after('question');
            }
            if (!Schema::hasColumn('exam_questions', 'explanation')) {
                $table->text('explanation')->nullable()->after('answer');
            }
            if (!Schema::hasColumn('exam_questions', 'time_seconds')) {
                $table->unsignedInteger('time_seconds')->default(60)->after('difficulty');
            }
            if (!Schema::hasColumn('exam_questions', 'source')) {
                $table->string('source')->default('manual')->after('time_seconds');
            }
            if (!Schema::hasColumn('exam_questions', 'tags')) {
                $table->json('tags')->nullable()->after('source');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_questions', function (Blueprint $table) {
            foreach (['lesson_id', 'question_type', 'explanation', 'time_seconds', 'source', 'tags'] as $column) {
                if (Schema::hasColumn('exam_questions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
