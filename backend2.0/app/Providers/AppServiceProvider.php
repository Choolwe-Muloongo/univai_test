<?php
namespace App\Providers;
use App\Http\Controllers\Api\AdmissionsLettersController;
use App\Http\Controllers\Api\ResearchController;
use App\Http\Controllers\Api\ResearchRewardsController;
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

        // Research records are browseable without authentication. Actions that create, apply,
        // manage records, or expose personal data remain protected below.
        //
        // Route order matters here: /api/research/{id} matches any single segment, so every
        // literal path below it must be registered first or the wildcard answers it with
        // "Research record not found". Keep the {id} routes last in this block.
        $research=Route::middleware(['api']);
        $researchAuth=Route::middleware(['api','session.auth']);

        $research->get('/api/research',[ResearchController::class,'index']);
        $researchAuth->post('/api/research',[ResearchController::class,'store']);
        // The portal dashboard is keyed on the signed-in user (score, owned records), so it
        // is not part of public browsing; anonymously it rendered the portal with an empty id.
        $researchAuth->get('/api/research/dashboard',[ResearchController::class,'dashboard']);
        $researchAuth->get('/api/research/score',[ResearchController::class,'scoreHistory']);
        $researchAuth->post('/api/research/score',[ResearchController::class,'score']);
        $researchAuth->get('/api/research/rewards',[ResearchRewardsController::class,'index']);
        $researchAuth->post('/api/research/rewards',[ResearchRewardsController::class,'award']);
        $researchAuth->get('/api/research/wallet',[ResearchController::class,'wallet']);
        $researchAuth->post('/api/research/wallet/transactions',[ResearchController::class,'walletTransaction']);
        $researchAuth->get('/api/research/notifications',[ResearchController::class,'notifications']);
        $researchAuth->patch('/api/research/notifications/{id}/read',[ResearchController::class,'markNotification']);
        $researchAuth->post('/api/research/ai',[ResearchController::class,'ai'])->middleware('throttle:ai');

        // research_entities.id is a uuid column, so a non-uuid id reaches Postgres as a cast
        // error and surfaces as a 500 rather than a missing record. Constraining the parameter
        // makes an unknown id a clean 404 on every driver.
        $research->get('/api/research/{id}',[ResearchController::class,'show'])->whereUuid('id');
        $researchAuth->patch('/api/research/{id}',[ResearchController::class,'update'])->whereUuid('id');
        $researchAuth->delete('/api/research/{id}',[ResearchController::class,'destroy'])->whereUuid('id');
        $researchAuth->post('/api/research/{id}/transition',[ResearchController::class,'transition'])->whereUuid('id');
        $researchAuth->get('/api/research/{id}/applications',[ResearchController::class,'applications'])->whereUuid('id');
        $researchAuth->patch('/api/research/{id}/applications/{application}',[ResearchController::class,'updateApplication'])->whereUuid('id');
        $researchAuth->post('/api/research/{id}/apply',[ResearchController::class,'apply'])->middleware('access:student.portal')->whereUuid('id');

        Route::middleware(['api','session.auth','access:admin.portal'])->get('/api/admin/research/dashboard',[ResearchController::class,'adminDashboard']);
        RateLimiter::for('login',function(Request $request){$email=strtolower((string)$request->input('email',''));$key=$email!==''?"{$request->ip()}|{$email}":$request->ip();return Limit::perMinute(10)->by($key);});
        RateLimiter::for('ai',function(Request $request){$u=$request->session()->get('user');$id=is_array($u)&&!empty($u['id'])?(string)$u['id']:$request->ip();return Limit::perMinute(30)->by($id);});
        RateLimiter::for('admissions',fn(Request $request)=>Limit::perMinute(20)->by($request->ip()));RateLimiter::for('general',fn(Request $request)=>Limit::perMinute(120)->by($request->ip()));
        if(app()->environment('production')&&config('app.debug'))Log::warning('APP_DEBUG is enabled in production. Disable it before launch.');
    }
}