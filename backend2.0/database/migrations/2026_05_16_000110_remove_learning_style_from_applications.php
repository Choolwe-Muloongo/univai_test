<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('applications') && Schema::hasColumn('applications', 'learning_style')) {
            DB::table('applications')->update(['learning_style' => null]);
        }
    }

    public function down(): void
    {
        // No rollback needed. Historical records may remain null.
    }
};
