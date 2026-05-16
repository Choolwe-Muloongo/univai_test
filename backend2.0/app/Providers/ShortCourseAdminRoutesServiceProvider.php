<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdminShortCourseInsightsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ShortCourseAdminRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:admin.academic'])
            ->prefix('api/admin')
            ->get('/short-courses/insights', [AdminShortCourseInsightsController::class, 'index']);
    }
}
