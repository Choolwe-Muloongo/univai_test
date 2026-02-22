<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->text('offer_letter_message')->nullable()->after('notes');
            $table->string('offer_letter_url')->nullable()->after('offer_letter_message');
            $table->timestamp('offer_issued_at')->nullable()->after('offer_letter_url');
            $table->timestamp('offer_accepted_at')->nullable()->after('offer_issued_at');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'offer_letter_message',
                'offer_letter_url',
                'offer_issued_at',
                'offer_accepted_at',
            ]);
        });
    }
};
