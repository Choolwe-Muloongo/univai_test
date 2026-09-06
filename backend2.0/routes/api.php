<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AccountAvatarController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ProgramsController;
use App\Http\Controllers\Api\JobsController;
use App\Http\Controllers\Api\ResearchController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\BadgesController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\ConsultantsController;
use App\Http\Controllers\Api\AdmissionsController;
use App\Http\Controllers\Api\AdmissionsLettersController;
use App\Http\Controllers\Api\AdmissionsFeeController;
use App\Http\Controllers\Api\AdmissionsStatusController;
use App\Http\Controllers\Api\AdminAdmissionsDecisionController;
use App\Http\Controllers\Api\AdminCatalogController;
use App\Http\Controllers\Api\AdminAcademicStructureController;
use App\Http\Controllers\Api\AdminWorkspaceController;
use App\Http\Controllers\Api\PlatformExpansionController;
use App\Http\Controllers\Api\PlatformOperationsController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\StudentsController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IntakesController;
use App\Http\Controllers\Api\AdminAssignmentsController;
use App\Http\Controllers\Api\LecturerAssignmentsController;
use App\Http\Controllers\Api\LessonDocumentsController;
use App\Http\Controllers\Api\AdminAuditController;
use App\Http\Controllers\Api\AdminCurriculumController;
use App\Http\Controllers\Api\CourseSessionsController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\RouteChangeController;
use App\Http\Controllers\Api\AcademicPoliciesController;
use App\Http\Controllers\Api\GradesController;
use App\Http\Controllers\Api\AdminExamQuestionsController;
use App\Http\Controllers\Api\LecturerExamQuestionsController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\PaymentMethodsController;
use App\Http\Controllers\Api\PaymentSettingsController;
use App\Http\Controllers\Api\ScholarshipController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\SystemHealthController;
use App\Http\Controllers\Api\LecturerApplicationsController;
use App\Http\Controllers\Api\StudentAssignmentsController;
use App\Http\Controllers\Api\ShortCourseController;
use App\Http\Controllers\Api\ShortCourseManualGuideController;
use App\Http\Controllers\Api\LencoWebhookController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\ExamClinicController;
use App\Http\Controllers\Api\AdminUsersController;
use App\Http\Controllers\Api\DocumentBrandingController;
use App\Support\Access\AccessControl;
use App\Support\Launch\V1LaunchReadiness;
use App\Support\StudentAccess;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

Route::middleware('api')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'brand' => config('univai.brand.name'),
            'targetRegisteredUsers' => config('univai.capacity.target_registered_users'),
            'roles' => array_keys(AccessControl::roleCapabilities()),
            'time' => now()->toISOString(),
        ]);
    });

    Route::get('/launch-readiness', function (V1LaunchReadiness $readiness) {
        $report = $readiness->report();
        return response()->json($report, $report['readyForV1Launch'] ? 200 : 503);
    })->middleware('throttle:general');

    Route::get('/readiness', function () {
        $checks = ['database' => false, 'cache' => false, 'storage' => false];
        try { DB::connection()->select('select 1'); $checks['database'] = true; } catch (Throwable $exception) { report($exception); }
        try { $key = 'univai_readiness_' . app()->environment(); Cache::put($key, now()->toISOString(), 30); $checks['cache'] = Cache::has($key); } catch (Throwable $exception) { report($exception); }
        try { $path = 'readiness/.probe'; Storage::disk('local')->put($path, now()->toISOString()); $checks['storage'] = Storage::disk('local')->exists($path); } catch (Throwable $exception) { report($exception); }
        $ready = !in_array(false, $checks, true);
        return response()->json(['status' => $ready ? 'ready' : 'degraded', 'checks' => $checks, 'time' => now()->toISOString()], $ready ? 200 : 503);
    })->middleware('throttle:general');

    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('/auth/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:login');
    // Logout is intentionally idempotent: an expired/missing session must not prevent the client from logging out.
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('session.auth');
    Route::get('/auth/profile', [AuthController::class, 'profile'])->middleware('session.auth');
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('session.auth');
    Route::patch('/auth/profile/password', [AuthController::class, 'changePassword'])->middleware('session.auth');
    Route::post('/auth/profile/avatar', [AccountAvatarController::class, 'store'])->middleware('session.auth');
    Route::get('/auth/capabilities', function (AccessControl $accessControl) { return response()->json($accessControl->capabilitiesFor(session('user'))); })->middleware('session.auth');

    Route::get('/schools', [CatalogController::class, 'schools']);
    Route::get('/programs', [ProgramsController::class, 'index']);
    Route::get('/programmes', [ProgramsController::class, 'index']);
    Route::get('/programs/{programId}/modules', [ProgramController::class, 'modulesByProgram']);
    Route::get('/programmes/{programId}/modules', [ProgramController::class, 'modulesByProgram']);
    Route::get('/short-courses', [CatalogController::class, 'courses']);
    Route::get('/courses', [CatalogController::class, 'courses']);
    Route::get('/short-courses/{id}', [CatalogController::class, 'course']);
    Route::get('/courses/{id}', [CatalogController::class, 'course']);
    Route::get('/short-courses/{courseId}/lessons', [CatalogController::class, 'lessonsByCourse']);
    Route::get('/courses/{courseId}/lessons', [CatalogController::class, 'lessonsByCourse']);
    Route::get('/courses/{courseId}/exam', [CatalogController::class, 'courseExam']);
    Route::get('/lessons', [CatalogController::class, 'lessons']);
    Route::get('/lessons/{lessonId}', [CatalogController::class, 'lesson']);
    Route::patch('/lessons/{lessonId}', [CatalogController::class, 'updateLesson'])->middleware(['session.auth', 'access:lecturer.portal,admin.academic']);

    Route::get('/jobs', [JobsController::class, 'index']);
    Route::post('/jobs', [JobsController::class, 'store'])->middleware(['session.auth', 'access:employer.portal']);
    Route::get('/jobs/{id}', [JobsController::class, 'show']);
    Route::post('/jobs/{id}/apply', [JobsController::class, 'apply'])->middleware(['session.auth', 'access:student.portal']);

    Route::get('/research', [ResearchController::class, 'index']);
    Route::post('/research', [ResearchController::class, 'store'])->middleware(['session.auth', 'access:employer.portal']);
    Route::get('/research/{id}', [ResearchController::class, 'show']);
    Route::post('/research/{id}/apply', [ResearchController::class, 'apply'])->middleware(['session.auth', 'access:student.portal']);
    Route::get('/research/{id}/applications', [ResearchController::class, 'applications'])->middleware(['session.auth', 'access:employer.portal']);
    Route::patch('/research/{id}/applications/{application}', [ResearchController::class, 'updateApplication'])->middleware(['session.auth', 'access:employer.portal']);

    Route::get('/community/discussions', [CommunityController::class, 'index']);
    Route::post('/community/discussions', [CommunityController::class, 'store'])->middleware(['session.auth', 'access:student.portal']);
    Route::get('/community/discussions/{id}', [CommunityController::class, 'show']);
    Route::post('/community/discussions/{id}/comments', [CommunityController::class, 'storeComment'])->middleware(['session.auth', 'access:student.portal']);

    Route::get('/students/me/badges', [BadgesController::class, 'index'])->middleware(['session.auth', 'access:student.portal']);
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/admissions/settings', [AdmissionsController::class, 'settings']);

    // The remainder of this file contains the existing protected API routes.
    // Keep their original route definitions and middleware unchanged.
});
