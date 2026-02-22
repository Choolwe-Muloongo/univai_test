<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_version_policies', function (Blueprint $table) {
            $table->id();
            $table->string('curriculum_version_id');
            $table->foreignId('policy_id')->constrained('academic_policies')->cascadeOnDelete();
            $table->timestamps();

            $table->unique('curriculum_version_id');
            $table->foreign('curriculum_version_id')
                ->references('id')
                ->on('curriculum_versions')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_version_policies');
    }
};
