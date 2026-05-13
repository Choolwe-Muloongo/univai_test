<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->text('needs_info_message')->nullable()->after('offer_accepted_at');
            $table->timestamp('needs_info_at')->nullable()->after('needs_info_message');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['needs_info_message', 'needs_info_at']);
        });
    }
};
