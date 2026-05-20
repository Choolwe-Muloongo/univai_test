<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('student_learning_events')) {
            Schema::create('student_learning_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('event_type')->index();
                $table->string('short_course_id')->nullable()->index();
                $table->string('lesson_id')->nullable()->index();
                $table->integer('xp_awarded')->default(0);
                $table->integer('reward_points_awarded')->default(0);
                $table->integer('activity_points_awarded')->default(0);
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_xp_balances')) {
            Schema::create('student_xp_balances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->integer('xp')->default(0);
                $table->integer('level')->default(1);
                $table->string('level_title')->default('New Learner');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_reward_points')) {
            Schema::create('student_reward_points', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->integer('balance')->default(0);
                $table->integer('lifetime_earned')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_streaks')) {
            Schema::create('student_streaks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->integer('current_days')->default(0);
                $table->integer('best_days')->default(0);
                $table->date('last_activity_date')->nullable();
                $table->integer('streak_shields')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_daily_quests')) {
            Schema::create('student_daily_quests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('quest_key');
                $table->date('quest_date');
                $table->integer('progress')->default(0);
                $table->integer('target')->default(1);
                $table->boolean('completed')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                $table->unique(['student_id', 'quest_key', 'quest_date']);
            });
        }

        if (!Schema::hasTable('student_achievements')) {
            Schema::create('student_achievements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('achievement_key');
                $table->string('title');
                $table->text('description')->nullable();
                $table->timestamp('earned_at')->nullable();
                $table->timestamps();
                $table->unique(['student_id', 'achievement_key']);
            });
        }

        if (!Schema::hasTable('student_mistakes')) {
            Schema::create('student_mistakes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('short_course_id')->nullable()->index();
                $table->string('lesson_id')->nullable()->index();
                $table->text('question');
                $table->text('student_answer')->nullable();
                $table->text('correct_answer')->nullable();
                $table->string('topic')->nullable();
                $table->string('difficulty')->nullable();
                $table->text('explanation')->nullable();
                $table->boolean('fixed')->default(false);
                $table->timestamp('fixed_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_reward_redemptions')) {
            Schema::create('student_reward_redemptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('reward_code');
                $table->string('title');
                $table->integer('points_spent');
                $table->string('status')->default('completed');
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_reward_redemptions');
        Schema::dropIfExists('student_mistakes');
        Schema::dropIfExists('student_achievements');
        Schema::dropIfExists('student_daily_quests');
        Schema::dropIfExists('student_streaks');
        Schema::dropIfExists('student_reward_points');
        Schema::dropIfExists('student_xp_balances');
        Schema::dropIfExists('student_learning_events');
    }
};
