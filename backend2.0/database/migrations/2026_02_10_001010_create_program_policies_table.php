<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_policies', function (Blueprint $table) {
            $table->id();
            $table->string('program_id');
            $table->foreignId('policy_id')->constrained('academic_policies')->cascadeOnDelete();
            $table->timestamps();

            $table->unique('program_id');
            $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_policies');
    }
};
