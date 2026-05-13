<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('standing')->default('good')->after('status');
            $table->unsignedInteger('probation_count')->default(0)->after('standing');
            $table->timestamp('last_reviewed_at')->nullable()->after('probation_count');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['standing', 'probation_count', 'last_reviewed_at']);
        });
    }
};
