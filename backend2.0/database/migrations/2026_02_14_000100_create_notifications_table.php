<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient_email')->nullable()->index();
            $table->string('recipient_name')->nullable();
            $table->string('type')->index();
            $table->string('category')->index();
            $table->string('title');
            $table->text('message');
            $table->string('action_url')->nullable();
            $table->string('priority')->default('normal')->index();
            $table->json('channels')->nullable();
            $table->json('data')->nullable();
            $table->string('notifiable_type')->nullable();
            $table->string('notifiable_id')->nullable();
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index(['user_id', 'read_at', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
