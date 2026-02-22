<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('applicant')->after('password');
            $table->string('school_id')->nullable()->after('role');
            $table->string('program_id')->nullable()->after('school_id');
            $table->string('avatar')->nullable()->after('program_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'school_id', 'program_id', 'avatar']);
        });
    }
};
