<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_centres', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('location');
            $table->string('timezone')->default('UTC');
            $table->unsignedInteger('capacity')->default(0);
            $table->string('approval_status')->default('pending');
            $table->text('approval_notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('approved_by')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_centre_id')->constrained('exam_centres')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->unsignedInteger('capacity');
            $table->string('accessibility_notes')->nullable();
            $table->json('equipment')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('exam_invigilators', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->json('certifications')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_centre_id')->constrained('exam_centres')->cascadeOnDelete();
            $table->foreignId('exam_room_id')->nullable()->constrained('exam_rooms')->nullOnDelete();
            $table->foreignId('exam_invigilator_id')->nullable()->constrained('exam_invigilators')->nullOnDelete();
            $table->string('exam_id');
            $table->string('title');
            $table->string('program_id')->nullable();
            $table->string('module_id')->nullable();
            $table->string('course_id')->nullable();
            $table->string('delivery_mode')->default('physical');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->unsignedInteger('capacity');
            $table->string('status')->default('draft');
            $table->json('rules')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->string('student_id');
            $table->string('student_name')->nullable();
            $table->string('student_email')->nullable();
            $table->string('status')->default('confirmed');
            $table->text('accommodations')->nullable();
            $table->timestamp('booked_at')->useCurrent();
            $table->timestamps();
            $table->unique(['exam_session_id', 'student_id']);
        });

        Schema::create('exam_attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_booking_id')->constrained('exam_bookings')->cascadeOnDelete();
            $table->string('status')->default('scheduled');
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('checked_out_at')->nullable();
            $table->string('verified_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignId('exam_booking_id')->nullable()->constrained('exam_bookings')->nullOnDelete();
            $table->string('severity')->default('medium');
            $table->string('category');
            $table->text('description');
            $table->string('status')->default('open');
            $table->string('reported_by')->nullable();
            $table->json('actions')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_results_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->nullable()->constrained('exam_sessions')->nullOnDelete();
            $table->string('status')->default('queued');
            $table->unsignedInteger('records_synced')->default(0);
            $table->text('message')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->string('triggered_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results_sync_logs');
        Schema::dropIfExists('exam_incidents');
        Schema::dropIfExists('exam_attendance_records');
        Schema::dropIfExists('exam_bookings');
        Schema::dropIfExists('exam_sessions');
        Schema::dropIfExists('exam_invigilators');
        Schema::dropIfExists('exam_rooms');
        Schema::dropIfExists('exam_centres');
    }
};
