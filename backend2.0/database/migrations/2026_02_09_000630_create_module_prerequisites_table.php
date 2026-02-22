<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->string('module_id');
            $table->string('prerequisite_module_id');
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('program_modules')->cascadeOnDelete();
            $table->foreign('prerequisite_module_id')->references('id')->on('program_modules')->cascadeOnDelete();
            $table->unique(['module_id', 'prerequisite_module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_prerequisites');
    }
};
