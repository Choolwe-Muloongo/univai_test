<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdmissionsLettersController;
use App\Models\Application;
use App\Observers\ApplicationObserver;
use App\Support\Affiliates\AffiliateService;
use App\Support\Affiliates\RuntimeAffiliateService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AffiliateService::class, RuntimeAffiliateService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Application::observe(ApplicationObserver::class);

        Route::middleware(['api', 'session.auth', 'access:admissions.applicant'])
            ->get('/api/admissions/admission-letter', [AdmissionsLettersController::class, 'downloadAdmissionLetter']);

        RateLimiter::for('login', function (Request $request) {
            $email = strtolower((string) $request->input('email', ''));
            $key = $email !== '' ? "{$request->ip()}|{$email}" : $request->ip();
            return Limit::perMinute(10)->by($key);
        });

        RateLimiter::for('ai', function (Request $request) {
            $sessionUser = $request->session()->get('user');
            $id = is_array($sessionUser) && !empty($sessionUser['id'])
                ? (string) $sessionUser['id']
                : $request->ip();
            return Limit::perMinute(30)->by($id);
        });

        RateLimiter::for('admissions', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        RateLimiter::for('general', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        if (app()->environment('production') && config('app.debug')) {
            Log::warning('APP_DEBUG is enabled in production. Disable it before launch.');
        }
    }
}
