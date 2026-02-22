<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->json('selected_modules')->nullable()->after('intake_id');
            $table->timestamp('confirmed_at')->nullable()->after('enrolled_at');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['selected_modules', 'confirmed_at']);
        });
    }
};
