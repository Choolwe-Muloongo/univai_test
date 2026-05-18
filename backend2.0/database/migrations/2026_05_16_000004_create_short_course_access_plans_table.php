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
            ['code' => 'starter_access', 'name' => 'Starter Access', 'amount' => 30, 'currency' => 'ZMW', 'access_hours' => 336, 'ai_hours' => 0, 'hourly_ai_quota' => 0, 'daily_ai_quota' => 0, 'certificate_included' => false, 'sort_order' => 1],
            ['code' => 'monthly_access', 'name' => 'Monthly Access', 'amount' => 50, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 0, 'hourly_ai_quota' => 0, 'daily_ai_quota' => 0, 'certificate_included' => false, 'sort_order' => 2],
            ['code' => 'ai_lite', 'name' => 'AI Lite', 'amount' => 75, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 15, 'daily_ai_quota' => 75, 'certificate_included' => false, 'sort_order' => 3],
            ['code' => 'ai_plus', 'name' => 'AI Plus', 'amount' => 120, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 30, 'daily_ai_quota' => 150, 'certificate_included' => false, 'sort_order' => 4],
            ['code' => 'ai_scholar', 'name' => 'AI Scholar', 'amount' => 180, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 40, 'daily_ai_quota' => 200, 'certificate_included' => false, 'sort_order' => 5],
            ['code' => 'certified_premium', 'name' => 'Certified Premium', 'amount' => 250, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 50, 'daily_ai_quota' => 250, 'certificate_included' => true, 'sort_order' => 6],
            ['code' => 'certified_elite', 'name' => 'Certified Elite', 'amount' => 350, 'currency' => 'ZMW', 'access_hours' => 720, 'ai_hours' => 720, 'hourly_ai_quota' => 80, 'daily_ai_quota' => 400, 'certificate_included' => true, 'sort_order' => 7],
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
