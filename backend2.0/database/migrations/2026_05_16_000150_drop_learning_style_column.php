<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('applications') && Schema::hasColumn('applications', 'learning_style')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->dropColumn('learning_style');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('applications') && !Schema::hasColumn('applications', 'learning_style')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('learning_style')->nullable()->after('delivery_mode');
            });
        }
    }
};
