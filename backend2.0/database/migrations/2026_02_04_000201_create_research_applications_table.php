<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_applications', function (Blueprint $table) {
            $table->id();
            $table->string('research_id');
            $table->string('full_name');
            $table->string('email');
            $table->text('experience')->nullable();
            $table->string('availability')->nullable();
            $table->string('status')->default('submitted');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_applications');
    }
};
