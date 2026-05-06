<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->json('premium_requirements')->nullable()->after('admission_fee_paid');
            $table->string('premium_requirement_status')->default('pending')->after('premium_requirements');
            $table->timestamp('review_started_at')->nullable()->after('needs_info_at');
            $table->timestamp('entitlements_activated_at')->nullable()->after('review_started_at');
            $table->timestamp('enrolled_at')->nullable()->after('entitlements_activated_at');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'premium_requirements',
                'premium_requirement_status',
                'review_started_at',
                'entitlements_activated_at',
                'enrolled_at',
            ]);
        });
    }
};
