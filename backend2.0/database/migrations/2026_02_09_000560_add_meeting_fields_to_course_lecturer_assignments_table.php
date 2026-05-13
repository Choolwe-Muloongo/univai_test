<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_lecturer_assignments', function (Blueprint $table) {
            $table->string('meeting_provider')->nullable()->after('role');
            $table->string('meeting_url')->nullable()->after('meeting_provider');
            $table->json('meeting_schedule')->nullable()->after('meeting_url');
            $table->text('meeting_notes')->nullable()->after('meeting_schedule');
        });
    }

    public function down(): void
    {
        Schema::table('course_lecturer_assignments', function (Blueprint $table) {
            $table->dropColumn(['meeting_provider', 'meeting_url', 'meeting_schedule', 'meeting_notes']);
        });
    }
};
