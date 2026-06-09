<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdminUserCareController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AdminUserCareRoutesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware(['api', 'session.auth', 'access:admin.portal'])
            ->prefix('api/admin/users')
            ->group(function () {
                Route::get('/{user}', [AdminUserCareController::class, 'show']);
                Route::post('/{user}/reset-password', [AdminUserCareController::class, 'resetPassword']);
                Route::post('/{user}/suspend', [AdminUserCareController::class, 'suspend']);
                Route::post('/{user}/reactivate', [AdminUserCareController::class, 'reactivate']);
                Route::get('/{user}/notes', [AdminUserCareController::class, 'notes']);
                Route::post('/{user}/notes', [AdminUserCareController::class, 'addNote']);
                Route::get('/{user}/payments', [AdminUserCareController::class, 'payments']);
                Route::post('/{user}/invoices', [AdminUserCareController::class, 'createInvoice']);
                Route::post('/{user}/invoices/{invoice}/mark-paid', [AdminUserCareController::class, 'markInvoicePaid']);
                Route::post('/{user}/invoices/{invoice}/mark-unpaid', [AdminUserCareController::class, 'markInvoiceUnpaid']);
                Route::post('/{user}/entitlements', [AdminUserCareController::class, 'entitlements']);
            });
    }
}
