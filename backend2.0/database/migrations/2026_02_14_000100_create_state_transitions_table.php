<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('state_transitions', function (Blueprint $table) {
            $table->id();
            $table->morphs('subject');
            $table->string('state_field')->default('status');
            $table->string('previous_state')->nullable();
            $table->string('new_state');
            $table->string('trigger');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type')->nullable();
            $table->string('actor_role')->nullable();
            $table->string('actor_label')->nullable();
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();
            $table->string('notification_status')->default('skipped');
            $table->string('notification_channel')->nullable();
            $table->string('notification_recipient')->nullable();
            $table->text('notification_error')->nullable();
            $table->json('appeal_option')->nullable();
            $table->json('reapply_option')->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id', 'created_at']);
            $table->index(['new_state', 'trigger']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('state_transitions');
    }
};
