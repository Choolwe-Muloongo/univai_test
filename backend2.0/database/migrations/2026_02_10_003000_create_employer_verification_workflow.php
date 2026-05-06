<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employer_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('contact_email')->index();
            $table->string('organization_name');
            $table->string('workflow_type')->default('employer');
            $table->string('status')->default('pending')->index();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('job_postings', function (Blueprint $table) {
            $table->foreignId('employer_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });

        Schema::table('research_opportunities', function (Blueprint $table) {
            $table->foreignId('employer_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('research_opportunities', function (Blueprint $table) {
            $table->dropConstrainedForeignId('employer_id');
        });

        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('employer_id');
        });

        Schema::dropIfExists('employer_verifications');
    }
};
