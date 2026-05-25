<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
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
use App\Http\Controllers\Api\AdminCatalogController;
use App\Http\Controllers\Api\AdminAcademicStructureController;
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
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('session.auth');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('session.auth');
    Route::get('/auth/profile', [AuthController::class, 'profile'])->middleware('session.auth');
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('session.auth');
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
    Route::post('/payments/lenco/webhook', LencoWebhookController::class);

    Route::middleware(['session.auth', 'access:student.portal'])->group(function () {
        Route::get('/students/me/program', [ProgramController::class, 'program']);
        Route::get('/students/me/program/modules', [ProgramController::class, 'modules']);
        Route::get('/students/me/exams/semester-{semesterId}', [ProgramController::class, 'semesterExam']);
        Route::post('/students/checkout', [StudentsController::class, 'checkout']);
        Route::get('/students/me/dashboard', [DashboardController::class, 'student']);
        Route::get('/students/me/entitlements', fn () => ['entitlements' => session('user.entitlements') ?? [], 'subscriptionTier' => session('user.subscriptionTier') ?? session('user.subscription_tier'), 'subscriptionStatus' => session('user.subscriptionStatus') ?? session('user.subscription_status'), 'accountState' => session('user.accountState') ?? session('user.account_state')]);
        Route::get('/students/me/intakes', [IntakesController::class, 'availableForStudent']);
        Route::get('/students/me/invoices', [BillingController::class, 'invoices']);
        Route::post('/students/me/invoices/{invoice}/pay', [BillingController::class, 'pay']);
        Route::post('/students/me/invoices/{invoice}/verify', [BillingController::class, 'verify']);
        Route::get('/students/me/payments', [BillingController::class, 'payments']);
        Route::get('/students/me/grades', [GradesController::class, 'studentGrades']);
        Route::get('/students/me/assignments', [StudentAssignmentsController::class, 'index']);
        Route::get('/students/me/assignments/submissions', [StudentAssignmentsController::class, 'submissions']);
        Route::get('/students/me/assignments/{assignment}', [StudentAssignmentsController::class, 'show']);
        Route::get('/students/me/exam-clinic/sessions', [ExamClinicController::class, 'studentSessions']);
        Route::get('/students/me/exam-clinic/bookings', [ExamClinicController::class, 'studentBookings']);
        Route::post('/students/me/exam-clinic/bookings', [ExamClinicController::class, 'bookSession']);
        Route::delete('/students/me/exam-clinic/bookings/{booking}', [ExamClinicController::class, 'cancelBooking']);
        Route::post('/students/me/assignments/{assignment}/submit', [StudentAssignmentsController::class, 'submit']);

        Route::middleware('entitlement:' . StudentAccess::ENTITLEMENT_PROGRAMME)->group(function () {
            Route::get('/students/me/program', [ProgramController::class, 'program']);
            Route::get('/students/me/program/modules', [ProgramController::class, 'modules']);
            Route::get('/students/me/exams/semester-{semesterId}', [ProgramController::class, 'semesterExam']);
            Route::get('/students/me/enrollment', [StudentsController::class, 'enrollment']);
            Route::post('/students/me/enrollment/modules', [StudentsController::class, 'saveEnrollmentModules']);
            Route::post('/students/me/enrollment/confirm', [StudentsController::class, 'confirmEnrollment']);
            Route::get('/students/me/courses/{courseId}/meeting', [StudentsController::class, 'courseMeeting']);
            Route::get('/students/me/timetable', [CourseSessionsController::class, 'studentTimetable']);
            Route::get('/students/me/route-change-requests', [RouteChangeController::class, 'studentIndex']);
            Route::post('/students/me/route-change-requests', [RouteChangeController::class, 'store']);
            Route::get('/students/me/grades', [GradesController::class, 'studentGrades']);
            Route::get('/students/me/assignments', [StudentAssignmentsController::class, 'index']);
            Route::get('/students/me/assignments/submissions', [StudentAssignmentsController::class, 'submissions']);
            Route::get('/students/me/assignments/{assignment}', [StudentAssignmentsController::class, 'show']);
            Route::post('/students/me/assignments/{assignment}/submit', [StudentAssignmentsController::class, 'submit']);
        });

        Route::middleware('entitlement:' . StudentAccess::ENTITLEMENT_CERTIFICATE)->group(function () {
            Route::post('/students/me/exams/results', [ExamController::class, 'saveResult']);
            Route::get('/students/me/exams/results', [ExamController::class, 'results']);
            Route::get('/students/me/exams/latest', [ExamController::class, 'latest']);
        });
        Route::get('/students/me/support/tickets', [SupportController::class, 'index']);
        Route::post('/students/me/support/tickets', [SupportController::class, 'store']);
        Route::get('/students/me/support/tickets/{id}', [SupportController::class, 'show']);
        Route::post('/students/me/support/tickets/{id}/messages', [SupportController::class, 'storeMessage']);
        Route::get('/students/me/wallet/settings', [WalletController::class, 'show']);
        Route::post('/students/me/wallet/settings', [WalletController::class, 'update']);
        Route::get('/students/me/payment-methods', [PaymentMethodsController::class, 'index']);
        Route::post('/students/me/payment-methods', [PaymentMethodsController::class, 'store']);
        Route::patch('/students/me/payment-methods/{paymentMethod}', [PaymentMethodsController::class, 'update']);
        Route::delete('/students/me/payment-methods/{paymentMethod}', [PaymentMethodsController::class, 'destroy']);
        Route::get('/students/me/aid/applications', [ScholarshipController::class, 'index']);
        Route::post('/students/me/aid/applications', [ScholarshipController::class, 'store']);
        Route::get('/students/me/portfolio', [PortfolioController::class, 'index']);
        Route::post('/students/me/portfolio', [PortfolioController::class, 'store']);
        Route::patch('/students/me/portfolio/{portfolioItem}', [PortfolioController::class, 'update']);
        Route::delete('/students/me/portfolio/{portfolioItem}', [PortfolioController::class, 'destroy']);
    });

    Route::middleware('session.auth')->group(function () {
        Route::post('/admissions/applications', [AdmissionsController::class, 'submit'])->middleware(['access:admissions.applicant', 'throttle:admissions']);
        Route::get('/admissions/me', [AdmissionsController::class, 'me'])->middleware('access:admissions.applicant');
        Route::get('/admissions/me/documents', [AdmissionsController::class, 'documents'])->middleware('access:admissions.applicant');
        Route::post('/admissions/me/documents', [AdmissionsController::class, 'uploadDocument'])->middleware('access:admissions.applicant');
        Route::get('/admissions/me/documents/{document}', [AdmissionsController::class, 'downloadDocument'])->middleware('access:admissions.applicant');
        Route::get('/admissions/status', [AdmissionsController::class, 'status'])->middleware('access:admissions.applicant');
        Route::post('/admissions/fee', [AdmissionsController::class, 'payFee'])->middleware(['access:admissions.applicant', 'throttle:admissions']);
        Route::post('/admissions/offer/accept', [AdmissionsController::class, 'acceptOffer'])->middleware(['access:admissions.applicant', 'throttle:admissions']);
        Route::get('/admissions/offer-letter', [AdmissionsController::class, 'downloadOfferLetter'])->middleware('access:admissions.applicant');
        Route::post('/ai/generate', [AiController::class, 'generate'])->middleware(['access:ai.generate', 'throttle:ai']);
    });

    Route::post('/lecturer-applications', [LecturerApplicationsController::class, 'submit']);
    Route::post('/instructor-applications', [PlatformExpansionController::class, 'storeInstructorApplication'])->middleware('throttle:admissions');

    Route::middleware(['session.auth', 'access:student.portal'])->group(function () {
        Route::get('/students/me/learning', [PlatformExpansionController::class, 'studentLearning']);
        Route::post('/students/me/ai-study-sessions', [PlatformExpansionController::class, 'storeStudySession'])->middleware('throttle:ai');
    });

    Route::prefix('lecturer')->middleware(['session.auth', 'access:lecturer.portal'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'lecturer']);
        Route::get('/testing', [PlatformExpansionController::class, 'lecturerTesting']);
        Route::post('/test-announcements', [PlatformExpansionController::class, 'storeTestAnnouncement']);
        Route::post('/grades', [GradesController::class, 'recordGrade']);
        Route::get('/students', [StudentsController::class, 'lecturerStudents']);
        Route::get('/assignments', [LecturerAssignmentsController::class, 'index']);
        Route::patch('/assignments/{assignment}/meeting', [LecturerAssignmentsController::class, 'updateMeeting']);
        Route::get('/exam-questions', [LecturerExamQuestionsController::class, 'index']);
        Route::post('/exam-questions', [LecturerExamQuestionsController::class, 'store']);
        Route::patch('/exam-questions/{examQuestion}', [LecturerExamQuestionsController::class, 'update']);
        Route::delete('/exam-questions/{examQuestion}', [LecturerExamQuestionsController::class, 'destroy']);
        Route::get('/courses/{courseId}/sessions', [CourseSessionsController::class, 'lecturerIndex']);
        Route::post('/courses/{courseId}/sessions', [CourseSessionsController::class, 'lecturerStore']);
        Route::get('/sessions/{session}/roster', [CourseSessionsController::class, 'roster']);
        Route::post('/sessions/{session}/attendance', [CourseSessionsController::class, 'markAttendance']);
        Route::get('/lessons/{lessonId}/documents', [LessonDocumentsController::class, 'index']);
        Route::post('/lessons/{lessonId}/documents', [LessonDocumentsController::class, 'store']);
        Route::patch('/lessons/{lessonId}/documents/{document}', [LessonDocumentsController::class, 'review']);
    });

    Route::prefix('employer')->middleware(['session.auth', 'access:employer.portal'])->group(function () { Route::get('/dashboard', [DashboardController::class, 'employer']); });

    Route::prefix('instructor')->middleware(['session.auth', 'access:instructor.portal'])->group(function () {
        Route::get('/portal', [PlatformExpansionController::class, 'instructorPortal']);
        Route::post('/course-sources', [PlatformOperationsController::class, 'storeInstructorSource']);
        Route::post('/ai-generations', [PlatformOperationsController::class, 'storeInstructorAiGeneration'])->middleware(['access:instructor.ai', 'throttle:ai']);
    });

    Route::prefix('admin')->middleware(['session.auth', 'access:admin.exam'])->group(function () {
        Route::get('/exam-clinic', [ExamClinicController::class, 'adminOverview']);
        Route::post('/exam-clinic/centres', [ExamClinicController::class, 'storeCentre']);
        Route::patch('/exam-clinic/centres/{centre}/approval', [ExamClinicController::class, 'updateCentreApproval']);
        Route::post('/exam-clinic/rooms', [ExamClinicController::class, 'storeRoom']);
        Route::post('/exam-clinic/invigilators', [ExamClinicController::class, 'storeInvigilator']);
        Route::post('/exam-clinic/sessions', [ExamClinicController::class, 'storeSession']);
        Route::patch('/exam-clinic/sessions/{session}', [ExamClinicController::class, 'updateSession']);
        Route::post('/exam-clinic/sessions/{session}/incidents', [ExamClinicController::class, 'storeIncident']);
        Route::post('/exam-clinic/bookings/{booking}/attendance', [ExamClinicController::class, 'markAttendance']);
        Route::post('/exam-clinic/results-sync', [ExamClinicController::class, 'syncResults']);
    });

    Route::prefix('admin')->middleware(['session.auth', 'access:admin.portal'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'admin']);
        Route::get('/payment-settings', [PaymentSettingsController::class, 'show']);
        Route::patch('/payment-settings', [PaymentSettingsController::class, 'update']);
        Route::get('/document-branding', [DocumentBrandingController::class, 'show'])->middleware('access:admin.academic');
        Route::patch('/document-branding', [DocumentBrandingController::class, 'update'])->middleware('access:admin.academic');
        Route::get('/document-branding/preview/{type}', [DocumentBrandingController::class, 'preview'])->middleware('access:admin.academic');
        Route::get('/intakes', [IntakesController::class, 'index']);
        Route::post('/intakes', [IntakesController::class, 'store']);
        Route::patch('/programs/{program}/delivery-modes', [ProgramsController::class, 'updateDeliveryModes']);
        Route::get('/assignments', [AdminAssignmentsController::class, 'index']);
        Route::post('/assignments', [AdminAssignmentsController::class, 'store']);
        Route::get('/audit-logs', [AdminAuditController::class, 'index']);
        Route::get('/route-change-requests', [RouteChangeController::class, 'adminIndex']);
        Route::patch('/route-change-requests/{routeChangeRequest}', [RouteChangeController::class, 'adminUpdate']);
        Route::get('/curriculum/versions', [AdminCurriculumController::class, 'versions']);
        Route::post('/curriculum/versions', [AdminCurriculumController::class, 'createVersion']);
        Route::patch('/curriculum/versions/{version}', [AdminCurriculumController::class, 'updateVersion']);
        Route::get('/curriculum/versions/{version}/modules', [AdminCurriculumController::class, 'modules']);
        Route::post('/curriculum/versions/{version}/modules', [AdminCurriculumController::class, 'createModule']);
        Route::delete('/modules/{module}', [AdminCurriculumController::class, 'deleteModule']);
        Route::get('/modules/{module}/prerequisites', [AdminCurriculumController::class, 'prerequisites']);
        Route::post('/modules/{module}/prerequisites', [AdminCurriculumController::class, 'addPrerequisite']);
        Route::get('/qualification-levels', [AdminCatalogController::class, 'qualificationLevels']);
        Route::get('/access-matrix', fn () => ['permissions' => AccessControl::permissionMatrix(), 'roleCapabilities' => AccessControl::roleCapabilities()]);
        Route::get('/users', [AdminUsersController::class, 'index'])->middleware('access:admin.users.manage');
        Route::post('/users', [AdminUsersController::class, 'store'])->middleware('access:admin.users.manage');
        Route::patch('/users/{user}', [AdminUsersController::class, 'update'])->middleware('access:admin.users.manage');
        Route::post('/users/{user}/transition', [AdminUsersController::class, 'transition'])->middleware('access:admin.users.manage');
        Route::post('/schools', [AdminCatalogController::class, 'createSchool'])->middleware('access:admin.academic');
        Route::patch('/schools/{id}', [AdminCatalogController::class, 'updateSchool'])->middleware('access:admin.academic');
        Route::post('/programs', [AdminCatalogController::class, 'createProgram'])->middleware('access:admin.academic');
        Route::patch('/programs/{id}', [AdminCatalogController::class, 'updateProgram'])->middleware('access:admin.academic');
        Route::post('/courses', [AdminCatalogController::class, 'createCourse'])->middleware('access:admin.academic');
        Route::post('/short-courses/drafts', [AdminCatalogController::class, 'createShortCourseDraft'])->middleware('access:admin.academic');
        Route::patch('/courses/{id}', [AdminCatalogController::class, 'updateCourse'])->middleware('access:admin.academic');
        Route::delete('/schools/{id}', [AdminCatalogController::class, 'deleteSchool'])->middleware('access:admin.academic');
        Route::delete('/programs/{id}', [AdminCatalogController::class, 'deleteProgram'])->middleware('access:admin.academic');
        Route::delete('/courses/{id}', [AdminCatalogController::class, 'deleteCourse'])->middleware('access:admin.academic');
        Route::get('/academic-structure', [AdminAcademicStructureController::class, 'index'])->middleware('access:admin.academic');
        Route::post('/departments', [AdminAcademicStructureController::class, 'storeDepartment'])->middleware('access:admin.academic');
        Route::post('/academic-years', [AdminAcademicStructureController::class, 'storeAcademicYear'])->middleware('access:admin.academic');
        Route::post('/semesters', [AdminAcademicStructureController::class, 'storeSemester'])->middleware('access:admin.academic');
        Route::post('/programme-courses', [AdminAcademicStructureController::class, 'storeProgrammeCourse'])->middleware('access:admin.academic');
        Route::post('/course-units', [AdminAcademicStructureController::class, 'storeCourseUnit'])->middleware('access:admin.academic');
        Route::post('/learning-mode-rules', [AdminAcademicStructureController::class, 'storeLearningModeRule'])->middleware('access:admin.academic');
        Route::post('/venues', [AdminAcademicStructureController::class, 'storeVenue'])->middleware('access:admin.academic');
        Route::post('/partner-institutions', [AdminAcademicStructureController::class, 'storePartnerInstitution'])->middleware('access:admin.academic');
        Route::post('/practical-sessions', [AdminAcademicStructureController::class, 'storePracticalSession'])->middleware('access:admin.academic');
        Route::get('/platform-expansion', [PlatformExpansionController::class, 'adminOverview']);
        Route::get('/platform-operations', [PlatformOperationsController::class, 'overview']);
        Route::post('/course-offerings', [PlatformExpansionController::class, 'storeCourseOffering'])->middleware('access:admin.academic');
        Route::post('/course-delivery-groups', [PlatformExpansionController::class, 'storeDeliveryGroup'])->middleware('access:admin.academic');
        Route::post('/assessments', [PlatformExpansionController::class, 'storeAssessment'])->middleware('access:admin.academic');
        Route::post('/grading-policies', [PlatformExpansionController::class, 'storeGradingPolicy'])->middleware('access:admin.academic');
        Route::post('/fee-rules', [PlatformOperationsController::class, 'storeFeeRule']);
        Route::post('/certificates', [PlatformOperationsController::class, 'storeCertificate']);
        Route::post('/message-templates', [PlatformOperationsController::class, 'storeMessageTemplate']);
        Route::post('/announcements', [PlatformOperationsController::class, 'storeAnnouncement']);
        Route::post('/saved-reports', [PlatformOperationsController::class, 'storeSavedReport']);
        Route::get('/admissions', [AdmissionsController::class, 'adminIndex']);
        Route::get('/admissions/{id}', [AdmissionsController::class, 'adminShow']);
        Route::patch('/admissions/{id}', [AdmissionsController::class, 'adminUpdate']);
        Route::get('/admissions/{id}/documents', [AdmissionsController::class, 'adminDocuments']);
        Route::patch('/admissions/{id}/documents/{document}', [AdmissionsController::class, 'adminReviewDocument']);
        Route::get('/admissions/{id}/documents/{document}/download', [AdmissionsController::class, 'adminDownloadDocument']);
        Route::patch('/admissions/settings', [AdmissionsController::class, 'updateSettings']);
        Route::get('/lecturer-applications', [LecturerApplicationsController::class, 'adminIndex']);
        Route::get('/lecturer-applications/{lecturerApplication}', [LecturerApplicationsController::class, 'adminShow']);
        Route::patch('/lecturer-applications/{lecturerApplication}', [LecturerApplicationsController::class, 'adminUpdate']);
        Route::get('/policies', [AcademicPoliciesController::class, 'index']);
        Route::post('/policies', [AcademicPoliciesController::class, 'store']);
        Route::patch('/policies/{policy}', [AcademicPoliciesController::class, 'update']);
        Route::post('/policies/assign/program', [AcademicPoliciesController::class, 'assignProgram']);
        Route::post('/policies/assign/curriculum', [AcademicPoliciesController::class, 'assignCurriculum']);
        Route::get('/exam-questions', [AdminExamQuestionsController::class, 'index']);
        Route::post('/exam-questions', [AdminExamQuestionsController::class, 'store']);
        Route::patch('/exam-questions/{examQuestion}', [AdminExamQuestionsController::class, 'update']);
        Route::delete('/exam-questions/{examQuestion}', [AdminExamQuestionsController::class, 'destroy']);
        Route::get('/consultants', [ConsultantsController::class, 'index']);
        Route::get('/consultants/{id}', [ConsultantsController::class, 'show']);
        Route::get('/reports/finance', [ReportsController::class, 'finance']);
        Route::get('/affiliates', [AffiliateController::class, 'index'])->middleware('access:admin.finance');
        Route::post('/affiliates', [AffiliateController::class, 'store'])->middleware('access:admin.finance');
        Route::get('/affiliates/{affiliate}', [AffiliateController::class, 'show'])->middleware('access:admin.finance');
        Route::post('/affiliates/{affiliate}/payouts', [AffiliateController::class, 'requestPayout'])->middleware('access:admin.finance');
        Route::patch('/affiliates/payouts/{payout}/verify', [AffiliateController::class, 'verifyPayout'])->middleware('access:admin.finance');
        Route::get('/system-health', [SystemHealthController::class, 'status']);
        Route::post('/system-health/diagnostics', [SystemHealthController::class, 'diagnostics']);
        Route::get('/short-courses/manual-guide', [ShortCourseManualGuideController::class, 'download'])->middleware('access:admin.academic');
    });
});
