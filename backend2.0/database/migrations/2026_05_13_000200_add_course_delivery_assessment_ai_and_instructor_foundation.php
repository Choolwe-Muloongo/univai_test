<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('course_offerings')) {
            Schema::create('course_offerings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('programme_course_id')->nullable()->constrained('programme_courses')->nullOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->foreignId('semester_id')->nullable()->constrained('semesters')->nullOnDelete();
                $table->string('intake_id')->nullable();
                $table->foreignId('main_lecturer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('course_delivery_groups')) {
            Schema::create('course_delivery_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_offering_id')->constrained('course_offerings')->cascadeOnDelete();
                $table->string('name');
                $table->string('mode')->default('online');
                $table->string('cohort_id')->nullable();
                $table->string('campus_id')->nullable();
                $table->unsignedInteger('capacity')->nullable();
                $table->foreignId('assistant_lecturer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('schedule_notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('course_enrollments')) {
            Schema::create('course_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_offering_id')->constrained('course_offerings')->cascadeOnDelete();
                $table->foreignId('delivery_group_id')->nullable()->constrained('course_delivery_groups')->nullOnDelete();
                $table->string('status')->default('enrolled');
                $table->timestamp('enrolled_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('course_sessions')) {
            Schema::create('course_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();
                $table->foreignId('delivery_group_id')->nullable()->constrained('course_delivery_groups')->nullOnDelete();
                $table->string('title');
                $table->string('session_type')->default('class');
                $table->string('mode')->default('online');
                $table->dateTime('starts_at')->nullable();
                $table->dateTime('ends_at')->nullable();
                $table->string('meeting_url')->nullable();
                $table->foreignId('venue_id')->nullable()->constrained('venues')->nullOnDelete();
                $table->string('status')->default('scheduled');
                $table->timestamps();
            });
        } else {
            Schema::table('course_sessions', function (Blueprint $table) {
                if (!Schema::hasColumn('course_sessions', 'course_offering_id')) {
                    $table->foreignId('course_offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();
                }
                if (!Schema::hasColumn('course_sessions', 'delivery_group_id')) {
                    $table->foreignId('delivery_group_id')->nullable()->constrained('course_delivery_groups')->nullOnDelete();
                }
                if (!Schema::hasColumn('course_sessions', 'mode')) {
                    $table->string('mode')->default('online');
                }
                if (!Schema::hasColumn('course_sessions', 'venue_id')) {
                    $table->foreignId('venue_id')->nullable()->constrained('venues')->nullOnDelete();
                }
            });
        }

        if (!Schema::hasTable('grading_policies')) {
            Schema::create('grading_policies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->decimal('pass_mark', 5, 2)->default(50);
                $table->decimal('exam_minimum', 5, 2)->nullable();
                $table->decimal('practical_minimum', 5, 2)->nullable();
                $table->string('repeat_rule')->nullable();
                $table->unsignedInteger('max_attempts')->default(1);
                $table->string('gpa_scale_type')->default('standard');
                $table->json('grade_bands')->nullable();
                $table->json('progression_policy')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('assessments')) {
            Schema::create('assessments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_offering_id')->constrained('course_offerings')->cascadeOnDelete();
                $table->string('title');
                $table->string('type')->default('test');
                $table->string('scope')->default('all_students');
                $table->json('coverage')->nullable();
                $table->decimal('total_marks', 8, 2)->default(100);
                $table->decimal('weight', 5, 2)->default(0);
                $table->dateTime('due_at')->nullable();
                $table->dateTime('starts_at')->nullable();
                $table->dateTime('ends_at')->nullable();
                $table->string('delivery_mode')->default('online');
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('assessment_delivery_groups')) {
            Schema::create('assessment_delivery_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assessment_id')->constrained('assessments')->cascadeOnDelete();
                $table->foreignId('delivery_group_id')->constrained('course_delivery_groups')->cascadeOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('assessment_components')) {
            Schema::create('assessment_components', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grading_policy_id')->constrained('grading_policies')->cascadeOnDelete();
                $table->string('name');
                $table->string('type');
                $table->decimal('weight', 5, 2)->default(0);
                $table->decimal('minimum_mark', 5, 2)->nullable();
                $table->boolean('is_required')->default(true);
                $table->string('applies_to_mode')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('grade_bands')) {
            Schema::create('grade_bands', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grading_policy_id')->constrained('grading_policies')->cascadeOnDelete();
                $table->decimal('min', 5, 2);
                $table->decimal('max', 5, 2);
                $table->string('letter');
                $table->decimal('points', 4, 2)->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_assessment_scores')) {
            Schema::create('student_assessment_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('assessment_id')->constrained('assessments')->cascadeOnDelete();
                $table->decimal('score', 8, 2)->default(0);
                $table->string('status')->default('recorded');
                $table->text('feedback')->nullable();
                $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('recorded_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('final_grade_calculations')) {
            Schema::create('final_grade_calculations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_offering_id')->constrained('course_offerings')->cascadeOnDelete();
                $table->decimal('final_percentage', 5, 2)->default(0);
                $table->string('letter_grade')->nullable();
                $table->decimal('gpa_points', 4, 2)->nullable();
                $table->string('status')->default('draft');
                $table->timestamp('calculated_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('official_content_assets')) {
            Schema::create('official_content_assets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_unit_id')->nullable()->constrained('course_units')->nullOnDelete();
                $table->foreignId('course_offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();
                $table->string('title');
                $table->string('content_type')->default('document');
                $table->string('storage_path')->nullable();
                $table->boolean('visible_to_learners')->default(false);
                $table->boolean('is_downloadable')->default(false);
                $table->boolean('is_ai_readable')->default(true);
                $table->boolean('allow_ai_summary')->default(true);
                $table->boolean('allow_ai_quiz')->default(true);
                $table->boolean('allow_ai_flashcards')->default(true);
                $table->boolean('protected_content')->default(true);
                $table->string('review_status')->default('needs_review');
                $table->string('publication_status')->default('draft');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_study_documents')) {
            Schema::create('student_study_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('course_id')->nullable();
                $table->string('title');
                $table->string('file_path')->nullable();
                $table->string('file_type')->nullable();
                $table->longText('extracted_text')->nullable();
                $table->string('source_type')->default('student_upload');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('ai_study_sessions')) {
            Schema::create('ai_study_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('course_id')->nullable();
                $table->unsignedBigInteger('test_announcement_id')->nullable();
                $table->string('mode')->default('study_vault');
                $table->string('goal')->nullable();
                $table->unsignedInteger('available_minutes')->nullable();
                $table->json('source_document_ids')->nullable();
                $table->json('official_document_ids')->nullable();
                $table->longText('output_summary')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('ai_generated_study_materials')) {
            Schema::create('ai_generated_study_materials', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('study_session_id')->constrained('ai_study_sessions')->cascadeOnDelete();
                $table->string('type');
                $table->string('title');
                $table->longText('content')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('test_announcements')) {
            Schema::create('test_announcements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_offering_id')->nullable()->constrained('course_offerings')->nullOnDelete();
                $table->foreignId('lecturer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->dateTime('test_date')->nullable();
                $table->unsignedInteger('duration_minutes')->nullable();
                $table->string('format')->nullable();
                $table->string('difficulty')->nullable();
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('test_coverage_items')) {
            Schema::create('test_coverage_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('test_announcement_id')->constrained('test_announcements')->cascadeOnDelete();
                $table->string('lesson_id')->nullable();
                $table->foreignId('unit_id')->nullable()->constrained('course_units')->nullOnDelete();
                $table->string('module_id')->nullable();
                $table->string('topic')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('short_courses')) {
            Schema::table('short_courses', function (Blueprint $table) {
                if (!Schema::hasColumn('short_courses', 'owner_type')) {
                    $table->string('owner_type')->default('univai');
                }
                if (!Schema::hasColumn('short_courses', 'owner_id')) {
                    $table->unsignedBigInteger('owner_id')->nullable();
                }
                if (!Schema::hasColumn('short_courses', 'status')) {
                    $table->string('status')->default('draft');
                }
                if (!Schema::hasColumn('short_courses', 'review_status')) {
                    $table->string('review_status')->default('needs_review');
                }
            });
        }

        if (!Schema::hasTable('short_course_categories')) {
            Schema::create('short_course_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_applications')) {
            Schema::create('instructor_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('full_name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('expertise')->nullable();
                $table->text('bio')->nullable();
                $table->unsignedInteger('years_experience')->nullable();
                $table->string('highest_qualification')->nullable();
                $table->string('portfolio_url')->nullable();
                $table->string('status')->default('submitted');
                $table->text('review_notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructors')) {
            Schema::create('instructors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('status')->default('approved');
                $table->decimal('commission_rate', 5, 2)->default(70);
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('suspended_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_documents')) {
            Schema::create('instructor_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('instructor_application_id')->constrained('instructor_applications')->cascadeOnDelete();
                $table->string('document_type');
                $table->string('file_path')->nullable();
                $table->string('status')->default('pending');
                $table->text('review_notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_earnings')) {
            Schema::create('instructor_earnings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('instructor_id')->constrained('instructors')->cascadeOnDelete();
                $table->string('course_id')->nullable();
                $table->unsignedBigInteger('payment_id')->nullable();
                $table->decimal('gross_amount', 10, 2)->default(0);
                $table->decimal('commission_amount', 10, 2)->default(0);
                $table->decimal('net_amount', 10, 2)->default(0);
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_payouts')) {
            Schema::create('instructor_payouts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('instructor_id')->constrained('instructors')->cascadeOnDelete();
                $table->decimal('amount', 10, 2)->default(0);
                $table->string('method')->nullable();
                $table->string('status')->default('requested');
                $table->timestamp('requested_at')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->string('reference')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('platform_commissions')) {
            Schema::create('platform_commissions', function (Blueprint $table) {
                $table->id();
                $table->string('source_type');
                $table->unsignedBigInteger('source_id')->nullable();
                $table->decimal('gross_amount', 10, 2)->default(0);
                $table->decimal('commission_amount', 10, 2)->default(0);
                $table->decimal('rate', 5, 2)->default(30);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_ai_packages')) {
            Schema::create('instructor_ai_packages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->decimal('price', 10, 2)->default(0);
                $table->string('currency')->default('ZMW');
                $table->json('features')->nullable();
                $table->unsignedInteger('generation_credits')->default(0);
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructor_ai_package_sales')) {
            Schema::create('instructor_ai_package_sales', function (Blueprint $table) {
                $table->id();
                $table->foreignId('instructor_id')->constrained('instructors')->cascadeOnDelete();
                $table->foreignId('package_id')->constrained('instructor_ai_packages')->cascadeOnDelete();
                $table->decimal('amount', 10, 2)->default(0);
                $table->string('status')->default('pending');
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('ai_usage_logs')) {
            Schema::create('ai_usage_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('role')->nullable();
                $table->string('feature');
                $table->string('mode')->nullable();
                $table->string('provider')->nullable();
                $table->string('model')->nullable();
                $table->unsignedInteger('prompt_length')->default(0);
                $table->unsignedInteger('context_length')->default(0);
                $table->unsignedInteger('approved_materials_length')->default(0);
                $table->unsignedInteger('estimated_tokens')->default(0);
                $table->decimal('estimated_cost', 10, 4)->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('content_review_items')) {
            Schema::create('content_review_items', function (Blueprint $table) {
                $table->id();
                $table->string('source_type');
                $table->unsignedBigInteger('source_id')->nullable();
                $table->string('title');
                $table->string('status')->default('needs_review');
                $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('review_notes')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('content_review_items');
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('instructor_ai_package_sales');
        Schema::dropIfExists('instructor_ai_packages');
        Schema::dropIfExists('platform_commissions');
        Schema::dropIfExists('instructor_payouts');
        Schema::dropIfExists('instructor_earnings');
        Schema::dropIfExists('instructor_documents');
        Schema::dropIfExists('instructors');
        Schema::dropIfExists('instructor_applications');
        Schema::dropIfExists('short_course_categories');
        Schema::dropIfExists('test_coverage_items');
        Schema::dropIfExists('test_announcements');
        Schema::dropIfExists('ai_generated_study_materials');
        Schema::dropIfExists('ai_study_sessions');
        Schema::dropIfExists('student_study_documents');
        Schema::dropIfExists('official_content_assets');
        Schema::dropIfExists('final_grade_calculations');
        Schema::dropIfExists('student_assessment_scores');
        Schema::dropIfExists('grade_bands');
        Schema::dropIfExists('assessment_components');
        Schema::dropIfExists('assessment_delivery_groups');
        Schema::dropIfExists('assessments');
        Schema::dropIfExists('grading_policies');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('course_delivery_groups');
        Schema::dropIfExists('course_offerings');
    }
};
