<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ShortCourseEnrollment;
use Illuminate\Http\Request;

class AdminShortCourseInsightsController extends Controller
{
    public function index(Request $request)
    {
        $courses = Course::withCount('lessons')->orderBy('created_at', 'desc')->get();
        $enrollments = ShortCourseEnrollment::with(['student', 'course'])->orderBy('updated_at', 'desc')->get();

        $publishedCourses = $courses->where('status', 'published')->count();
        $draftCourses = $courses->count() - $publishedCourses;
        $paidCourses = $courses->filter(fn (Course $course) => (float) $course->price > 0)->count();
        $freeCourses = $courses->count() - $paidCourses;
        $activeEnrollments = $enrollments->whereIn('status', ['active', 'lessons_completed', 'completed'])->count();
        $completedEnrollments = $enrollments->where('status', 'completed')->count();
        $certificateReady = $enrollments->filter(fn (ShortCourseEnrollment $enrollment) => (float) ($enrollment->exam_score ?? 0) >= 50 || $enrollment->completed_at !== null)->count();
        $entryFeesPaid = $enrollments->where('entry_fee_paid', true)->count();
        $certificateFeesPaid = $enrollments->where('certificate_fee_paid', true)->count();

        return response()->json([
            'summary' => [
                'courses' => $courses->count(),
                'publishedCourses' => $publishedCourses,
                'draftCourses' => $draftCourses,
                'paidCourses' => $paidCourses,
                'freeCourses' => $freeCourses,
                'enrollments' => $enrollments->count(),
                'activeEnrollments' => $activeEnrollments,
                'completedEnrollments' => $completedEnrollments,
                'certificateReady' => $certificateReady,
                'entryFeesPaid' => $entryFeesPaid,
                'certificateFeesPaid' => $certificateFeesPaid,
                'entryFeeValue' => round($courses->sum(fn (Course $course) => (float) $course->price), 2),
                'certificateFeeValue' => round($courses->sum(fn (Course $course) => (float) $course->certificate_fee), 2),
            ],
            'courses' => $courses->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'status' => $course->status,
                'reviewStatus' => $course->review_status,
                'pricingType' => $course->pricing_type,
                'price' => (float) $course->price,
                'currency' => $course->currency,
                'certificateFee' => (float) $course->certificate_fee,
                'certificateCurrency' => $course->certificate_currency,
                'durationHours' => $course->duration_hours,
                'level' => $course->level,
                'lessonCount' => $course->lessons_count,
                'enrollmentCount' => $enrollments->where('short_course_id', $course->id)->count(),
                'paidEnrollmentCount' => $enrollments->where('short_course_id', $course->id)->where('entry_fee_paid', true)->count(),
                'completedEnrollmentCount' => $enrollments->where('short_course_id', $course->id)->where('status', 'completed')->count(),
            ])->values(),
            'enrollments' => $enrollments->map(fn (ShortCourseEnrollment $enrollment) => [
                'id' => $enrollment->id,
                'studentId' => $enrollment->student_id,
                'studentName' => $enrollment->student?->name ?? 'Unknown learner',
                'studentEmail' => $enrollment->student?->email,
                'courseId' => $enrollment->short_course_id,
                'courseTitle' => $enrollment->course?->title ?? 'Unknown course',
                'status' => $enrollment->status,
                'progress' => (int) $enrollment->progress,
                'entryFeePaid' => (bool) $enrollment->entry_fee_paid,
                'certificateFeePaid' => (bool) $enrollment->certificate_fee_paid,
                'examScore' => $enrollment->exam_score !== null ? (float) $enrollment->exam_score : null,
                'completedAt' => optional($enrollment->completed_at)->toISOString(),
                'certificateIssuedAt' => optional($enrollment->certificate_issued_at)->toISOString(),
                'updatedAt' => optional($enrollment->updated_at)->toISOString(),
            ])->values(),
        ]);
    }
}
