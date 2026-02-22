<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('course_id');
            $table->unsignedInteger('student_count')->default(0);
            $table->unsignedInteger('avg_progress')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_metrics');
    }
};
