<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_course_generation_jobs')) {
            Schema::create('ai_course_generation_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('source_type');
                $table->string('source_id')->nullable();
                $table->string('generation_mode')->default('full_course');
                $table->longText('prompt')->nullable();
                $table->json('context_snapshot')->nullable();
                $table->json('ai_output_json')->nullable();
                $table->longText('raw_output')->nullable();
                $table->string('status')->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('review_notes')->nullable();
                $table->timestamps();
                $table->index(['source_type', 'source_id']);
                $table->index(['status', 'generation_mode']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_course_generation_jobs');
    }
};
