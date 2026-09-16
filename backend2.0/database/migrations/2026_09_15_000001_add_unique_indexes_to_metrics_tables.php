<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The metrics tables hold one row per role/key and one row per course, and the seeder
     * upserts them on those keys. Without a matching unique index the upsert fails outright
     * on SQLite and Postgres ("ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE
     * constraint"), so the invariant is declared here.
     */
    public function up(): void
    {
        $this->uniqueIfColumnsExist('dashboard_metrics', ['role', 'key'], 'dashboard_metrics_role_key_unique');
        $this->uniqueIfColumnsExist('course_metrics', ['course_id'], 'course_metrics_course_id_unique');
    }

    public function down(): void
    {
        $this->dropIndexIfTableExists('course_metrics', 'course_metrics_course_id_unique');
        $this->dropIndexIfTableExists('dashboard_metrics', 'dashboard_metrics_role_key_unique');
    }

    private function uniqueIfColumnsExist(string $tableName, array $columns, string $indexName): void
    {
        if (!Schema::hasTable($tableName)) {
            return;
        }

        foreach ($columns as $column) {
            if (!Schema::hasColumn($tableName, $column)) {
                return;
            }
        }

        $this->removeDuplicates($tableName, $columns);

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
            $table->unique($columns, $indexName);
        });
    }

    /**
     * A pre-existing database may already carry duplicate rows, which would make the
     * unique index impossible to create. Keep the newest row of each group.
     */
    private function removeDuplicates(string $tableName, array $columns): void
    {
        if (!Schema::hasColumn($tableName, 'id')) {
            return;
        }

        $keep = DB::table($tableName)
            ->select($columns)
            ->selectRaw('MAX(id) as keep_id')
            ->groupBy($columns)
            ->pluck('keep_id')
            ->all();

        if (!$keep) {
            return;
        }

        DB::table($tableName)->whereNotIn('id', $keep)->delete();
    }

    private function dropIndexIfTableExists(string $tableName, string $indexName): void
    {
        if (!Schema::hasTable($tableName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($indexName) {
            $table->dropUnique($indexName);
        });
    }
};
