<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->string('module_id');
            $table->string('course_id')->nullable();
            $table->string('title');
            $table->text('description');
            $table->text('instructions')->nullable();
            $table->string('assignment_type')->default('assignment');
            $table->unsignedInteger('max_points')->default(100);
            $table->timestamp('due_date')->nullable();
            $table->string('status')->default('published');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('program_modules')->cascadeOnDelete();
            $table->index(['course_id', 'module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
