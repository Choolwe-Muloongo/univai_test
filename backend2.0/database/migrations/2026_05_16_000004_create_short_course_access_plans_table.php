<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('short_course_access_plans')) {
            return;
        }

        Schema::create('short_course_access_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('ZMW');
            $table->unsignedInteger('access_hours')->default(720);
            $table->unsignedInteger('ai_hours')->default(0);
            $table->unsignedInteger('hourly_ai_quota')->default(0);
            $table->unsignedInteger('daily_ai_quota')->default(0);
            $table->boolean('certificate_included')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $plans = [
            ['code' => 'access_only', 'name' => 'Monthly Course Access Extension', 'amount' => 20, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 0, 'hourly_ai_quota' => 0, 'daily_ai_quota' => 0, 'certificate_included' => false, 'sort_order' => 1],
            ['code' => 'access_ai', 'name' => 'Monthly Course and AI Access', 'amount' => 50, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 40, 'daily_ai_quota' => 240, 'certificate_included' => false, 'sort_order' => 2],
            ['code' => 'premium_certificate', 'name' => 'Monthly Premium Course, AI and Certificate', 'amount' => 250, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 100, 'daily_ai_quota' => 600, 'certificate_included' => true, 'sort_order' => 3],
            ['code' => 'elite_certificate', 'name' => 'Monthly Elite Course, AI and Certificate', 'amount' => 350, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 180, 'daily_ai_quota' => 1000, 'certificate_included' => true, 'sort_order' => 4],
        ];

        foreach ($plans as $plan) {
            DB::table('short_course_access_plans')->insert($plan + ['created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('short_course_access_plans');
    }
};
