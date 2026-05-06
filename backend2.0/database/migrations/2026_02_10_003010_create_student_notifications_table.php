<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email')->nullable()->index();
            $table->string('channel')->default('in_app');
            $table->string('subject');
            $table->text('message');
            $table->string('target_type')->nullable();
            $table->string('target_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->foreignId('student_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });

        Schema::table('research_applications', function (Blueprint $table) {
            $table->foreignId('student_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('research_applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('student_id');
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('student_id');
        });

        Schema::dropIfExists('student_notifications');
    }
};
