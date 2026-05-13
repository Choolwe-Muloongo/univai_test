<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('intakes', function (Blueprint $table) {
            $table->string('curriculum_version_id')->nullable()->after('program_id');
            $table->foreign('curriculum_version_id')->references('id')->on('curriculum_versions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('intakes', function (Blueprint $table) {
            $table->dropForeign(['curriculum_version_id']);
            $table->dropColumn('curriculum_version_id');
        });
    }
};
