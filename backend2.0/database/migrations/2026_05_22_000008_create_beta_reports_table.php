<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('beta_reports')) {
            return;
        }

        Schema::create('beta_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type')->default('error')->index();
            $table->string('source')->default('student')->index();
            $table->string('severity')->default('medium')->index();
            $table->string('status')->default('open')->index();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('page_url')->nullable();
            $table->string('browser')->nullable();
            $table->string('device')->nullable();
            $table->string('error_name')->nullable();
            $table->longText('error_message')->nullable();
            $table->longText('stack_trace')->nullable();
            $table->json('context')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beta_reports');
    }
};
