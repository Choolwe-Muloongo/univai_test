<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('programs')) {
            Schema::table('programs', function (Blueprint $table) {
                if (!Schema::hasColumn('programs', 'registration_fee')) {
                    $table->decimal('registration_fee', 10, 2)->default(0)->after('tuition_currency');
                }
                if (!Schema::hasColumn('programs', 'registration_currency')) {
                    $table->string('registration_currency', 3)->default('ZMW')->after('registration_fee');
                }
                if (!Schema::hasColumn('programs', 'minimum_registration_deposit_type')) {
                    $table->string('minimum_registration_deposit_type')->default('fixed')->after('registration_currency');
                }
                if (!Schema::hasColumn('programs', 'minimum_registration_deposit')) {
                    $table->decimal('minimum_registration_deposit', 10, 2)->default(0)->after('minimum_registration_deposit_type');
                }
                if (!Schema::hasColumn('programs', 'allow_partial_registration')) {
                    $table->boolean('allow_partial_registration')->default(false)->after('minimum_registration_deposit');
                }
                if (!Schema::hasColumn('programs', 'exam_clearance_type')) {
                    $table->string('exam_clearance_type')->default('percent')->after('allow_partial_registration');
                }
                if (!Schema::hasColumn('programs', 'exam_clearance_value')) {
                    $table->decimal('exam_clearance_value', 10, 2)->default(100)->after('exam_clearance_type');
                }
                if (!Schema::hasColumn('programs', 'full_clearance_required_for_results')) {
                    $table->boolean('full_clearance_required_for_results')->default(true)->after('exam_clearance_value');
                }
                if (!Schema::hasColumn('programs', 'full_clearance_required_for_progression')) {
                    $table->boolean('full_clearance_required_for_progression')->default(true)->after('full_clearance_required_for_results');
                }
                if (!Schema::hasColumn('programs', 'graduation_clearance_required')) {
                    $table->boolean('graduation_clearance_required')->default(true)->after('full_clearance_required_for_progression');
                }
            });
        }

        if (!Schema::hasTable('student_financial_clearances')) {
            Schema::create('student_financial_clearances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('intake_id');
                $table->unsignedInteger('academic_year')->default(1);
                $table->decimal('total_billed', 10, 2)->default(0);
                $table->decimal('total_paid', 10, 2)->default(0);
                $table->decimal('balance', 10, 2)->default(0);
                $table->decimal('required_registration_deposit', 10, 2)->default(0);
                $table->decimal('required_exam_clearance', 10, 2)->default(0);
                $table->boolean('registration_cleared')->default(false);
                $table->boolean('exam_cleared')->default(false);
                $table->boolean('results_cleared')->default(false);
                $table->boolean('progression_cleared')->default(false);
                $table->boolean('graduation_cleared')->default(false);
                $table->string('status')->default('blocked');
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->foreign('intake_id')->references('id')->on('intakes')->cascadeOnDelete();
                $table->unique(['student_id', 'intake_id', 'academic_year'], 'student_clearance_unique');
                $table->index(['intake_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_financial_clearances');

        if (Schema::hasTable('programs')) {
            Schema::table('programs', function (Blueprint $table) {
                foreach ([
                    'graduation_clearance_required',
                    'full_clearance_required_for_progression',
                    'full_clearance_required_for_results',
                    'exam_clearance_value',
                    'exam_clearance_type',
                    'allow_partial_registration',
                    'minimum_registration_deposit',
                    'minimum_registration_deposit_type',
                    'registration_currency',
                    'registration_fee',
                ] as $column) {
                    if (Schema::hasColumn('programs', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
