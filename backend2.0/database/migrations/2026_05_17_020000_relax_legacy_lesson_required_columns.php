<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lessons')) {
            return;
        }

        $this->backfillLessonDefaults();
        $this->dropNotNullIfColumnExists('lessons', 'content');
        $this->dropNotNullIfColumnExists('lessons', 'video_url');
        $this->dropNotNullIfColumnExists('lessons', 'quiz');
        $this->dropNotNullIfColumnExists('lessons', 'exercise');
    }

    public function down(): void
    {
        // Do not restore NOT NULL constraints. Old production data may contain null lesson fields.
    }

    private function backfillLessonDefaults(): void
    {
        if (Schema::hasColumn('lessons', 'content')) {
            DB::table('lessons')->whereNull('content')->update(['content' => '']);
        }
        if (Schema::hasColumn('lessons', 'video_url')) {
            DB::table('lessons')->whereNull('video_url')->update(['video_url' => '']);
        }
        if (Schema::hasColumn('lessons', 'exercise')) {
            DB::table('lessons')->whereNull('exercise')->update(['exercise' => '']);
        }
    }

    private function dropNotNullIfColumnExists(string $table, string $column): void
    {
        if (!Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            DB::statement("ALTER TABLE {$table} ALTER COLUMN {$column} DROP NOT NULL");
        } catch (Throwable $exception) {
            Log::warning('drop_not_null_failed', [
                'table' => $table,
                'column' => $column,
                'message' => $exception->getMessage(),
            ]);
        }
    }
};
