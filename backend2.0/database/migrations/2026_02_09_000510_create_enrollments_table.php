<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('intake_id');
            $table->string('status')->default('active');
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamps();

            $table->foreign('intake_id')->references('id')->on('intakes')->cascadeOnDelete();
            $table->unique(['user_id', 'intake_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
