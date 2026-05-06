<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cohorts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('intake_id')->nullable();
            $table->string('program_id');
            $table->string('curriculum_version_id')->nullable();
            $table->string('name');
            $table->string('delivery_mode');
            $table->string('centre')->nullable();
            $table->json('timetable')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status')->default('planning');
            $table->timestamps();

            $table->foreign('intake_id')->references('id')->on('intakes')->nullOnDelete();
            $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
            $table->foreign('curriculum_version_id')->references('id')->on('curriculum_versions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cohorts');
    }
};
