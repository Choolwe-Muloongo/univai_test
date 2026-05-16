<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('academic_dataset_exports')) {
            Schema::create('academic_dataset_exports', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->string('dataset_type')->default('univai_academic_content');
                $table->string('status')->default('ready');
                $table->json('filters')->nullable();
                $table->unsignedInteger('record_count')->default(0);
                $table->string('file_path')->nullable();
                $table->timestamp('exported_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_dataset_exports');
    }
};
