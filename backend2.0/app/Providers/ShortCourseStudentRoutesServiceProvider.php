<?php

namespace App\Providers;

use App\Http\Controllers\Api\ShortCourseAccessController;
use App\Http\Controllers\Api\ShortCourseController;
use App\Http\Controllers\Api\StudentGamificationController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ShortCourseStudentRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:student.portal'])
            ->prefix('api/students/me')
            ->group(function () {
                Route::get('/gamification', [StudentGamificationController::class, 'state']);
                Route::get('/daily-quests', [StudentGamificationController::class, 'dailyQuests']);
                Route::post('/learning-events', [StudentGamificationController::class, 'recordEvent']);
                Route::get('/rewards', [StudentGamificationController::class, 'rewards']);
                Route::post('/rewards/redeem', [StudentGamificationController::class, 'redeem']);
                Route::get('/leaderboard/activity', [StudentGamificationController::class, 'leaderboard']);
                Route::get('/mistakes', [StudentGamificationController::class, 'mistakes']);
                Route::post('/mistakes/{id}/review', [StudentGamificationController::class, 'reviewMistake']);
            });

        Route::middleware(['api', 'session.auth', 'access:student.portal'])
            ->prefix('api/students/me/short-courses')
            ->group(function () {
                Route::get('/', [ShortCourseController::class, 'mine']);
                Route::get('/bundles', [ShortCourseAccessController::class, 'bundlePlans']);
                Route::post('/bundles/purchase', [ShortCourseAccessController::class, 'purchaseBundle']);
                Route::post('/{courseId}/enroll', [ShortCourseController::class, 'enroll']);
                Route::get('/{courseId}/progress', [ShortCourseController::class, 'progress']);
                Route::get('/{courseId}/access-plans', [ShortCourseAccessController::class, 'plans']);
                Route::post('/{courseId}/access-plans/purchase', [ShortCourseAccessController::class, 'purchase']);
                Route::post('/{courseId}/lessons/{lessonId}/complete', [ShortCourseController::class, 'completeLesson']);
                Route::post('/{courseId}/practice', [ShortCourseController::class, 'practice']);
                Route::post('/{courseId}/practice/submit', [ShortCourseController::class, 'submitPractice']);
                Route::get('/{courseId}/exam', [ShortCourseController::class, 'exam']);
                Route::post('/{courseId}/exam/submit', [ShortCourseController::class, 'submitExam']);
                Route::post('/{courseId}/certificate/pay', [ShortCourseController::class, 'payCertificate']);
                Route::get('/{courseId}/certificate', [ShortCourseController::class, 'certificate']);
            });
    }
}
