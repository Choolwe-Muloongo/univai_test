<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('short_courses')) {
            Schema::table('short_courses', function (Blueprint $table) {
                if (!Schema::hasColumn('short_courses', 'certificate_fee')) {
                    $table->decimal('certificate_fee', 10, 2)->default(15)->after('currency');
                }
                if (!Schema::hasColumn('short_courses', 'certificate_currency')) {
                    $table->string('certificate_currency', 3)->default('ZMW')->after('certificate_fee');
                }
                if (!Schema::hasColumn('short_courses', 'status')) {
                    $table->string('status')->default('draft')->after('image_id');
                }
                if (!Schema::hasColumn('short_courses', 'review_status')) {
                    $table->string('review_status')->default('needs_review')->after('status');
                }
                if (!Schema::hasColumn('short_courses', 'owner_type')) {
                    $table->string('owner_type')->default('univai')->after('review_status');
                }
                if (!Schema::hasColumn('short_courses', 'owner_id')) {
                    $table->unsignedBigInteger('owner_id')->nullable()->after('owner_type');
                }
            });
        }

        if (!Schema::hasTable('lessons')) {
            Schema::create('lessons', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('title');
                $table->text('summary')->nullable();
                $table->unsignedInteger('display_order')->default(0);
                $table->string('publication_status')->default('draft');
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('learning_objects')) {
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
                $table->string('review_status')->default('needs_review');
                $table->string('publication_status')->default('draft');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->timestamp('retracted_at')->nullable();
                $table->text('content')->nullable();
                $table->string('video_url')->nullable();
                $table->json('quiz')->nullable();
                $table->text('exercise')->nullable();
                $table->timestamps();

                $table->index(['type', 'review_status', 'publication_status']);
                $table->index(['is_current', 'is_reusable']);
            });
        }

        if (!Schema::hasTable('short_course_lessons')) {
            Schema::create('short_course_lessons', function (Blueprint $table) {
                $table->id();
                $table->string('short_course_id');
                $table->string('lesson_id');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->foreign('short_course_id')->references('id')->on('short_courses')->cascadeOnDelete();
                $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
                $table->unique(['short_course_id', 'lesson_id']);
            });
        }

        if (!Schema::hasTable('lesson_learning_objects')) {
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
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('short_courses')) {
            Schema::table('short_courses', function (Blueprint $table) {
                foreach (['owner_id', 'owner_type', 'review_status', 'status'] as $column) {
                    if (Schema::hasColumn('short_courses', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
