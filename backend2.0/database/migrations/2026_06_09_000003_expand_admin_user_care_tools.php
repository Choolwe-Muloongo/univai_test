<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'must_change_password')) {
                $table->boolean('must_change_password')->default(false)->after('password');
            }
            if (!Schema::hasColumn('users', 'password_reset_by_admin_at')) {
                $table->timestamp('password_reset_by_admin_at')->nullable()->after('must_change_password');
            }
            if (!Schema::hasColumn('users', 'password_reset_by_admin_id')) {
                $table->unsignedBigInteger('password_reset_by_admin_id')->nullable()->after('password_reset_by_admin_at');
            }
        });

        if (!Schema::hasTable('admin_user_notes')) {
            Schema::create('admin_user_notes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->unsignedBigInteger('admin_id')->nullable();
                $table->text('note');
                $table->timestamps();

                $table->index(['user_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_user_notes');

        Schema::table('users', function (Blueprint $table) {
            foreach (['password_reset_by_admin_id', 'password_reset_by_admin_at', 'must_change_password'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
