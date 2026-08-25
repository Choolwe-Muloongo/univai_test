<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create('research_rewards', function (Blueprint $table) { $table->id(); $table->string('user_id')->index(); $table->string('action',80); $table->integer('aftacoin'); $table->string('badge',120)->nullable(); $table->uuid('entity_id')->nullable()->index(); $table->string('entity_type',50)->nullable(); $table->timestamps(); }); }
    public function down(): void { Schema::dropIfExists('research_rewards'); }
};
