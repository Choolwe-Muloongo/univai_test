<?php

use App\Support\Access\AccessControl;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('timezone')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedTinyInteger('completion_percent')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('tier')->default('none');
            $table->string('status')->default('none');
            $table->string('provider')->nullable();
            $table->string('provider_subscription_id')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('academic_entitlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('scope_type')->nullable();
            $table->string('scope_id')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'code', 'scope_type', 'scope_id'], 'entitlements_unique_scope');
            $table->index(['user_id', 'status']);
        });

        Schema::create('user_state_transitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('from_state')->nullable();
            $table->string('to_state');
            $table->string('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'to_state']);
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('description')->nullable();
            $table->json('requirements');
            $table->timestamps();
        });

        $now = now();
        foreach (AccessControl::PERMISSIONS as $key => $requirements) {
            DB::table('permissions')->insert([
                'key' => $key,
                'description' => str($key)->replace('.', ' ')->title()->toString(),
                'requirements' => json_encode($requirements),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('user_state_transitions');
        Schema::dropIfExists('academic_entitlements');
        Schema::dropIfExists('user_subscriptions');
        Schema::dropIfExists('user_profiles');
    }
};
