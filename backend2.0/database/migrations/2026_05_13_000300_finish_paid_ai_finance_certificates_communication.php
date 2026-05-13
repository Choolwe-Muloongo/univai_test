<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('instructor_course_sources')) {
            Schema::create('instructor_course_sources', function (Blueprint $table) {
                $table->id();
                $table->foreignId('instructor_id')->nullable()->constrained('instructors')->nullOnDelete();
                $table->string('course_id')->nullable();
                $table->string('title');
                $table->string('source_type')->default('document');
                $table->string('file_path')->nullable();
                $table->longText('extracted_text')->nullable();
                $table->string('status')->default('uploaded');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_ai_generations')) {
            Schema::create('instructor_ai_generations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('instructor_id')->nullable()->constrained('instructors')->nullOnDelete();
                $table->foreignId('package_sale_id')->nullable()->constrained('instructor_ai_package_sales')->nullOnDelete();
                $table->string('course_id')->nullable();
                $table->string('generation_type')->default('course_outline');
                $table->json('source_ids')->nullable();
                $table->string('title')->nullable();
                $table->longText('prompt')->nullable();
                $table->longText('output')->nullable();
                $table->string('status')->default('ai_generated');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('course_review_submissions')) {
            Schema::create('course_review_submissions', function (Blueprint $table) {
                $table->id();
                $table->string('course_id')->nullable();
                $table->string('owner_type')->default('univai');
                $table->unsignedBigInteger('owner_id')->nullable();
                $table->string('status')->default('submitted_for_review');
                $table->text('review_notes')->nullable();
                $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('fee_rules')) {
            Schema::create('fee_rules', function (Blueprint $table) {
                $table->id();
                $table->string('fee_type');
                $table->string('name');
                $table->string('applies_to_type')->nullable();
                $table->string('applies_to_id')->nullable();
                $table->decimal('amount', 10, 2)->default(0);
                $table->string('currency')->default('ZMW');
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('platform_invoices')) {
            Schema::create('platform_invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('invoice_number')->unique();
                $table->string('source_type')->nullable();
                $table->string('source_id')->nullable();
                $table->decimal('amount', 10, 2)->default(0);
                $table->string('currency')->default('ZMW');
                $table->string('status')->default('pending');
                $table->date('due_date')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('platform_payments')) {
            Schema::create('platform_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_id')->nullable()->constrained('platform_invoices')->nullOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('payment_type')->nullable();
                $table->decimal('amount', 10, 2)->default(0);
                $table->string('currency')->default('ZMW');
                $table->string('provider')->nullable();
                $table->string('reference')->nullable();
                $table->string('status')->default('pending');
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('certificates')) {
            Schema::create('certificates', function (Blueprint $table) {
                $table->id();
                $table->string('certificate_number')->unique();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('certificate_type')->default('completion');
                $table->string('source_type')->nullable();
                $table->string('source_id')->nullable();
                $table->string('student_name');
                $table->string('title');
                $table->string('issuer')->default('UnivAI');
                $table->string('verification_url')->nullable();
                $table->string('qr_code_path')->nullable();
                $table->date('issued_at')->nullable();
                $table->string('status')->default('issued');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('certificate_eligibility_checks')) {
            Schema::create('certificate_eligibility_checks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('source_type');
                $table->string('source_id')->nullable();
                $table->json('criteria')->nullable();
                $table->boolean('is_eligible')->default(false);
                $table->text('notes')->nullable();
                $table->timestamp('checked_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('message_templates')) {
            Schema::create('message_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('channel')->default('email');
                $table->string('subject')->nullable();
                $table->longText('body');
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('admin_announcements')) {
            Schema::create('admin_announcements', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->longText('body');
                $table->string('audience')->default('all_learners');
                $table->string('status')->default('draft');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('scheduled_at')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('notification_delivery_logs')) {
            Schema::create('notification_delivery_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('recipient')->nullable();
                $table->string('channel')->default('email');
                $table->string('subject')->nullable();
                $table->string('status')->default('queued');
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('saved_reports')) {
            Schema::create('saved_reports', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('report_type');
                $table->json('filters')->nullable();
                $table->json('summary')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_reports');
        Schema::dropIfExists('notification_delivery_logs');
        Schema::dropIfExists('admin_announcements');
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('certificate_eligibility_checks');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('platform_payments');
        Schema::dropIfExists('platform_invoices');
        Schema::dropIfExists('fee_rules');
        Schema::dropIfExists('course_review_submissions');
        Schema::dropIfExists('instructor_ai_generations');
        Schema::dropIfExists('instructor_course_sources');
    }
};
