<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdminExamQuestionsController;
use App\Http\Controllers\Api\AdminShortCourseInsightsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ShortCourseAdminRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:admin.academic'])
            ->prefix('api/admin')
            ->group(function () {
                Route::get('/short-courses/insights', [AdminShortCourseInsightsController::class, 'index']);
                Route::get('/short-courses/question-bank', [AdminExamQuestionsController::class, 'index']);
                Route::post('/short-courses/question-bank', [AdminExamQuestionsController::class, 'store']);
                Route::post('/short-courses/question-bank/bulk', [AdminExamQuestionsController::class, 'bulkStore']);
                Route::patch('/short-courses/question-bank/{examQuestion}', [AdminExamQuestionsController::class, 'update']);
                Route::delete('/short-courses/question-bank/{examQuestion}', [AdminExamQuestionsController::class, 'destroy']);
            });
    }
}