<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'registrar_name')) {
                $table->string('registrar_name')->nullable()->after('admission_letter_url');
            }
            if (!Schema::hasColumn('applications', 'registrar_title')) {
                $table->string('registrar_title')->nullable()->after('registrar_name');
            }
            if (!Schema::hasColumn('applications', 'registrar_signature')) {
                $table->longText('registrar_signature')->nullable()->after('registrar_title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'registrar_signature')) {
                $table->dropColumn('registrar_signature');
            }
            if (Schema::hasColumn('applications', 'registrar_title')) {
                $table->dropColumn('registrar_title');
            }
            if (Schema::hasColumn('applications', 'registrar_name')) {
                $table->dropColumn('registrar_name');
            }
        });
    }
};
