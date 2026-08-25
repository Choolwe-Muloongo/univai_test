<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('research_entities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('entity_type', 50)->index();
            $table->string('title')->nullable();
            $table->string('status', 50)->nullable()->index();
            $table->string('owner_id')->nullable()->index();
            $table->json('data')->nullable();
            $table->timestamps();
        });
        Schema::create('research_workflow_events', function (Blueprint $table) {
            $table->id(); $table->uuid('entity_id')->index(); $table->string('entity_type', 50)->index();
            $table->string('from_status', 50)->nullable(); $table->string('to_status', 50); $table->string('actor_id')->nullable()->index();
            $table->text('comment')->nullable(); $table->timestamps();
        });
        Schema::create('research_score_transactions', function (Blueprint $table) {
            $table->id(); $table->string('user_id')->index(); $table->string('action', 80); $table->integer('points');
            $table->uuid('entity_id')->nullable()->index(); $table->string('entity_type', 50)->nullable(); $table->text('description')->nullable(); $table->timestamps();
        });
        Schema::create('research_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('owner_id')->index(); $table->string('wallet_type', 40); $table->decimal('balance', 18, 2)->default(0); $table->string('currency', 12)->default('ZMW'); $table->timestamps();
        });
        Schema::create('research_wallet_transactions', function (Blueprint $table) {
            $table->id(); $table->uuid('wallet_id')->index(); $table->string('type', 40); $table->decimal('amount', 18, 2);
            $table->string('reference')->nullable()->index(); $table->text('description')->nullable(); $table->string('actor_id')->nullable()->index(); $table->timestamps();
        });
        Schema::create('research_notifications', function (Blueprint $table) {
            $table->id(); $table->string('user_id')->index(); $table->string('type', 60); $table->string('title'); $table->text('message');
            $table->json('data')->nullable(); $table->timestamp('read_at')->nullable(); $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('research_notifications'); Schema::dropIfExists('research_wallet_transactions'); Schema::dropIfExists('research_wallets');
        Schema::dropIfExists('research_score_transactions'); Schema::dropIfExists('research_workflow_events'); Schema::dropIfExists('research_entities');
    }
};
