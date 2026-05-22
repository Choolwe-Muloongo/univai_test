<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('exam_questions')) {
            Schema::create('exam_questions', function (Blueprint $table) {
                $table->id();
                $table->string('course_id')->nullable()->index();
                $table->string('lesson_id')->nullable()->index();
                $table->unsignedInteger('semester')->nullable()->index();
                $table->text('question');
                $table->string('question_type')->default('mcq')->index();
                $table->json('options')->nullable();
                $table->string('answer')->nullable();
                $table->text('explanation')->nullable();
                $table->string('difficulty')->default('easy')->index();
                $table->unsignedInteger('time_seconds')->default(60);
                $table->string('source')->default('manual');
                $table->json('tags')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('exam_questions', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_questions', 'lesson_id')) {
                $table->string('lesson_id')->nullable()->index()->after('course_id');
            }

            if (!Schema::hasColumn('exam_questions', 'question_type')) {
                $table->string('question_type')->default('mcq')->index()->after('question');
            }

            if (!Schema::hasColumn('exam_questions', 'explanation')) {
                $table->text('explanation')->nullable()->after('answer');
            }

            if (!Schema::hasColumn('exam_questions', 'difficulty')) {
                $table->string('difficulty')->default('easy')->index()->after('explanation');
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
        // Production repair migration: do not remove columns on rollback.
    }
};
