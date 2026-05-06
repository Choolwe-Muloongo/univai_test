<?php

use App\Support\DeliveryModes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->json('supported_delivery_modes')->nullable()->after('image_id');
        });

        Schema::table('program_modules', function (Blueprint $table) {
            $table->json('supported_delivery_modes')->nullable()->after('is_exam_available');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('delivery_mode')->default(DeliveryModes::HYBRID)->after('selected_modules');
        });

        Schema::table('course_sessions', function (Blueprint $table) {
            $table->string('delivery_mode')->default(DeliveryModes::HYBRID)->after('session_type');
        });
    }

    public function down(): void
    {
        Schema::table('course_sessions', function (Blueprint $table) {
            $table->dropColumn('delivery_mode');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('delivery_mode');
        });

        Schema::table('program_modules', function (Blueprint $table) {
            $table->dropColumn('supported_delivery_modes');
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn('supported_delivery_modes');
        });
    }
};
