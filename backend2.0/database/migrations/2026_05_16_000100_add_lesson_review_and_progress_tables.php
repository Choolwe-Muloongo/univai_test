<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lesson_versions')) {
            Schema::create('lesson_versions', function (Blueprint $table) {
                $table->id();
                $table->string('lesson_id');
                $table->unsignedInteger('version_number')->default(1);
                $table->json('content_snapshot')->nullable();
                $table->string('source')->default('manual');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
                $table->unique(['lesson_id', 'version_number']);
            });
        }

        if (!Schema::hasTable('lesson_reviews')) {
            Schema::create('lesson_reviews', function (Blueprint $table) {
                $table->id();
                $table->string('lesson_id');
                $table->string('status')->default('needs_review');
                $table->unsignedBigInteger('reviewer_id')->nullable();
                $table->text('notes')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
                $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
                $table->index(['lesson_id', 'status']);
            });
        }

        if (!Schema::hasTable('course_publication_logs')) {
            Schema::create('course_publication_logs', function (Blueprint $table) {
                $table->id();
                $table->string('source_type');
                $table->string('source_id');
                $table->unsignedBigInteger('published_by')->nullable();
                $table->string('status_before')->nullable();
                $table->string('status_after');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['source_type', 'source_id']);
            });
        }

        if (!Schema::hasTable('programme_lesson_progress')) {
            Schema::create('programme_lesson_progress', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id');
                $table->string('lesson_id');
                $table->string('course_id')->nullable();
                $table->string('program_id')->nullable();
                $table->string('module_id')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
                $table->unique(['student_id', 'lesson_id']);
                $table->index(['student_id', 'course_id']);
                $table->index(['student_id', 'program_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('programme_lesson_progress');
        Schema::dropIfExists('course_publication_logs');
        Schema::dropIfExists('lesson_reviews');
        Schema::dropIfExists('lesson_versions');
    }
};
