<?php

namespace App\Providers;

use App\Http\Controllers\Api\ShortCourseController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ShortCourseStudentRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:student.portal'])
            ->prefix('api/students/me/short-courses')
            ->group(function () {
                Route::get('/', [ShortCourseController::class, 'mine']);
                Route::post('/{courseId}/enroll', [ShortCourseController::class, 'enroll']);
                Route::get('/{courseId}/progress', [ShortCourseController::class, 'progress']);
                Route::post('/{courseId}/lessons/{lessonId}/complete', [ShortCourseController::class, 'completeLesson']);
                Route::get('/{courseId}/exam', [ShortCourseController::class, 'exam']);
                Route::post('/{courseId}/exam/submit', [ShortCourseController::class, 'submitExam']);
                Route::post('/{courseId}/certificate/pay', [ShortCourseController::class, 'payCertificate']);
                Route::get('/{courseId}/certificate', [ShortCourseController::class, 'certificate']);
            });
    }
}
