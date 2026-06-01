<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('short_course_blueprints', function (Blueprint $table) {
            $table->id();
            $table->string('course_id');
            $table->json('blueprint');
            $table->string('source_mode')->nullable();
            $table->string('programme_title')->nullable();
            $table->string('programme_course_title')->nullable();
            $table->timestamps();

            $table->unique('course_id');
            $table->foreign('course_id')->references('id')->on('short_courses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_course_blueprints');
    }
};
