<?php

use App\Http\Controllers\Api\AcademicDatasetController;
use App\Http\Controllers\Api\ContentReviewController;
use App\Http\Controllers\Api\ProgrammeLessonProgressController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    Route::middleware(['session.auth', 'access:student.portal'])->group(function () {
        Route::post('/students/me/programme-lessons/{lessonId}/complete', [ProgrammeLessonProgressController::class, 'complete']);
    });

    Route::prefix('admin')->middleware(['session.auth', 'access:admin.academic'])->group(function () {
        Route::patch('/lessons/{lessonId}/review', [ContentReviewController::class, 'reviewLesson']);
        Route::patch('/courses/{courseId}/submit-review', [ContentReviewController::class, 'submitCourseForReview']);
        Route::patch('/courses/{courseId}/approve', [ContentReviewController::class, 'approveCourse']);
        Route::patch('/courses/{courseId}/publish-reviewed', [ContentReviewController::class, 'publishApprovedCourse']);
        Route::post('/academic-datasets/export', [AcademicDatasetController::class, 'export']);
    });
});
