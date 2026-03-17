<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('program_modules', function (Blueprint $table) {
            $table->string('code')->nullable()->after('curriculum_version_id');
            $table->unsignedInteger('hours_per_week')->nullable()->after('credits');
        });
    }

    public function down(): void
    {
        Schema::table('program_modules', function (Blueprint $table) {
            $table->dropColumn(['code', 'hours_per_week']);
        });
    }
};
