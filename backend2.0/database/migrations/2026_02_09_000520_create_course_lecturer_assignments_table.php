<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_lecturer_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('course_id');
            $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
            $table->string('intake_id')->nullable();
            $table->string('role')->default('lead');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('intake_id')->references('id')->on('intakes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_lecturer_assignments');
    }
};
