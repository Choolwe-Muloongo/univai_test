<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_documents', function (Blueprint $table) {
            $table->id();
            $table->string('lesson_id');
            $table->string('intake_id')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('storage_path')->nullable();
            $table->longText('extracted_text')->nullable();
            $table->timestamps();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->foreign('intake_id')->references('id')->on('intakes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_documents');
    }
};
