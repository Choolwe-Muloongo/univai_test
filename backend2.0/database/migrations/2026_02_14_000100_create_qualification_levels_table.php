<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qualification_levels', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('category');
            $table->unsignedInteger('default_credits');
            $table->unsignedInteger('minimum_credits')->default(0);
            $table->unsignedInteger('maximum_credits')->nullable();
            $table->unsignedInteger('duration_months');
            $table->text('admission_requirements')->nullable();
            $table->json('allowed_delivery_modes');
            $table->boolean('requires_exam_clinic')->default(false);
            $table->boolean('requires_accreditation_approval')->default(false);
            $table->unsignedInteger('minimum_subject_count')->default(0);
            $table->unsignedInteger('minimum_total_points')->default(0);
            $table->string('required_prior_qualification')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->string('qualification_level_id')->nullable()->after('school_id');
            $table->unsignedInteger('credits')->nullable()->after('description');
            $table->unsignedInteger('duration_months')->nullable()->after('credits');
            $table->text('admission_requirements')->nullable()->after('duration_months');
            $table->json('delivery_modes')->nullable()->after('admission_requirements');
            $table->boolean('exam_clinic_required')->default(false)->after('delivery_modes');
            $table->boolean('requires_accreditation_approval')->default(false)->after('exam_clinic_required');
            $table->timestamp('accreditation_approved_at')->nullable()->after('requires_accreditation_approval');
            $table->string('launch_status')->default('draft')->after('accreditation_approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn([
                'qualification_level_id',
                'credits',
                'duration_months',
                'admission_requirements',
                'delivery_modes',
                'exam_clinic_required',
                'requires_accreditation_approval',
                'accreditation_approved_at',
                'launch_status',
            ]);
        });

        Schema::dropIfExists('qualification_levels');
    }
};
