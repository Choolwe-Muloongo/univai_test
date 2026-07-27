<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lab_id')->nullable()->constrained('research_labs')->nullOnDelete();
            $table->string('title');
            $table->string('funder')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('currency', 8)->default('USD');
            $table->string('status')->default('applied');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_grants');
    }
};
