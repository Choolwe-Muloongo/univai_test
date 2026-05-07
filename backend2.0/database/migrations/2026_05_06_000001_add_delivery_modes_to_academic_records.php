<?php

use App\Support\DeliveryModes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureAcademicTablesExist();

        if (Schema::hasTable('programs') && !Schema::hasColumn('programs', 'supported_delivery_modes')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->json('supported_delivery_modes')->nullable()->after('image_id');
            });
        }

        if (Schema::hasTable('program_modules') && !Schema::hasColumn('program_modules', 'supported_delivery_modes')) {
            Schema::table('program_modules', function (Blueprint $table) {
                $table->json('supported_delivery_modes')->nullable()->after('is_exam_available');
            });
        }

        if (Schema::hasTable('enrollments') && !Schema::hasColumn('enrollments', 'delivery_mode')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->string('delivery_mode')->default(DeliveryModes::HYBRID)->after('selected_modules');
            });
        }

        if (Schema::hasTable('course_sessions') && !Schema::hasColumn('course_sessions', 'delivery_mode')) {
            Schema::table('course_sessions', function (Blueprint $table) {
                $table->string('delivery_mode')->default(DeliveryModes::HYBRID)->after('session_type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('course_sessions') && Schema::hasColumn('course_sessions', 'delivery_mode')) {
            Schema::table('course_sessions', function (Blueprint $table) {
                $table->dropColumn('delivery_mode');
            });
        }

        if (Schema::hasTable('enrollments') && Schema::hasColumn('enrollments', 'delivery_mode')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropColumn('delivery_mode');
            });
        }

        if (Schema::hasTable('program_modules') && Schema::hasColumn('program_modules', 'supported_delivery_modes')) {
            Schema::table('program_modules', function (Blueprint $table) {
                $table->dropColumn('supported_delivery_modes');
            });
        }

        if (Schema::hasTable('programs') && Schema::hasColumn('programs', 'supported_delivery_modes')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->dropColumn('supported_delivery_modes');
            });
        }
    }

    private function ensureAcademicTablesExist(): void
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
                $table->timestamps();
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
            });
        }


        if (!Schema::hasTable('program_modules')) {
            Schema::create('program_modules', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('program_id');
                $table->string('curriculum_version_id')->nullable();
                $table->string('code')->nullable();
                $table->string('title');
                $table->text('description');
                $table->unsignedInteger('credits')->default(3);
                $table->integer('progress')->default(0);
                $table->unsignedInteger('semester')->default(1);
                $table->boolean('is_core')->default(true);
                $table->string('track')->nullable();
                $table->boolean('is_exam_available')->default(false);
                $table->unsignedInteger('hours_per_week')->nullable();
                $table->timestamps();

                $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('program_modules')) {
            Schema::table('program_modules', function (Blueprint $table) {
                if (!Schema::hasColumn('program_modules', 'curriculum_version_id')) {
                    $table->string('curriculum_version_id')->nullable()->after('program_id');
                }
                if (!Schema::hasColumn('program_modules', 'code')) {
                    $table->string('code')->nullable()->after('curriculum_version_id');
                }
                if (!Schema::hasColumn('program_modules', 'credits')) {
                    $table->unsignedInteger('credits')->default(3)->after('description');
                }
                if (!Schema::hasColumn('program_modules', 'is_core')) {
                    $table->boolean('is_core')->default(true)->after('semester');
                }
                if (!Schema::hasColumn('program_modules', 'track')) {
                    $table->string('track')->nullable()->after('is_core');
                }
                if (!Schema::hasColumn('program_modules', 'hours_per_week')) {
                    $table->unsignedInteger('hours_per_week')->nullable()->after('credits');
                }
            });
        }


        if (!Schema::hasTable('intakes')) {
            Schema::create('intakes', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('program_id');
                $table->string('name');
                $table->string('delivery_mode');
                $table->string('campus')->nullable();
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->string('status')->default('open');
                $table->timestamps();

                $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('enrollments')) {
            Schema::create('enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('intake_id');
                $table->json('selected_modules')->nullable();
                $table->string('status')->default('active');
                $table->timestamp('enrolled_at')->nullable();
                $table->timestamp('confirmed_at')->nullable();
                $table->timestamps();

                $table->foreign('intake_id')->references('id')->on('intakes')->cascadeOnDelete();
                $table->unique(['user_id', 'intake_id']);
            });
        } elseif (!Schema::hasColumn('enrollments', 'selected_modules')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->json('selected_modules')->nullable()->after('intake_id');
            });
        }

        if (!Schema::hasTable('course_sessions')) {
            Schema::create('course_sessions', function (Blueprint $table) {
                $table->id();
                $table->string('course_id');
                $table->string('intake_id');
                $table->string('title');
                $table->string('session_type')->default('lecture');
                $table->string('day_of_week')->nullable();
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->string('location')->nullable();
                $table->string('meeting_url')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->foreign('course_id')->references('id')->on('short_courses')->cascadeOnDelete();
                $table->foreign('intake_id')->references('id')->on('intakes')->cascadeOnDelete();
            });
        }
    }
};
