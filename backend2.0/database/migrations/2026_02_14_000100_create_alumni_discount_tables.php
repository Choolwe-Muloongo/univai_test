<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('alumni_state')->default('none')->after('role');
            $table->string('account_standing')->default('good')->after('alumni_state');
            $table->timestamp('suspended_at')->nullable()->after('account_standing');
            $table->text('alumni_suspension_reason')->nullable()->after('suspended_at');
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->string('level')->default('certificate')->after('title');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('original_amount', 10, 2)->nullable()->after('title');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('paid_amount');
            $table->foreignId('alumni_discount_application_id')->nullable()->after('discount_amount');
        });

        Schema::create('completed_programmes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('program_id');
            $table->string('program_level');
            $table->string('status')->default('completed');
            $table->string('final_standing')->default('good');
            $table->boolean('payment_cleared')->default(false);
            $table->date('completed_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
            $table->index(['user_id', 'program_level', 'completed_at']);
        });

        Schema::create('alumni_discount_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('discount_type')->default('percentage');
            $table->decimal('discount_value', 10, 2);
            $table->date('starts_at');
            $table->date('ends_at');
            $table->json('previous_programme_levels')->nullable();
            $table->json('new_programme_levels')->nullable();
            $table->boolean('requires_good_standing')->default(true);
            $table->boolean('requires_payment_clearance')->default(true);
            $table->boolean('blocks_suspended_alumni')->default(true);
            $table->boolean('automatic')->default(true);
            $table->boolean('requires_admin_approval')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('uses_count')->default(0);
            $table->timestamps();
        });

        Schema::create('alumni_discount_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('alumni_discount_campaigns')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('intake_id')->nullable();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('completed_programme_id')->nullable()->constrained('completed_programmes')->nullOnDelete();
            $table->string('previous_programme_level')->nullable();
            $table->string('new_programme_id')->nullable();
            $table->string('new_programme_level')->nullable();
            $table->decimal('requested_discount_amount', 10, 2)->default(0);
            $table->decimal('approved_discount_amount', 10, 2)->default(0);
            $table->string('status')->default('pending');
            $table->json('eligibility_snapshot')->nullable();
            $table->text('decision_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('intake_id')->references('id')->on('intakes')->nullOnDelete();
            $table->foreign('new_programme_id')->references('id')->on('programs')->nullOnDelete();
            $table->index(['user_id', 'status']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('audience')->default('student');
            $table->string('type')->default('info');
            $table->string('title');
            $table->text('message');
            $table->string('action_url')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('alumni_discount_applications');
        Schema::dropIfExists('alumni_discount_campaigns');
        Schema::dropIfExists('completed_programmes');

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['original_amount', 'discount_amount', 'alumni_discount_application_id']);
        });
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn('level');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['alumni_state', 'account_standing', 'suspended_at', 'alumni_suspension_reason']);
        });
    }
};
