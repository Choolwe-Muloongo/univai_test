<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lab_id')->nullable()->constrained('research_labs')->nullOnDelete();
            $table->string('title');
            $table->string('authors')->nullable();
            $table->string('venue')->nullable();
            $table->date('published_at')->nullable();
            $table->string('link')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_publications');
    }
};
