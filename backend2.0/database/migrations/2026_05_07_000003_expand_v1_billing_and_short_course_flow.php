<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('invoices', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            if (!Schema::hasColumn('invoices', 'currency')) {
                $table->string('currency', 3)->default('ZMW')->after('amount');
            }
            if (!Schema::hasColumn('invoices', 'type')) {
                $table->string('type')->default('tuition_fee')->after('status')->index();
            }
            if (!Schema::hasColumn('invoices', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->unique()->after('type');
            }
            if (!Schema::hasColumn('invoices', 'checkout_url')) {
                $table->text('checkout_url')->nullable()->after('transaction_reference');
            }
            if (!Schema::hasColumn('invoices', 'metadata')) {
                $table->json('metadata')->nullable()->after('checkout_url');
            }
            if (!Schema::hasColumn('invoices', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('due_date');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'currency')) {
                $table->string('currency', 3)->default('ZMW')->after('amount');
            }
            if (!Schema::hasColumn('payments', 'provider')) {
                $table->string('provider')->default('manual')->after('method');
            }
            if (!Schema::hasColumn('payments', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->index()->after('provider');
            }
            if (!Schema::hasColumn('payments', 'payload')) {
                $table->json('payload')->nullable()->after('status');
            }
        });

        Schema::create('short_course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('short_course_id');
            $table->string('status')->default('pending_payment');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->boolean('entry_fee_paid')->default(false);
            $table->boolean('certificate_fee_paid')->default(false);
            $table->decimal('exam_score', 5, 2)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('certificate_issued_at')->nullable();
            $table->string('certificate_path')->nullable();
            $table->timestamps();

            $table->foreign('short_course_id')->references('id')->on('short_courses')->cascadeOnDelete();
            $table->unique(['student_id', 'short_course_id']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('short_course_lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('short_course_id');
            $table->string('lesson_id');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('short_course_id')->references('id')->on('short_courses')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->unique(['student_id', 'short_course_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_course_lesson_progress');
        Schema::dropIfExists('short_course_enrollments');

        Schema::table('payments', function (Blueprint $table) {
            foreach (['payload', 'transaction_reference', 'provider', 'currency'] as $column) {
                if (Schema::hasColumn('payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            foreach (['paid_at', 'metadata', 'checkout_url', 'transaction_reference', 'type', 'currency', 'description', 'uuid'] as $column) {
                if (Schema::hasColumn('invoices', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
