<?php

namespace App\Providers;

use App\Http\Controllers\Api\AdmissionsLettersController;
use App\Http\Controllers\Api\ResearchController;
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
    public function register(): void { $this->app->singleton(AffiliateService::class, RuntimeAffiliateService::class); }

    public function boot(): void
    {
        Application::observe(ApplicationObserver::class);
        Route::middleware(['api','session.auth','access:admissions.applicant'])->get('/api/admissions/admission-letter',[AdmissionsLettersController::class,'downloadAdmissionLetter']);

        $research=Route::middleware(['api','session.auth']);
        $research->get('/api/research',[ResearchController::class,'index']);
        $research->post('/api/research',[ResearchController::class,'store']);
        $research->get('/api/research/dashboard',[ResearchController::class,'dashboard']);
        $research->get('/api/research/score',[ResearchController::class,'scoreHistory']);
        $research->post('/api/research/score',[ResearchController::class,'score']);
        $research->get('/api/research/wallet',[ResearchController::class,'wallet']);
        $research->post('/api/research/wallet/transactions',[ResearchController::class,'walletTransaction']);
        $research->get('/api/research/notifications',[ResearchController::class,'notifications']);
        $research->patch('/api/research/notifications/{id}/read',[ResearchController::class,'markNotification']);
        $research->get('/api/research/{id}',[ResearchController::class,'show']);
        $research->patch('/api/research/{id}',[ResearchController::class,'update']);
        $research->delete('/api/research/{id}',[ResearchController::class,'destroy']);
        $research->post('/api/research/{id}/transition',[ResearchController::class,'transition']);
        $research->post('/api/research/{id}/apply',[ResearchController::class,'apply']);
        $research->get('/api/research/{id}/applications',[ResearchController::class,'applications']);
        $research->patch('/api/research/{id}/applications/{application}',[ResearchController::class,'updateApplication']);

        RateLimiter::for('login',function(Request $request){$email=strtolower((string)$request->input('email',''));$key=$email!==''?"{$request->ip()}|{$email}":$request->ip();return Limit::perMinute(10)->by($key);});
        RateLimiter::for('ai',function(Request $request){$u=$request->session()->get('user');$id=is_array($u)&&!empty($u['id'])?(string)$u['id']:$request->ip();return Limit::perMinute(30)->by($id);});
        RateLimiter::for('admissions',fn(Request $request)=>Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('general',fn(Request $request)=>Limit::perMinute(120)->by($request->ip()));
        if(app()->environment('production')&&config('app.debug'))Log::warning('APP_DEBUG is enabled in production. Disable it before launch.');
    }
}
