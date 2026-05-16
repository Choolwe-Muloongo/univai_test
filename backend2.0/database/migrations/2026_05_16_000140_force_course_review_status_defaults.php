<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('courses') && Schema::hasColumn('courses', 'review_status')) {
            DB::table('courses')
                ->whereNull('review_status')
                ->update(['review_status' => 'needs_review']);
        }
    }

    public function down(): void
    {
        // No rollback needed.
    }
};
