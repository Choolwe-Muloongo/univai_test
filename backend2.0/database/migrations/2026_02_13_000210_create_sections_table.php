<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('cohort_id');
            $table->string('name');
            $table->string('code')->nullable();
            $table->json('timetable')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();

            $table->foreign('cohort_id')->references('id')->on('cohorts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
