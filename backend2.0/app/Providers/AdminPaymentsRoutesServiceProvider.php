<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdminPaymentsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AdminPaymentsRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:admin.portal'])
            ->prefix('api/admin')
            ->group(function () {
                Route::get('/payments', [AdminPaymentsController::class, 'index']);
            });
    }
}
