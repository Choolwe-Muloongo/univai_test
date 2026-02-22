<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('course_id');
            $table->string('intake_id');
            $table->string('title');
            $table->string('session_type')->default('lecture');
            $table->string('day_of_week')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->string('meeting_url')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('intake_id')->references('id')->on('intakes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_sessions');
    }
};
