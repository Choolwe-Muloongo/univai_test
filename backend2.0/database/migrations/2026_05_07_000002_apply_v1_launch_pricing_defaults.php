<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('short_courses')) {
            DB::table('short_courses')->update([
                'pricing_type' => 'paid',
                'price' => 50,
                'currency' => 'ZMW',
                'certificate_fee' => 15,
                'certificate_currency' => 'USD',
                'updated_at' => now(),
            ]);
        }

        if (Schema::hasTable('programs')) {
            DB::table('programs')->whereNull('application_fee')->orWhere('application_fee', 0)->update([
                'application_fee' => 100,
                'application_currency' => 'ZMW',
                'updated_at' => now(),
            ]);

            DB::table('programs')->whereNull('tuition_fee')->orWhere('tuition_fee', 0)->update([
                'tuition_fee' => 650,
                'tuition_currency' => 'ZMW',
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Pricing defaults are business data; do not reverse automatically.
    }
};
