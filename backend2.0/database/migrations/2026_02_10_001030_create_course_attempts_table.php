<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('module_id');
            $table->string('intake_id')->nullable();
            $table->unsignedInteger('attempt_no')->default(1);
            $table->decimal('final_percentage', 5, 2)->nullable();
            $table->decimal('exam_score', 5, 2)->nullable();
            $table->string('letter_grade')->nullable();
            $table->decimal('grade_points', 4, 2)->nullable();
            $table->unsignedInteger('credits_attempted')->default(0);
            $table->unsignedInteger('credits_earned')->default(0);
            $table->string('status')->default('pending');
            $table->string('result_status')->default('draft');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('program_modules')->cascadeOnDelete();
            $table->foreign('intake_id')->references('id')->on('intakes')->nullOnDelete();
            $table->unique(['student_id', 'module_id', 'attempt_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_attempts');
    }
};
