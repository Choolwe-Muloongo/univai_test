<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_state')->default('active')->after('role');
            $table->string('verification_status')->default('email')->after('account_state');
            $table->timestamp('profile_completed_at')->nullable()->after('verification_status');
        });

        DB::table('users')
            ->whereIn('role', ['applicant', 'lecturer-applicant', 'employer-applicant'])
            ->update(['account_state' => 'applicant', 'profile_completed_at' => null]);

        DB::table('users')
            ->whereIn('role', ['admin', 'lecturer'])
            ->update(['verification_status' => 'identity', 'profile_completed_at' => now()]);

        DB::table('users')
            ->whereNotIn('role', ['applicant', 'lecturer-applicant', 'employer-applicant'])
            ->whereNull('profile_completed_at')
            ->update(['profile_completed_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['account_state', 'verification_status', 'profile_completed_at']);
        });
    }
};
