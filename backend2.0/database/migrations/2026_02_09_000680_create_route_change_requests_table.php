<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('current_intake_id')->nullable();
            $table->string('requested_intake_id');
            $table->text('reason')->nullable();
            $table->string('status')->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->foreign('current_intake_id')->references('id')->on('intakes')->nullOnDelete();
            $table->foreign('requested_intake_id')->references('id')->on('intakes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_change_requests');
    }
};
