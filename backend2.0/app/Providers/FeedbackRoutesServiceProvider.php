<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdminFeedbackController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\NotificationsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class FeedbackRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:student.portal'])
            ->prefix('api')
            ->group(function () {
                Route::get('/feedback', [FeedbackController::class, 'index']);
                Route::post('/feedback', [FeedbackController::class, 'store']);
                Route::get('/feedback/{feedbackPost}', [FeedbackController::class, 'show']);
                Route::post('/feedback/{feedbackPost}/vote', [FeedbackController::class, 'vote']);
                Route::delete('/feedback/{feedbackPost}/vote', [FeedbackController::class, 'unvote']);
                Route::post('/feedback/{feedbackPost}/comments', [FeedbackController::class, 'comment']);
                Route::post('/app-rating', [FeedbackController::class, 'rating']);
                Route::get('/app-rating/summary', [FeedbackController::class, 'ratingSummary']);
            });

        Route::middleware(['api', 'session.auth'])
            ->prefix('api')
            ->group(function () {
                Route::get('/notifications', [NotificationsController::class, 'index']);
                Route::post('/notifications/read-all', [NotificationsController::class, 'markAllRead']);
                Route::post('/notifications/{notification}/read', [NotificationsController::class, 'markRead']);
            });

        Route::middleware(['api', 'session.auth', 'access:admin.portal'])
            ->prefix('api/admin')
            ->group(function () {
                Route::get('/feedback', [AdminFeedbackController::class, 'index']);
                Route::get('/feedback/stats', [AdminFeedbackController::class, 'stats']);
                Route::patch('/feedback/{feedbackPost}', [AdminFeedbackController::class, 'update']);
                Route::post('/feedback/{feedbackPost}/comments', [AdminFeedbackController::class, 'comment']);
            });
    }
}
