<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureCatalogTablesExist();

        if (Schema::hasTable('short_courses')) {
            Schema::table('short_courses', function (Blueprint $table) {
                if (!Schema::hasColumn('short_courses', 'certificate_fee')) {
                    $table->decimal('certificate_fee', 10, 2)->default(15)->after('currency');
                }
                if (!Schema::hasColumn('short_courses', 'certificate_currency')) {
                    $table->string('certificate_currency', 3)->default('USD')->after('certificate_fee');
                }
            });
        }

        if (Schema::hasTable('programs')) {
            Schema::table('programs', function (Blueprint $table) {
                if (!Schema::hasColumn('programs', 'qualification_level_id')) {
                    $table->string('qualification_level_id')->nullable()->after('school_id');
                }
                if (!Schema::hasColumn('programs', 'credits')) {
                    $table->unsignedInteger('credits')->nullable()->after('description');
                }
                if (!Schema::hasColumn('programs', 'duration_months')) {
                    $table->unsignedInteger('duration_months')->nullable()->after('credits');
                }
                if (!Schema::hasColumn('programs', 'admission_requirements')) {
                    $table->text('admission_requirements')->nullable()->after('duration_months');
                }
                if (!Schema::hasColumn('programs', 'delivery_modes')) {
                    $table->json('delivery_modes')->nullable()->after('admission_requirements');
                }
                if (!Schema::hasColumn('programs', 'exam_clinic_required')) {
                    $table->boolean('exam_clinic_required')->default(false)->after('delivery_modes');
                }
                if (!Schema::hasColumn('programs', 'requires_accreditation_approval')) {
                    $table->boolean('requires_accreditation_approval')->default(false)->after('exam_clinic_required');
                }
                if (!Schema::hasColumn('programs', 'accreditation_approved_at')) {
                    $table->timestamp('accreditation_approved_at')->nullable()->after('requires_accreditation_approval');
                }
                if (!Schema::hasColumn('programs', 'launch_status')) {
                    $table->string('launch_status')->default('draft')->after('accreditation_approved_at');
                }
                if (!Schema::hasColumn('programs', 'application_fee')) {
                    $table->decimal('application_fee', 10, 2)->default(0)->after('launch_status');
                }
                if (!Schema::hasColumn('programs', 'application_currency')) {
                    $table->string('application_currency', 3)->default('ZMW')->after('application_fee');
                }
                if (!Schema::hasColumn('programs', 'tuition_fee')) {
                    $table->decimal('tuition_fee', 10, 2)->default(0)->after('application_currency');
                }
                if (!Schema::hasColumn('programs', 'tuition_currency')) {
                    $table->string('tuition_currency', 3)->default('ZMW')->after('tuition_fee');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('programs')) {
            Schema::table('programs', function (Blueprint $table) {
                foreach (['tuition_currency', 'tuition_fee', 'application_currency', 'application_fee'] as $column) {
                    if (Schema::hasColumn('programs', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('short_courses')) {
            Schema::table('short_courses', function (Blueprint $table) {
                foreach (['certificate_currency', 'certificate_fee'] as $column) {
                    if (Schema::hasColumn('short_courses', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }

    private function ensureCatalogTablesExist(): void
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

        if (!Schema::hasTable('programs')) {
            Schema::create('programs', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('school_id');
                $table->string('qualification_level_id')->nullable();
                $table->string('title');
                $table->text('description');
                $table->unsignedInteger('credits')->nullable();
                $table->unsignedInteger('duration_months')->nullable();
                $table->text('admission_requirements')->nullable();
                $table->json('delivery_modes')->nullable();
                $table->boolean('exam_clinic_required')->default(false);
                $table->boolean('requires_accreditation_approval')->default(false);
                $table->timestamp('accreditation_approved_at')->nullable();
                $table->string('launch_status')->default('draft');
                $table->string('award_type')->default('degree');
                $table->string('qualification_level')->nullable();
                $table->unsignedInteger('duration_semesters')->default(1);
                $table->unsignedInteger('total_credits')->default(0);
                $table->string('delivery_mode')->default('online');
                $table->integer('progress')->default(0);
                $table->string('image_id')->nullable();
                $table->decimal('application_fee', 10, 2)->default(0);
                $table->string('application_currency', 3)->default('ZMW');
                $table->decimal('tuition_fee', 10, 2)->default(0);
                $table->string('tuition_currency', 3)->default('ZMW');
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

        if (!Schema::hasTable('short_course_lessons')) {
            Schema::create('short_course_lessons', function (Blueprint $table) {
                $table->id();
                $table->string('short_course_id');
                $table->string('lesson_id');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->foreign('short_course_id')->references('id')->on('short_courses')->cascadeOnDelete();
                $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
                $table->unique(['short_course_id', 'lesson_id']);
            });
        }
    }
};
