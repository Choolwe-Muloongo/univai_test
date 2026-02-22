<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_documents', function (Blueprint $table) {
            $table->string('source')->default('manual')->after('intake_id');
            $table->string('status')->default('approved')->after('source');
            $table->foreignId('approved_by')->nullable()->after('uploaded_by')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->text('review_notes')->nullable()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('lesson_documents', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['source', 'status', 'approved_by', 'approved_at', 'review_notes']);
        });
    }
};
