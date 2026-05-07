<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->repairLessonsTable();
        $this->repairProgramsTable();
        $this->repairShortCoursesTable();
        $this->repairProgramModulesTable();
        $this->repairIntakesTable();
        $this->repairCourseLecturerAssignmentsTable();
        $this->repairCourseSessionsTable();
    }

    public function down(): void
    {
        // This migration intentionally does not drop columns. It is a production
        // schema repair for columns already required by the application seeder
        // and live API pages.
    }

    private function repairLessonsTable(): void
    {
        if (!Schema::hasTable('lessons')) {
            Schema::create('lessons', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('title')->nullable();
                $table->text('summary')->nullable();
                $table->unsignedInteger('display_order')->default(0);
                $table->string('publication_status')->default('draft');
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }

        $this->addColumnIfMissing('lessons', 'summary', fn (Blueprint $table) => $table->text('summary')->nullable());
        $this->addColumnIfMissing('lessons', 'display_order', fn (Blueprint $table) => $table->unsignedInteger('display_order')->default(0));
        $this->addColumnIfMissing('lessons', 'publication_status', fn (Blueprint $table) => $table->string('publication_status')->default('draft'));
        $this->addColumnIfMissing('lessons', 'published_at', fn (Blueprint $table) => $table->timestamp('published_at')->nullable());
        $this->addTimestampsIfMissing('lessons');
    }

    private function repairProgramsTable(): void
    {
        if (!Schema::hasTable('programs')) {
            Schema::create('programs', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('school_id')->nullable();
                $table->string('qualification_level_id')->nullable();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->unsignedInteger('credits')->nullable();
                $table->unsignedInteger('duration_months')->nullable();
                $table->text('admission_requirements')->nullable();
                $table->json('delivery_modes')->nullable();
                $table->json('supported_delivery_modes')->nullable();
                $table->boolean('exam_clinic_required')->default(false);
                $table->boolean('requires_accreditation_approval')->default(false);
                $table->timestamp('accreditation_approved_at')->nullable();
                $table->string('launch_status')->default('draft');
                $table->integer('progress')->default(0);
                $table->string('image_id')->nullable();
                $table->string('award_type')->default('degree');
                $table->string('qualification_level')->nullable();
                $table->unsignedInteger('duration_semesters')->default(1);
                $table->unsignedInteger('total_credits')->default(0);
                $table->string('delivery_mode')->default('online');
                $table->decimal('application_fee', 10, 2)->default(0);
                $table->string('application_currency', 3)->default('ZMW');
                $table->decimal('tuition_fee', 10, 2)->default(0);
                $table->string('tuition_currency', 3)->default('ZMW');
                $table->timestamps();
            });
        }

        $this->addColumnIfMissing('programs', 'school_id', fn (Blueprint $table) => $table->string('school_id')->nullable());
        $this->addColumnIfMissing('programs', 'qualification_level_id', fn (Blueprint $table) => $table->string('qualification_level_id')->nullable());
        $this->addColumnIfMissing('programs', 'title', fn (Blueprint $table) => $table->string('title')->nullable());
        $this->addColumnIfMissing('programs', 'description', fn (Blueprint $table) => $table->text('description')->nullable());
        $this->addColumnIfMissing('programs', 'credits', fn (Blueprint $table) => $table->unsignedInteger('credits')->nullable());
        $this->addColumnIfMissing('programs', 'duration_months', fn (Blueprint $table) => $table->unsignedInteger('duration_months')->nullable());
        $this->addColumnIfMissing('programs', 'admission_requirements', fn (Blueprint $table) => $table->text('admission_requirements')->nullable());
        $this->addColumnIfMissing('programs', 'delivery_modes', fn (Blueprint $table) => $table->json('delivery_modes')->nullable());
        $this->addColumnIfMissing('programs', 'supported_delivery_modes', fn (Blueprint $table) => $table->json('supported_delivery_modes')->nullable());
        $this->addColumnIfMissing('programs', 'exam_clinic_required', fn (Blueprint $table) => $table->boolean('exam_clinic_required')->default(false));
        $this->addColumnIfMissing('programs', 'requires_accreditation_approval', fn (Blueprint $table) => $table->boolean('requires_accreditation_approval')->default(false));
        $this->addColumnIfMissing('programs', 'accreditation_approved_at', fn (Blueprint $table) => $table->timestamp('accreditation_approved_at')->nullable());
        $this->addColumnIfMissing('programs', 'launch_status', fn (Blueprint $table) => $table->string('launch_status')->default('draft'));
        $this->addColumnIfMissing('programs', 'progress', fn (Blueprint $table) => $table->integer('progress')->default(0));
        $this->addColumnIfMissing('programs', 'image_id', fn (Blueprint $table) => $table->string('image_id')->nullable());
        $this->addColumnIfMissing('programs', 'award_type', fn (Blueprint $table) => $table->string('award_type')->default('degree'));
        $this->addColumnIfMissing('programs', 'qualification_level', fn (Blueprint $table) => $table->string('qualification_level')->nullable());
        $this->addColumnIfMissing('programs', 'duration_semesters', fn (Blueprint $table) => $table->unsignedInteger('duration_semesters')->default(1));
        $this->addColumnIfMissing('programs', 'total_credits', fn (Blueprint $table) => $table->unsignedInteger('total_credits')->default(0));
        $this->addColumnIfMissing('programs', 'delivery_mode', fn (Blueprint $table) => $table->string('delivery_mode')->default('online'));
        $this->addColumnIfMissing('programs', 'application_fee', fn (Blueprint $table) => $table->decimal('application_fee', 10, 2)->default(0));
        $this->addColumnIfMissing('programs', 'application_currency', fn (Blueprint $table) => $table->string('application_currency', 3)->default('ZMW'));
        $this->addColumnIfMissing('programs', 'tuition_fee', fn (Blueprint $table) => $table->decimal('tuition_fee', 10, 2)->default(0));
        $this->addColumnIfMissing('programs', 'tuition_currency', fn (Blueprint $table) => $table->string('tuition_currency', 3)->default('ZMW'));
        $this->addTimestampsIfMissing('programs');
    }

    private function repairShortCoursesTable(): void
    {
        if (!Schema::hasTable('short_courses')) {
            Schema::create('short_courses', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('school_id')->nullable();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->string('certificate_type')->default('certificate');
                $table->string('pricing_type')->default('paid');
                $table->decimal('price', 10, 2)->default(0);
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

        $this->addColumnIfMissing('short_courses', 'school_id', fn (Blueprint $table) => $table->string('school_id')->nullable());
        $this->addColumnIfMissing('short_courses', 'title', fn (Blueprint $table) => $table->string('title')->nullable());
        $this->addColumnIfMissing('short_courses', 'description', fn (Blueprint $table) => $table->text('description')->nullable());
        $this->addColumnIfMissing('short_courses', 'certificate_type', fn (Blueprint $table) => $table->string('certificate_type')->default('certificate'));
        $this->addColumnIfMissing('short_courses', 'pricing_type', fn (Blueprint $table) => $table->string('pricing_type')->default('paid'));
        $this->addColumnIfMissing('short_courses', 'price', fn (Blueprint $table) => $table->decimal('price', 10, 2)->default(0));
        $this->addColumnIfMissing('short_courses', 'currency', fn (Blueprint $table) => $table->string('currency', 3)->default('ZMW'));
        $this->addColumnIfMissing('short_courses', 'certificate_fee', fn (Blueprint $table) => $table->decimal('certificate_fee', 10, 2)->default(15));
        $this->addColumnIfMissing('short_courses', 'certificate_currency', fn (Blueprint $table) => $table->string('certificate_currency', 3)->default('USD'));
        $this->addColumnIfMissing('short_courses', 'duration_hours', fn (Blueprint $table) => $table->unsignedInteger('duration_hours')->default(0));
        $this->addColumnIfMissing('short_courses', 'level', fn (Blueprint $table) => $table->string('level')->default('beginner'));
        $this->addColumnIfMissing('short_courses', 'progress', fn (Blueprint $table) => $table->integer('progress')->default(0));
        $this->addColumnIfMissing('short_courses', 'image_id', fn (Blueprint $table) => $table->string('image_id')->nullable());
        $this->addTimestampsIfMissing('short_courses');
    }

    private function repairProgramModulesTable(): void
    {
        if (!Schema::hasTable('program_modules')) {
            Schema::create('program_modules', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('program_id')->nullable();
                $table->string('curriculum_version_id')->nullable();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->unsignedInteger('credits')->default(3);
                $table->integer('progress')->default(0);
                $table->unsignedInteger('semester')->default(1);
                $table->boolean('is_exam_available')->default(false);
                $table->boolean('is_core')->default(true);
                $table->json('supported_delivery_modes')->nullable();
                $table->timestamps();
            });
        }

        $this->addColumnIfMissing('program_modules', 'program_id', fn (Blueprint $table) => $table->string('program_id')->nullable());
        $this->addColumnIfMissing('program_modules', 'curriculum_version_id', fn (Blueprint $table) => $table->string('curriculum_version_id')->nullable());
        $this->addColumnIfMissing('program_modules', 'title', fn (Blueprint $table) => $table->string('title')->nullable());
        $this->addColumnIfMissing('program_modules', 'description', fn (Blueprint $table) => $table->text('description')->nullable());
        $this->addColumnIfMissing('program_modules', 'credits', fn (Blueprint $table) => $table->unsignedInteger('credits')->default(3));
        $this->addColumnIfMissing('program_modules', 'progress', fn (Blueprint $table) => $table->integer('progress')->default(0));
        $this->addColumnIfMissing('program_modules', 'semester', fn (Blueprint $table) => $table->unsignedInteger('semester')->default(1));
        $this->addColumnIfMissing('program_modules', 'is_exam_available', fn (Blueprint $table) => $table->boolean('is_exam_available')->default(false));
        $this->addColumnIfMissing('program_modules', 'is_core', fn (Blueprint $table) => $table->boolean('is_core')->default(true));
        $this->addColumnIfMissing('program_modules', 'supported_delivery_modes', fn (Blueprint $table) => $table->json('supported_delivery_modes')->nullable());
        $this->addTimestampsIfMissing('program_modules');
    }

    private function repairIntakesTable(): void
    {
        if (!Schema::hasTable('intakes')) {
            Schema::create('intakes', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('program_id')->nullable();
                $table->string('curriculum_version_id')->nullable();
                $table->string('name')->nullable();
                $table->string('delivery_mode')->default('hybrid');
                $table->string('campus')->nullable();
                $table->unsignedInteger('capacity')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('status')->default('open');
                $table->timestamps();
            });
        }

        $this->addColumnIfMissing('intakes', 'program_id', fn (Blueprint $table) => $table->string('program_id')->nullable());
        $this->addColumnIfMissing('intakes', 'curriculum_version_id', fn (Blueprint $table) => $table->string('curriculum_version_id')->nullable());
        $this->addColumnIfMissing('intakes', 'name', fn (Blueprint $table) => $table->string('name')->nullable());
        $this->addColumnIfMissing('intakes', 'delivery_mode', fn (Blueprint $table) => $table->string('delivery_mode')->default('hybrid'));
        $this->addColumnIfMissing('intakes', 'campus', fn (Blueprint $table) => $table->string('campus')->nullable());
        $this->addColumnIfMissing('intakes', 'capacity', fn (Blueprint $table) => $table->unsignedInteger('capacity')->nullable());
        $this->addColumnIfMissing('intakes', 'start_date', fn (Blueprint $table) => $table->date('start_date')->nullable());
        $this->addColumnIfMissing('intakes', 'end_date', fn (Blueprint $table) => $table->date('end_date')->nullable());
        $this->addColumnIfMissing('intakes', 'status', fn (Blueprint $table) => $table->string('status')->default('open'));
        $this->addTimestampsIfMissing('intakes');
    }

    private function repairCourseLecturerAssignmentsTable(): void
    {
        if (!Schema::hasTable('course_lecturer_assignments')) {
            Schema::create('course_lecturer_assignments', function (Blueprint $table) {
                $table->id();
                $table->string('course_id')->nullable();
                $table->string('module_id')->nullable();
                $table->unsignedBigInteger('lecturer_id')->nullable();
                $table->string('intake_id')->nullable();
                $table->string('role')->default('lead');
                $table->unsignedBigInteger('assigned_by')->nullable();
                $table->string('meeting_provider')->nullable();
                $table->text('meeting_url')->nullable();
                $table->json('meeting_schedule')->nullable();
                $table->text('meeting_notes')->nullable();
                $table->timestamps();
            });
        }

        $this->addColumnIfMissing('course_lecturer_assignments', 'course_id', fn (Blueprint $table) => $table->string('course_id')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'module_id', fn (Blueprint $table) => $table->string('module_id')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'lecturer_id', fn (Blueprint $table) => $table->unsignedBigInteger('lecturer_id')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'intake_id', fn (Blueprint $table) => $table->string('intake_id')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'role', fn (Blueprint $table) => $table->string('role')->default('lead'));
        $this->addColumnIfMissing('course_lecturer_assignments', 'assigned_by', fn (Blueprint $table) => $table->unsignedBigInteger('assigned_by')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'meeting_provider', fn (Blueprint $table) => $table->string('meeting_provider')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'meeting_url', fn (Blueprint $table) => $table->text('meeting_url')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'meeting_schedule', fn (Blueprint $table) => $table->json('meeting_schedule')->nullable());
        $this->addColumnIfMissing('course_lecturer_assignments', 'meeting_notes', fn (Blueprint $table) => $table->text('meeting_notes')->nullable());
        $this->addTimestampsIfMissing('course_lecturer_assignments');
    }

    private function repairCourseSessionsTable(): void
    {
        if (!Schema::hasTable('course_sessions')) {
            Schema::create('course_sessions', function (Blueprint $table) {
                $table->id();
                $table->string('course_id')->nullable();
                $table->string('intake_id')->nullable();
                $table->string('title')->nullable();
                $table->string('session_type')->default('lecture');
                $table->string('day_of_week')->nullable();
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->string('location')->nullable();
                $table->text('meeting_url')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->string('delivery_mode')->default('hybrid');
                $table->timestamps();
            });
        }

        $this->addColumnIfMissing('course_sessions', 'course_id', fn (Blueprint $table) => $table->string('course_id')->nullable());
        $this->addColumnIfMissing('course_sessions', 'intake_id', fn (Blueprint $table) => $table->string('intake_id')->nullable());
        $this->addColumnIfMissing('course_sessions', 'title', fn (Blueprint $table) => $table->string('title')->nullable());
        $this->addColumnIfMissing('course_sessions', 'session_type', fn (Blueprint $table) => $table->string('session_type')->default('lecture'));
        $this->addColumnIfMissing('course_sessions', 'day_of_week', fn (Blueprint $table) => $table->string('day_of_week')->nullable());
        $this->addColumnIfMissing('course_sessions', 'start_time', fn (Blueprint $table) => $table->time('start_time')->nullable());
        $this->addColumnIfMissing('course_sessions', 'end_time', fn (Blueprint $table) => $table->time('end_time')->nullable());
        $this->addColumnIfMissing('course_sessions', 'location', fn (Blueprint $table) => $table->string('location')->nullable());
        $this->addColumnIfMissing('course_sessions', 'meeting_url', fn (Blueprint $table) => $table->text('meeting_url')->nullable());
        $this->addColumnIfMissing('course_sessions', 'created_by', fn (Blueprint $table) => $table->unsignedBigInteger('created_by')->nullable());
        $this->addColumnIfMissing('course_sessions', 'delivery_mode', fn (Blueprint $table) => $table->string('delivery_mode')->default('hybrid'));
        $this->addTimestampsIfMissing('course_sessions');
    }

    private function addColumnIfMissing(string $tableName, string $columnName, callable $definition): void
    {
        if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, $columnName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($definition) {
            $definition($table);
        });
    }

    private function addTimestampsIfMissing(string $tableName): void
    {
        $this->addColumnIfMissing($tableName, 'created_at', fn (Blueprint $table) => $table->timestamp('created_at')->nullable());
        $this->addColumnIfMissing($tableName, 'updated_at', fn (Blueprint $table) => $table->timestamp('updated_at')->nullable());
    }
};
