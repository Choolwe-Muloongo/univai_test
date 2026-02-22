<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intakes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('program_id');
            $table->string('name');
            $table->string('delivery_mode');
            $table->string('campus')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();

            $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intakes');
    }
};
