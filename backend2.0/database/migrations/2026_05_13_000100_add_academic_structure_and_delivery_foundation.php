<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->string('school_id');
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('head_of_department_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('programs') && !Schema::hasColumn('programs', 'department_id')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->after('school_id')->constrained('departments')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('academic_years')) {
            Schema::create('academic_years', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('semesters')) {
            Schema::create('semesters', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
                $table->string('name');
                $table->unsignedTinyInteger('number');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('status')->default('planned');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('programme_courses')) {
            Schema::create('programme_courses', function (Blueprint $table) {
                $table->id();
                $table->string('program_id');
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->string('course_id')->nullable();
                $table->string('module_id')->nullable();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->foreignId('semester_id')->nullable()->constrained('semesters')->nullOnDelete();
                $table->unsignedTinyInteger('year_level')->default(1);
                $table->unsignedTinyInteger('semester_number')->nullable();
                $table->string('duration_type')->default('one_semester');
                $table->string('delivery_mode')->default('online');
                $table->boolean('is_core')->default(true);
                $table->unsignedInteger('credits')->default(0);
                $table->string('status')->default('draft');
                $table->timestamps();

                $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
                $table->foreign('course_id')->references('id')->on('short_courses')->nullOnDelete();
                $table->foreign('module_id')->references('id')->on('program_modules')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('course_units')) {
            Schema::create('course_units', function (Blueprint $table) {
                $table->id();
                $table->foreignId('programme_course_id')->constrained('programme_courses')->cascadeOnDelete();
                $table->foreignId('semester_id')->nullable()->constrained('semesters')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->unsignedInteger('unit_number')->default(1);
                $table->unsignedInteger('estimated_hours')->nullable();
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('learning_mode_rules')) {
            Schema::create('learning_mode_rules', function (Blueprint $table) {
                $table->id();
                $table->string('program_id')->nullable();
                $table->string('course_id')->nullable();
                $table->string('mode');
                $table->json('rules')->nullable();
                $table->timestamps();

                $table->foreign('program_id')->references('id')->on('programs')->nullOnDelete();
                $table->foreign('course_id')->references('id')->on('short_courses')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('partner_institutions')) {
            Schema::create('partner_institutions', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type')->nullable();
                $table->string('location')->nullable();
                $table->string('contact_person')->nullable();
                $table->string('contact_email')->nullable();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('venues')) {
            Schema::create('venues', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type')->nullable();
                $table->string('location')->nullable();
                $table->unsignedInteger('capacity')->nullable();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('practical_sessions')) {
            Schema::create('practical_sessions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('course_offering_id')->nullable();
                $table->foreignId('programme_course_id')->nullable()->constrained('programme_courses')->nullOnDelete();
                $table->unsignedBigInteger('delivery_group_id')->nullable();
                $table->string('title');
                $table->text('description')->nullable();
                $table->foreignId('venue_id')->nullable()->constrained('venues')->nullOnDelete();
                $table->foreignId('partner_institution_id')->nullable()->constrained('partner_institutions')->nullOnDelete();
                $table->dateTime('starts_at')->nullable();
                $table->dateTime('ends_at')->nullable();
                $table->unsignedInteger('capacity')->nullable();
                $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('status')->default('planned');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('practical_sessions');
        Schema::dropIfExists('venues');
        Schema::dropIfExists('partner_institutions');
        Schema::dropIfExists('learning_mode_rules');
        Schema::dropIfExists('course_units');
        Schema::dropIfExists('programme_courses');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('academic_years');

        if (Schema::hasTable('programs') && Schema::hasColumn('programs', 'department_id')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->dropConstrainedForeignId('department_id');
            });
        }

        Schema::dropIfExists('departments');
    }
};
