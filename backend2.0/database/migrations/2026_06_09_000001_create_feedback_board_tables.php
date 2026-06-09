<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_posts', function (Blueprint $table) {
            $table->id();
            $table->string('user_key')->nullable()->index();
            $table->string('author_name')->nullable();
            $table->string('author_email')->nullable();
            $table->enum('type', ['feature', 'bug', 'suggestion', 'rating'])->default('suggestion')->index();
            $table->string('title');
            $table->text('body');
            $table->unsignedTinyInteger('rating')->nullable();
            $table->enum('status', ['open', 'under_review', 'planned', 'in_progress', 'completed', 'rejected', 'duplicate'])->default('open')->index();
            $table->text('admin_response')->nullable();
            $table->unsignedBigInteger('duplicate_of')->nullable()->index();
            $table->unsignedInteger('upvotes_count')->default(0)->index();
            $table->unsignedInteger('comments_count')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('feedback_votes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('feedback_post_id')->index();
            $table->string('user_key')->index();
            $table->timestamps();
            $table->unique(['feedback_post_id', 'user_key'], 'feedback_votes_post_user_unique');
        });

        Schema::create('feedback_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('feedback_post_id')->index();
            $table->string('user_key')->nullable()->index();
            $table->string('author_name')->nullable();
            $table->text('body');
            $table->boolean('is_admin_reply')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('app_ratings', function (Blueprint $table) {
            $table->id();
            $table->string('user_key')->unique();
            $table->string('author_name')->nullable();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_ratings');
        Schema::dropIfExists('feedback_comments');
        Schema::dropIfExists('feedback_votes');
        Schema::dropIfExists('feedback_posts');
    }
};
