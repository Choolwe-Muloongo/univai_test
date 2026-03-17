<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exception_cases', function (Blueprint $table) {
            $table->id();
            $table->string('exceptionable_type');
            $table->string('exceptionable_id');
            $table->string('exception_type');
            $table->string('reason_code');
            $table->json('evidence_attachments')->nullable();
            $table->string('escalation_target_type');
            $table->string('escalation_target_id');
            $table->json('approval_chain');
            $table->text('expiry_rollback_condition');
            $table->string('status')->default('open');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['exceptionable_type', 'exceptionable_id'], 'exception_cases_target_idx');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exception_cases');
    }
};
