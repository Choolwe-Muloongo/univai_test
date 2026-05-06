<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('school_id');
            $table->string('title');
            $table->text('description');
            $table->integer('progress')->default(0);
            $table->string('image_id')->nullable();
            $table->timestamps();
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('school_id');
            $table->string('title');
            $table->text('description');
            $table->integer('progress')->default(0);
            $table->string('image_id')->nullable();
            $table->timestamps();
        });

        Schema::create('program_modules', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('program_id');
            $table->string('title');
            $table->text('description');
            $table->integer('progress')->default(0);
            $table->unsignedInteger('semester')->default(1);
            $table->boolean('is_exam_available')->default(false);
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('course_id');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->string('publication_status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('learning_objects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('body')->nullable();
            $table->string('asset_url')->nullable();
            $table->string('storage_path')->nullable();
            $table->string('mime_type')->nullable();
            $table->json('payload')->nullable();
            $table->json('access_rules')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->string('version_label')->nullable();
            $table->boolean('is_current')->default(true);
            $table->boolean('is_reusable')->default(true);
            $table->string('review_status')->default('draft');
            $table->string('publication_status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('retracted_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'review_status', 'publication_status']);
            $table->index(['is_current', 'is_reusable']);
        });

        Schema::create('lesson_learning_objects', function (Blueprint $table) {
            $table->id();
            $table->string('lesson_id');
            $table->string('learning_object_id');
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_required')->default(true);
            $table->json('access_rules')->nullable();
            $table->string('publication_status')->default('draft');
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->timestamps();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('learning_object_id')->references('id')->on('learning_objects')->cascadeOnDelete();
            $table->unique(['lesson_id', 'learning_object_id']);
            $table->index(['lesson_id', 'position']);
            $table->index(['publication_status', 'available_from', 'available_until']);
        });

        Schema::create('job_postings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('company');
            $table->string('location');
            $table->string('type');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('research_opportunities', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('company');
            $table->string('field');
            $table->text('description');
            $table->timestamps();
        });

        Schema::create('discussions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('author');
            $table->string('avatar')->nullable();
            $table->text('snippet');
            $table->timestamps();
        });

        Schema::create('discussion_comments', function (Blueprint $table) {
            $table->id();
            $table->string('discussion_id');
            $table->string('author');
            $table->string('avatar')->nullable();
            $table->text('content');
            $table->unsignedInteger('upvotes')->default(0);
            $table->timestamps();
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('description');
            $table->string('icon');
            $table->timestamps();
        });

        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('rank');
            $table->string('name');
            $table->string('avatar')->nullable();
            $table->string('school');
            $table->unsignedInteger('points');
            $table->timestamps();
        });

        Schema::create('consultant_applications', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('department');
            $table->string('status')->default('Pending');
            $table->string('avatar')->nullable();
            $table->json('documents')->nullable();
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('full_name');
            $table->string('email');
            $table->string('program_id');
            $table->string('school_id');
            $table->string('status')->default('submitted');
            $table->timestamp('submitted_at')->nullable();
            $table->json('subject_points')->nullable();
            $table->unsignedInteger('subject_count')->default(0);
            $table->unsignedInteger('total_points')->default(0);
            $table->string('delivery_mode')->default('hybrid');
            $table->string('learning_style')->default('traditional');
            $table->string('study_pace')->default('standard');
            $table->string('country')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('admission_fee_paid')->default(false);
            $table->timestamps();
        });

        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable();
            $table->string('exam_id');
            $table->json('result')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('consultant_applications');
        Schema::dropIfExists('leaderboard_entries');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('discussion_comments');
        Schema::dropIfExists('discussions');
        Schema::dropIfExists('research_opportunities');
        Schema::dropIfExists('job_postings');
        Schema::dropIfExists('lesson_learning_objects');
        Schema::dropIfExists('learning_objects');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('program_modules');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('schools');
    }
};
