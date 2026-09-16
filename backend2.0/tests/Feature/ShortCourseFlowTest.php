<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Lesson;
use App\Models\School;
use App\Models\ShortCourseEnrollment;
use App\Models\User;
use App\Support\StudentAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShortCourseFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_start_complete_and_request_certificate_payment_for_short_course(): void
    {
        $student = User::factory()->create(['role' => 'premium-student']);
        // Registration provisions academic entitlements (AuthController::register); the factory
        // bypasses that, and access:student.portal is denied without them.
        StudentAccess::syncUserEntitlements($student, StudentAccess::TIER_PREMIUM, 'test-setup');

        School::create(['id' => 'ict', 'name' => 'School of ICT']);
        $course = Course::create([
            'id' => 'ai-foundations',
            'school_id' => 'ict',
            'title' => 'AI Foundations',
            'description' => 'Applied AI basics.',
            // Only published courses are enrollable; the column defaults to draft.
            'status' => 'published',
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
        // Exam submission requires a bank of at least 25 questions.
        $answers = [];
        for ($i = 1; $i <= 25; $i++) {
            $answer = "Correct answer {$i}";
            ExamQuestion::create([
                'course_id' => $course->id,
                'question' => "Question {$i}?",
                'options' => [$answer, "Wrong answer {$i}"],
                'answer' => $answer,
            ]);
            $answers[] = $answer;
        }

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
            ->postJson("/api/students/me/short-courses/{$course->id}/exam", ['answers' => $answers])
            ->assertOk()
            ->assertJson(['passed' => true]);

        $this->withSession(['user' => ['id' => $student->id, 'role' => 'premium-student']])
            ->postJson("/api/students/me/short-courses/{$course->id}/certificate/pay")
            ->assertOk()
            ->assertJsonStructure(['checkout_url', 'invoiceId']);
    }
}
