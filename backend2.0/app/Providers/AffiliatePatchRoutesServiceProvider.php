<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AffiliatePatchRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth'])
            ->prefix('api')
            ->group(function () {
                Route::get('/notifications', fn () => response()->json(['notifications' => [], 'unread' => 0]));
            });

        Route::middleware(['api', 'session.auth', 'access:student.portal'])
            ->prefix('api')
            ->group(function () {
                Route::post('/ai/generate', [\App\Http\Controllers\Api\AiController::class, 'generate'])->middleware('throttle:ai');
            });

        Route::middleware(['api', 'session.auth', 'access:student.portal'])
            ->prefix('api/students/me')
            ->group(function () {
                Route::get('/affiliate', [\App\Http\Controllers\Api\AffiliateGateController::class, 'me']);
                Route::post('/affiliate/apply', [\App\Http\Controllers\Api\AffiliateGateController::class, 'apply'])->middleware('throttle:general');
            });

        Route::middleware(['api', 'session.auth', 'access:admin.portal', 'access:admin.finance'])
            ->prefix('api/admin/affiliates')
            ->group(function () {
                Route::get('/', [\App\Http\Controllers\Api\AdminAffiliateRequirementsController::class, 'index']);
                Route::patch('/{affiliate}/status', [\App\Http\Controllers\Api\AdminAffiliateRequirementsController::class, 'updateStatus']);
            });
    }
}
