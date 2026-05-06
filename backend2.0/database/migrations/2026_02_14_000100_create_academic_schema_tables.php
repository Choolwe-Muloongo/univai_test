<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            if (!Schema::hasColumn('schools', 'code')) {
                $table->string('code')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('schools', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('schools', 'status')) {
                $table->string('status')->default('active')->after('description');
            }
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('school_id');
            $table->string('code');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['school_id', 'code']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });

        Schema::create('qualification_levels', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedInteger('framework_level')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_modes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('requires_attendance')->default(false);
            $table->timestamps();
        });

        Schema::create('exam_centres', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('timezone')->default('UTC');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('programmes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('school_id');
            $table->string('department_id')->nullable();
            $table->string('qualification_level_id')->nullable();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('draft');
            $table->unsignedInteger('duration_months')->nullable();
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('qualification_level_id')->references('id')->on('qualification_levels')->nullOnDelete();
        });

        Schema::table('curriculum_versions', function (Blueprint $table) {
            if (!Schema::hasColumn('curriculum_versions', 'programme_id')) {
                $table->string('programme_id')->nullable()->after('program_id');
                $table->foreign('programme_id')->references('id')->on('programmes')->nullOnDelete();
            }
            if (!Schema::hasColumn('curriculum_versions', 'code')) {
                $table->string('code')->nullable()->after('programme_id');
            }
            if (!Schema::hasColumn('curriculum_versions', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('published_at');
            }
            if (!Schema::hasColumn('curriculum_versions', 'effective_to')) {
                $table->date('effective_to')->nullable()->after('effective_from');
            }
            if (!Schema::hasColumn('curriculum_versions', 'is_current')) {
                $table->boolean('is_current')->default(false)->after('effective_to');
            }
        });

        Schema::create('modules', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('programme_id');
            $table->string('curriculum_version_id')->nullable();
            $table->string('department_id')->nullable();
            $table->string('code');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('credits')->default(0);
            $table->unsignedInteger('semester')->default(1);
            $table->unsignedInteger('level')->nullable();
            $table->boolean('is_core')->default(true);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['programme_id', 'code']);
            $table->foreign('programme_id')->references('id')->on('programmes')->cascadeOnDelete();
            $table->foreign('curriculum_version_id')->references('id')->on('curriculum_versions')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
        });

        Schema::create('units', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('module_id');
            $table->string('code')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('modules')->cascadeOnDelete();
        });

        Schema::table('lessons', function (Blueprint $table) {
            if (!Schema::hasColumn('lessons', 'unit_id')) {
                $table->string('unit_id')->nullable()->after('course_id');
                $table->foreign('unit_id')->references('id')->on('units')->nullOnDelete();
            }
            if (!Schema::hasColumn('lessons', 'module_id')) {
                $table->string('module_id')->nullable()->after('unit_id');
                $table->foreign('module_id')->references('id')->on('modules')->nullOnDelete();
            }
            if (!Schema::hasColumn('lessons', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('title');
            }
            if (!Schema::hasColumn('lessons', 'summary')) {
                $table->text('summary')->nullable()->after('sort_order');
            }
        });

        Schema::create('learning_objects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('lesson_id');
            $table->string('type')->default('content');
            $table->string('title');
            $table->text('content_body')->nullable();
            $table->string('content_url')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::create('assessments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('module_id')->nullable();
            $table->string('unit_id')->nullable();
            $table->string('lesson_id')->nullable();
            $table->string('title');
            $table->string('type')->default('assignment');
            $table->unsignedInteger('weighting')->default(0);
            $table->unsignedInteger('max_score')->default(100);
            $table->boolean('is_summative')->default(false);
            $table->timestamp('due_at')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('modules')->cascadeOnDelete();
            $table->foreign('unit_id')->references('id')->on('units')->cascadeOnDelete();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::create('cohorts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('programme_id');
            $table->string('curriculum_version_id')->nullable();
            $table->string('delivery_mode_id')->nullable();
            $table->string('exam_centre_id')->nullable();
            $table->string('code')->unique();
            $table->string('name');
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status')->default('planned');
            $table->timestamps();

            $table->foreign('programme_id')->references('id')->on('programmes')->cascadeOnDelete();
            $table->foreign('curriculum_version_id')->references('id')->on('curriculum_versions')->nullOnDelete();
            $table->foreign('delivery_mode_id')->references('id')->on('delivery_modes')->nullOnDelete();
            $table->foreign('exam_centre_id')->references('id')->on('exam_centres')->nullOnDelete();
        });

        Schema::table('programs', function (Blueprint $table) {
            if (!Schema::hasColumn('programs', 'programme_id')) {
                $table->string('programme_id')->nullable()->after('school_id');
                $table->foreign('programme_id')->references('id')->on('programmes')->nullOnDelete();
            }
        });

        Schema::table('program_modules', function (Blueprint $table) {
            if (!Schema::hasColumn('program_modules', 'module_id')) {
                $table->string('module_id')->nullable()->after('curriculum_version_id');
                $table->foreign('module_id')->references('id')->on('modules')->nullOnDelete();
            }
        });

        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'programme_id')) {
                $table->string('programme_id')->nullable()->after('school_id');
                $table->foreign('programme_id')->references('id')->on('programmes')->nullOnDelete();
            }
            if (!Schema::hasColumn('courses', 'department_id')) {
                $table->string('department_id')->nullable()->after('programme_id');
                $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            }
        });

        $this->backfillCompatibilityRecords();
    }


    private function backfillCompatibilityRecords(): void
    {
        $now = now();

        DB::table('schools')
            ->whereNull('code')
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($school) {
                DB::table('schools')
                    ->where('id', $school->id)
                    ->update(['code' => Str::upper(Str::slug($school->id, '_'))]);
            });

        DB::table('programs')
            ->orderBy('id')
            ->get()
            ->each(function ($program) use ($now) {
                DB::table('programmes')->updateOrInsert(
                    ['id' => $program->id],
                    [
                        'school_id' => $program->school_id,
                        'department_id' => null,
                        'qualification_level_id' => null,
                        'code' => Str::upper(Str::slug($program->id, '-')),
                        'title' => $program->title,
                        'description' => $program->description,
                        'status' => 'active',
                        'duration_months' => null,
                        'created_at' => $program->created_at ?? $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('programs')
                    ->where('id', $program->id)
                    ->update(['programme_id' => $program->id]);
            });

        DB::table('curriculum_versions')
            ->join('programs', 'curriculum_versions.program_id', '=', 'programs.id')
            ->whereNull('curriculum_versions.programme_id')
            ->select('curriculum_versions.id', 'programs.programme_id')
            ->orderBy('curriculum_versions.id')
            ->get()
            ->each(function ($version) {
                DB::table('curriculum_versions')
                    ->where('id', $version->id)
                    ->update(['programme_id' => $version->programme_id]);
            });

        DB::table('program_modules')
            ->join('programs', 'program_modules.program_id', '=', 'programs.id')
            ->whereNotNull('programs.programme_id')
            ->select('program_modules.*', 'programs.programme_id')
            ->orderBy('program_modules.id')
            ->get()
            ->each(function ($module) use ($now) {
                DB::table('modules')->updateOrInsert(
                    ['id' => $module->id],
                    [
                        'programme_id' => $module->programme_id,
                        'curriculum_version_id' => $module->curriculum_version_id,
                        'department_id' => null,
                        'code' => $module->code ?: Str::upper(Str::slug($module->id, '-')),
                        'title' => $module->title,
                        'description' => $module->description,
                        'credits' => (int) ($module->credits ?? 0),
                        'semester' => (int) ($module->semester ?? 1),
                        'level' => null,
                        'is_core' => (bool) ($module->is_core ?? true),
                        'status' => 'active',
                        'created_at' => $module->created_at ?? $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('program_modules')
                    ->where('id', $module->id)
                    ->update(['module_id' => $module->id]);
            });

        DB::table('courses')
            ->orderBy('id')
            ->get()
            ->each(function ($course) use ($now) {
                $programmeId = $course->programme_id ?: 'legacy-course-'.$course->id;
                $moduleId = 'legacy-course-module-'.$course->id;
                $unitId = 'legacy-course-unit-'.$course->id;

                DB::table('programmes')->updateOrInsert(
                    ['id' => $programmeId],
                    [
                        'school_id' => $course->school_id,
                        'department_id' => $course->department_id,
                        'qualification_level_id' => null,
                        'code' => Str::upper(Str::slug($programmeId, '-')),
                        'title' => $course->title,
                        'description' => $course->description,
                        'status' => 'active',
                        'duration_months' => null,
                        'created_at' => $course->created_at ?? $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('modules')->updateOrInsert(
                    ['id' => $moduleId],
                    [
                        'programme_id' => $programmeId,
                        'curriculum_version_id' => null,
                        'department_id' => $course->department_id,
                        'code' => Str::upper(Str::slug($moduleId, '-')),
                        'title' => $course->title,
                        'description' => $course->description,
                        'credits' => 0,
                        'semester' => 1,
                        'level' => null,
                        'is_core' => true,
                        'status' => 'active',
                        'created_at' => $course->created_at ?? $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('units')->updateOrInsert(
                    ['id' => $unitId],
                    [
                        'module_id' => $moduleId,
                        'code' => Str::upper(Str::slug($unitId, '-')),
                        'title' => $course->title,
                        'description' => $course->description,
                        'sort_order' => 0,
                        'created_at' => $course->created_at ?? $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('courses')
                    ->where('id', $course->id)
                    ->update(['programme_id' => $programmeId]);

                DB::table('lessons')
                    ->where('course_id', $course->id)
                    ->whereNull('unit_id')
                    ->update([
                        'unit_id' => $unitId,
                        'module_id' => $moduleId,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'department_id')) {
                $table->dropForeign(['department_id']);
            }
            if (Schema::hasColumn('courses', 'programme_id')) {
                $table->dropForeign(['programme_id']);
            }
            $columns = array_values(array_filter(['department_id', 'programme_id'], fn ($column) => Schema::hasColumn('courses', $column)));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('program_modules', function (Blueprint $table) {
            if (Schema::hasColumn('program_modules', 'module_id')) {
                $table->dropForeign(['module_id']);
                $table->dropColumn('module_id');
            }
        });

        Schema::table('programs', function (Blueprint $table) {
            if (Schema::hasColumn('programs', 'programme_id')) {
                $table->dropForeign(['programme_id']);
                $table->dropColumn('programme_id');
            }
        });

        Schema::dropIfExists('cohorts');
        Schema::dropIfExists('assessments');
        Schema::dropIfExists('learning_objects');

        Schema::table('lessons', function (Blueprint $table) {
            foreach (['module_id', 'unit_id'] as $column) {
                if (Schema::hasColumn('lessons', $column)) {
                    $table->dropForeign([$column]);
                }
            }
            $columns = array_values(array_filter(['summary', 'sort_order', 'module_id', 'unit_id'], fn ($column) => Schema::hasColumn('lessons', $column)));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::dropIfExists('units');
        Schema::dropIfExists('modules');

        Schema::table('curriculum_versions', function (Blueprint $table) {
            if (Schema::hasColumn('curriculum_versions', 'programme_id')) {
                $table->dropForeign(['programme_id']);
            }
            $columns = array_values(array_filter(['is_current', 'effective_to', 'effective_from', 'code', 'programme_id'], fn ($column) => Schema::hasColumn('curriculum_versions', $column)));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::dropIfExists('programmes');
        Schema::dropIfExists('exam_centres');
        Schema::dropIfExists('delivery_modes');
        Schema::dropIfExists('qualification_levels');
        Schema::dropIfExists('departments');

        Schema::table('schools', function (Blueprint $table) {
            $columns = array_values(array_filter(['status', 'description', 'code'], fn ($column) => Schema::hasColumn('schools', $column)));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
