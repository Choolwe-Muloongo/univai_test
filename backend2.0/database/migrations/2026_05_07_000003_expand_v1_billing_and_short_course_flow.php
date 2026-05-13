<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureBillingAndCatalogTablesExist();

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

        if (Schema::hasTable('payments')) {
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
        }

        if (!Schema::hasTable('short_course_enrollments')) {
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
        }

        if (!Schema::hasTable('short_course_lesson_progress')) {
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
    }


    private function ensureBillingAndCatalogTablesExist(): void
    {
        if (!Schema::hasTable('schools')) {
            Schema::create('schools', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('name');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('short_courses')) {
            Schema::create('short_courses', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('school_id');
                $table->string('title');
                $table->text('description');
                $table->string('certificate_type')->default('certificate');
                $table->string('pricing_type')->default('paid');
                $table->decimal('price', 10, 2)->default(50);
                $table->string('currency', 3)->default('ZMW');
                $table->decimal('certificate_fee', 10, 2)->default(15);
                $table->string('certificate_currency', 3)->default('USD');
                $table->unsignedInteger('duration_hours')->default(0);
                $table->string('level')->default('beginner');
                $table->integer('progress')->default(0);
                $table->string('image_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('lessons')) {
            Schema::create('lessons', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('title');
                $table->text('summary')->nullable();
                $table->unsignedInteger('display_order')->default(0);
                $table->string('publication_status')->default('draft');
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('programs')) {
            Schema::create('programs', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('school_id');
                $table->string('title');
                $table->text('description');
                $table->string('award_type')->default('degree');
                $table->string('qualification_level')->nullable();
                $table->unsignedInteger('duration_semesters')->default(1);
                $table->unsignedInteger('total_credits')->default(0);
                $table->string('delivery_mode')->default('online');
                $table->integer('progress')->default(0);
                $table->string('image_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('intakes')) {
            Schema::create('intakes', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('program_id');
                $table->string('name');
                $table->string('delivery_mode')->default('hybrid');
                $table->string('campus')->nullable();
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->string('status')->default('open');
                $table->timestamps();

                $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('intake_id')->nullable();
                $table->string('title');
                $table->decimal('amount', 10, 2);
                $table->decimal('paid_amount', 10, 2)->default(0);
                $table->string('status')->default('unpaid');
                $table->date('due_date')->nullable();
                $table->timestamps();

                $table->foreign('intake_id')->references('id')->on('intakes')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
                $table->decimal('amount', 10, 2);
                $table->string('method')->default('card');
                $table->string('status')->default('completed');
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('short_course_lesson_progress');
        Schema::dropIfExists('short_course_enrollments');

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                foreach (['payload', 'transaction_reference', 'provider', 'currency'] as $column) {
                    if (Schema::hasColumn('payments', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                foreach (['paid_at', 'metadata', 'checkout_url', 'transaction_reference', 'type', 'currency', 'description', 'uuid'] as $column) {
                    if (Schema::hasColumn('invoices', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
