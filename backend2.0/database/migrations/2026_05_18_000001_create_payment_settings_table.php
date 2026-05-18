<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payment_settings')) {
            return;
        }

        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('lenco_collections_enabled')->default(false);
            $table->text('test_mode_message')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::table('payment_settings')->insert([
            'lenco_collections_enabled' => false,
            'test_mode_message' => 'Lenco collections are disabled. Payments activate in test mode.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
