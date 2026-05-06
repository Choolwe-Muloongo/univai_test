<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_banks', function (Blueprint $table) {
            $table->id();
            $table->string('module_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('outcomes')->nullable();
            $table->json('selection_rules')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('program_modules')->cascadeOnDelete();
            $table->index(['module_id', 'status']);
        });

        Schema::create('assessment_blueprints', function (Blueprint $table) {
            $table->id();
            $table->string('module_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('total_weight', 5, 2)->default(100);
            $table->decimal('pass_mark', 5, 2)->default(50);
            $table->unsignedInteger('max_attempts')->default(3);
            $table->json('pass_rules')->nullable();
            $table->json('exam_clinic_rules')->nullable();
            $table->json('moderation_rules')->nullable();
            $table->json('result_release_rules')->nullable();
            $table->json('progression_rules')->nullable();
            $table->json('certificate_rules')->nullable();
            $table->json('graduation_rules')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('program_modules')->cascadeOnDelete();
            $table->unique('module_id');
            $table->index(['status', 'module_id']);
        });

        Schema::create('assessment_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_blueprint_id')->constrained('assessment_blueprints')->cascadeOnDelete();
            $table->string('type')->default('assignment');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('weight', 5, 2);
            $table->decimal('pass_mark', 5, 2)->nullable();
            $table->unsignedInteger('max_attempts')->nullable();
            $table->boolean('requires_exam_booking')->default(false);
            $table->boolean('requires_exam_clinic')->default(false);
            $table->foreignId('question_bank_id')->nullable()->constrained('question_banks')->nullOnDelete();
            $table->json('rubric')->nullable();
            $table->json('grading_rules')->nullable();
            $table->json('moderation_rules')->nullable();
            $table->timestamp('opens_at')->nullable();
            $table->timestamp('closes_at')->nullable();
            $table->timestamp('results_release_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->index(['assessment_blueprint_id', 'type', 'status']);
        });

        Schema::create('assessment_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_component_id')->constrained('assessment_components')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('booked_for')->nullable();
            $table->string('status')->default('booked');
            $table->timestamp('clinic_completed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['assessment_component_id', 'student_id']);
            $table->index(['student_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_bookings');
        Schema::dropIfExists('assessment_components');
        Schema::dropIfExists('assessment_blueprints');
        Schema::dropIfExists('question_banks');
    }
};
