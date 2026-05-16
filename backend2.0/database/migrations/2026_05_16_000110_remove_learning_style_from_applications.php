<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('applications') || !Schema::hasColumn('applications', 'learning_style')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications ALTER COLUMN learning_style DROP NOT NULL');
            DB::statement('ALTER TABLE applications DROP COLUMN IF EXISTS learning_style');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE applications DROP COLUMN learning_style');
            return;
        }

        // SQLite or other dev drivers: leave the column in place, but make sure future code ignores it.
    }

    public function down(): void
    {
        // Intentionally no rollback. learning_style was removed from the product model.
    }
};