<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $formatColumn = chr(37) . 'Y-' . chr(37) . 'm';

        if (Schema::hasTable('affiliate_earnings') && !Schema::hasColumn('affiliate_earnings', $formatColumn)) {
            Schema::table('affiliate_earnings', function (Blueprint $table) use ($formatColumn) {
                $table->string($formatColumn)->default($formatColumn);
            });
        }

        DB::unprepared("CREATE OR REPLACE FUNCTION date_format(value timestamp without time zone, pattern text) RETURNS text LANGUAGE sql IMMUTABLE AS 'SELECT to_char(value, ''YYYY-MM'');';");
        DB::unprepared("CREATE OR REPLACE FUNCTION date_format(value timestamp with time zone, pattern text) RETURNS text LANGUAGE sql IMMUTABLE AS 'SELECT to_char(value, ''YYYY-MM'');';");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $formatColumn = chr(37) . 'Y-' . chr(37) . 'm';

        DB::unprepared('DROP FUNCTION IF EXISTS date_format(timestamp without time zone, text);');
        DB::unprepared('DROP FUNCTION IF EXISTS date_format(timestamp with time zone, text);');

        if (Schema::hasTable('affiliate_earnings') && Schema::hasColumn('affiliate_earnings', $formatColumn)) {
            Schema::table('affiliate_earnings', function (Blueprint $table) use ($formatColumn) {
                $table->dropColumn($formatColumn);
            });
        }
    }
};
