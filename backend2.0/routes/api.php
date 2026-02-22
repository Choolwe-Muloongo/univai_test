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
use App\Http\Controllers\Api\ScholarshipController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\SystemHealthController;
use App\Http\Controllers\Api\LecturerApplicationsController;
use App\Http\Controllers\Api\StudentAssignmentsController;

Route::middleware('api')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'time' => now()->toISOString(),
        ]);
    });

    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('/auth/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:login');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('session.auth');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('session.auth');

    Route::get('/schools', [CatalogController::class, 'schools']);
    Route::get('/programs', [ProgramsController::class, 'index']);
    Route::get('/programs/{programId}/modules', [ProgramController::class, 'modulesByProgram']);
    Route::get('/courses', [CatalogController::class, 'courses']);
    Route::get('/courses/{id}', [CatalogController::class, 'course']);
    Route::get('/courses/{courseId}/lessons', [CatalogController::class, 'lessonsByCourse']);
    Route::get('/courses/{courseId}/exam', [CatalogController::class, 'courseExam']);
    Route::get('/lessons', [CatalogController::class, 'lessons']);
    Route::get('/lessons/{lessonId}', [CatalogController::class, 'lesson']);
    Route::patch('/lessons/{lessonId}', [CatalogController::class, 'updateLesson']);

    Route::get('/jobs', [JobsController::class, 'index']);
    Route::post('/jobs', [JobsController::class, 'store'])->middleware(['session.auth', 'role:employer']);
    Route::get('/jobs/{id}', [JobsController::class, 'show']);
    Route::post('/jobs/{id}/apply', [JobsController::class, 'apply'])->middleware(['session.auth', 'role:student']);

    Route::get('/research', [ResearchController::class, 'index']);
    Route::post('/research', [ResearchController::class, 'store'])->middleware(['session.auth', 'role:employer']);
    Route::get('/research/{id}', [ResearchController::class, 'show']);
    Route::post('/research/{id}/apply', [ResearchController::class, 'apply'])->middleware(['session.auth', 'role:student']);
    Route::get('/research/{id}/applications', [ResearchController::class, 'applications'])->middleware(['session.auth', 'role:employer']);
    Route::patch('/research/{id}/applications/{application}', [ResearchController::class, 'updateApplication'])->middleware(['session.auth', 'role:employer']);

    Route::get('/community/discussions', [CommunityController::class, 'index']);
    Route::post('/community/discussions', [CommunityController::class, 'store'])->middleware(['session.auth', 'role:student']);
    Route::get('/community/discussions/{id}', [CommunityController::class, 'show']);
    Route::post('/community/discussions/{id}/comments', [CommunityController::class, 'storeComment'])->middleware(['session.auth', 'role:student']);

    Route::get('/students/me/badges', [BadgesController::class, 'index'])->middleware(['session.auth', 'role:student']);
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/admissions/settings', [AdmissionsController::class, 'settings']);

    Route::middleware(['session.auth', 'role:student'])->group(function () {
        Route::get('/students/me/program', [ProgramController::class, 'program']);
        Route::get('/students/me/program/modules', [ProgramController::class, 'modules']);
        Route::get('/students/me/exams/semester-{semesterId}', [ProgramController::class, 'semesterExam']);

        Route::post('/students/checkout', [StudentsController::class, 'checkout']);
        Route::get('/students/me/enrollment', [StudentsController::class, 'enrollment']);
        Route::post('/students/me/enrollment/modules', [StudentsController::class, 'saveEnrollmentModules']);
        Route::post('/students/me/enrollment/confirm', [StudentsController::class, 'confirmEnrollment']);
        Route::post('/students/me/exams/results', [ExamController::class, 'saveResult']);
        Route::get('/students/me/exams/results', [ExamController::class, 'results']);
        Route::get('/students/me/exams/latest', [ExamController::class, 'latest']);
        Route::get('/students/me/dashboard', [DashboardController::class, 'student']);
        Route::get('/students/me/courses/{courseId}/meeting', [StudentsController::class, 'courseMeeting']);
        Route::get('/students/me/timetable', [CourseSessionsController::class, 'studentTimetable']);
        Route::get('/students/me/intakes', [IntakesController::class, 'availableForStudent']);
        Route::get('/students/me/route-change-requests', [RouteChangeController::class, 'studentIndex']);
        Route::post('/students/me/route-change-requests', [RouteChangeController::class, 'store']);
        Route::get('/students/me/invoices', [BillingController::class, 'invoices']);
        Route::post('/students/me/invoices/{invoice}/pay', [BillingController::class, 'pay']);
        Route::get('/students/me/payments', [BillingController::class, 'payments']);
        Route::get('/students/me/grades', [GradesController::class, 'studentGrades']);
        Route::get('/students/me/assignments', [StudentAssignmentsController::class, 'index']);
        Route::get('/students/me/assignments/submissions', [StudentAssignmentsController::class, 'submissions']);
        Route::get('/students/me/assignments/{assignment}', [StudentAssignmentsController::class, 'show']);
        Route::post('/students/me/assignments/{assignment}/submit', [StudentAssignmentsController::class, 'submit']);
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
    Route::post('/admissions/applications', [AdmissionsController::class, 'submit'])->middleware('throttle:admissions');
        Route::get('/admissions/me', [AdmissionsController::class, 'me']);
        Route::get('/admissions/me/documents', [AdmissionsController::class, 'documents']);
        Route::post('/admissions/me/documents', [AdmissionsController::class, 'uploadDocument']);
        Route::get('/admissions/me/documents/{document}', [AdmissionsController::class, 'downloadDocument']);
        Route::get('/admissions/status', [AdmissionsController::class, 'status']);
        Route::post('/admissions/fee', [AdmissionsController::class, 'payFee'])->middleware('throttle:admissions');
        Route::post('/admissions/offer/accept', [AdmissionsController::class, 'acceptOffer'])->middleware('throttle:admissions');
        Route::get('/admissions/offer-letter', [AdmissionsController::class, 'downloadOfferLetter']);
        Route::post('/ai/generate', [AiController::class, 'generate'])->middleware('throttle:ai');
    });

    Route::post('/lecturer-applications', [LecturerApplicationsController::class, 'submit']);

    Route::prefix('lecturer')->middleware(['session.auth', 'role:lecturer'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'lecturer']);
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

    Route::prefix('employer')->middleware(['session.auth', 'role:employer'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'employer']);
    });

    Route::prefix('admin')->middleware(['session.auth', 'role:admin'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'admin']);
        Route::get('/intakes', [IntakesController::class, 'index']);
        Route::post('/intakes', [IntakesController::class, 'store']);
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
        Route::post('/schools', [AdminCatalogController::class, 'createSchool']);
        Route::post('/courses', [AdminCatalogController::class, 'createCourse']);
        Route::delete('/schools/{id}', [AdminCatalogController::class, 'deleteSchool']);
        Route::delete('/courses/{id}', [AdminCatalogController::class, 'deleteCourse']);

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
        Route::get('/system-health', [SystemHealthController::class, 'status']);
        Route::post('/system-health/diagnostics', [SystemHealthController::class, 'diagnostics']);
    });
});
