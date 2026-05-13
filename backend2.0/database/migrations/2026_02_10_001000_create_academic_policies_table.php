<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('pass_mark')->default(50);
            $table->unsignedInteger('exam_minimum')->nullable();
            $table->string('gpa_scale_type')->default('4.0');
            $table->json('grade_bands');
            $table->string('repeat_rule')->default('best');
            $table->unsignedInteger('max_attempts')->default(3);
            $table->boolean('include_failed_in_gpa')->default(true);
            $table->boolean('include_withdrawn_in_gpa')->default(false);
            $table->string('credit_award_policy')->default('pass_only');
            $table->unsignedInteger('condoned_mark')->nullable();
            $table->json('progression_policy')->nullable();
            $table->json('holds_policy')->nullable();
            $table->unsignedInteger('rounding_decimals')->default(2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_policies');
    }
};
