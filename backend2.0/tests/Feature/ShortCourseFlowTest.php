<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Lesson;
use App\Models\School;
use App\Models\ShortCourseEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShortCourseFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_start_complete_and_request_certificate_payment_for_short_course(): void
    {
        config(['services.lenco.allow_stub_checkout' => true]);
        Storage::fake('local');

        $student = User::factory()->create(['role' => 'premium-student']);
        School::create(['id' => 'ict', 'name' => 'School of ICT']);
        $course = Course::create([
            'id' => 'ai-foundations',
            'school_id' => 'ict',
            'title' => 'AI Foundations',
            'description' => 'Applied AI basics.',
            'certificate_type' => 'certificate',
            'pricing_type' => 'paid',
            'price' => 50,
            'currency' => 'ZMW',
            'certificate_fee' => 15,
            'certificate_currency' => 'USD',
            'duration_hours' => 4,
            'level' => 'beginner',
            'progress' => 0,
        ]);
        $lesson = Lesson::create(['id' => 'lesson-1', 'title' => 'Welcome', 'summary' => 'Start here']);
        $course->lessons()->attach($lesson->id, ['sort_order' => 1]);
        ExamQuestion::create(['course_id' => $course->id, 'question' => 'AI means?', 'options' => ['Artificial Intelligence', 'Other'], 'answer' => 'Artificial Intelligence']);

        $this->withSession(['user' => ['id' => $student->id, 'role' => 'premium-student']])
            ->postJson("/api/students/me/short-courses/{$course->id}/enroll")
            ->assertOk()
            ->assertJsonStructure(['checkout_url', 'invoiceId']);

        ShortCourseEnrollment::where('student_id', $student->id)->where('short_course_id', $course->id)->update(['entry_fee_paid' => true, 'status' => 'active']);

        $this->withSession(['user' => ['id' => $student->id, 'role' => 'premium-student']])
            ->postJson("/api/students/me/short-courses/{$course->id}/lessons/{$lesson->id}/complete")
            ->assertOk()
            ->assertJson(['progress' => 100]);

        $this->withSession(['user' => ['id' => $student->id, 'role' => 'premium-student']])
            ->postJson("/api/students/me/short-courses/{$course->id}/exam", ['answers' => ['Artificial Intelligence']])
            ->assertOk()
            ->assertJson(['passed' => true]);

        $this->withSession(['user' => ['id' => $student->id, 'role' => 'premium-student']])
            ->postJson("/api/students/me/short-courses/{$course->id}/certificate/pay")
            ->assertOk()
            ->assertJsonStructure(['checkout_url', 'invoiceId']);

        ShortCourseEnrollment::where('student_id', $student->id)->where('short_course_id', $course->id)->update(['certificate_fee_paid' => true]);

        $this->withSession(['user' => ['id' => $student->id, 'role' => 'premium-student']])
            ->get("/api/students/me/short-courses/{$course->id}/certificate")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }
}
