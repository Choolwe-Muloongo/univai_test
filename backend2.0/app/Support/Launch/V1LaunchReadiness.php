<?php

namespace App\Support\Launch;

use App\Support\Access\AccessControl;
use Illuminate\Support\Facades\Route;

class V1LaunchReadiness
{
    public const REQUIRED_CAPABILITIES = [
        'publicCatalog' => [
            'label' => 'Coursera-style public catalog, short courses, lessons, and course exams',
            'routes' => [
                'GET api/schools',
                'GET api/courses',
                'GET api/courses/{id}',
                'GET api/courses/{courseId}/lessons',
                'GET api/courses/{courseId}/exam',
                'GET api/lessons/{lessonId}',
            ],
        ],
        'studentLearning' => [
            'label' => 'Student learning for short courses, certificates, diploma/degree programmes, exams, assignments, payments, support, portfolio, and AI',
            'routes' => [
                'GET api/students/me/dashboard',
                'GET api/students/me/program',
                'GET api/students/me/program/modules',
                'GET api/students/me/assignments',
                'POST api/students/me/assignments/{assignment}/submit',
                'GET api/students/me/grades',
                'GET api/students/me/invoices',
                'POST api/students/me/invoices/{invoice}/pay',
                'GET api/students/me/support/tickets',
                'POST api/ai/generate',
            ],
            'permissions' => ['student.portal', 'student.learning', 'student.premium', 'ai.generate'],
        ],
        'universityAdmissions' => [
            'label' => 'Admissions, requirements, document review, fee payment, offer acceptance, and branded offer letters',
            'routes' => [
                'GET api/admissions/settings',
                'POST api/admissions/applications',
                'POST api/admissions/me/documents',
                'POST api/admissions/fee',
                'POST api/admissions/offer/accept',
                'GET api/admissions/offer-letter',
                'GET api/admin/admissions',
                'PATCH api/admin/admissions/{id}',
                'PATCH api/admin/admissions/settings',
            ],
            'permissions' => ['admissions.applicant', 'admin.admissions'],
        ],
        'academicAdministration' => [
            'label' => 'Schools, programmes, qualification requirements, curriculum, delivery modes, fees, short courses, and launch status',
            'routes' => [
                'POST api/admin/schools',
                'PATCH api/admin/schools/{id}',
                'POST api/admin/programs',
                'PATCH api/admin/programs/{id}',
                'POST api/admin/courses',
                'PATCH api/admin/courses/{id}',
                'GET api/admin/curriculum/versions',
                'POST api/admin/curriculum/versions',
                'POST api/admin/curriculum/versions/{version}/modules',
                'POST api/admin/modules/{module}/prerequisites',
            ],
            'permissions' => ['admin.portal', 'admin.academic'],
        ],
        'lecturerOperations' => [
            'label' => 'Lecturer dashboard, students, grades, assignments, sessions, attendance, lesson documents, exams, and AI content generation',
            'routes' => [
                'GET api/lecturer/dashboard',
                'GET api/lecturer/students',
                'POST api/lecturer/grades',
                'GET api/lecturer/assignments',
                'PATCH api/lecturer/assignments/{assignment}/meeting',
                'POST api/lecturer/courses/{courseId}/sessions',
                'POST api/lecturer/sessions/{session}/attendance',
                'POST api/lecturer/lessons/{lessonId}/documents',
                'POST api/lecturer/exam-questions',
                'POST api/ai/generate',
            ],
            'permissions' => ['lecturer.portal', 'ai.generate'],
        ],
        'employerPartnerPortal' => [
            'label' => 'Employer dashboard, jobs, research opportunities, applications, and verification-gated access',
            'routes' => [
                'GET api/employer/dashboard',
                'POST api/jobs',
                'GET api/jobs/{id}',
                'POST api/research',
                'GET api/research/{id}/applications',
                'PATCH api/research/{id}/applications/{application}',
            ],
            'permissions' => ['employer.portal', 'admin.employers'],
        ],
        'platformOperations' => [
            'label' => 'Role/state lifecycle, admin capability matrix, audit, readiness, health, and system diagnostics',
            'routes' => [
                'GET api/auth/capabilities',
                'GET api/admin/access-matrix',
                'GET api/admin/users',
                'POST api/admin/users',
                'POST api/admin/users/{user}/transition',
                'GET api/admin/audit-logs',
                'GET api/health',
                'GET api/readiness',
                'GET api/launch-readiness',
                'GET api/admin/system-health',
            ],
            'permissions' => ['admin.users.manage', 'admin.portal'],
        ],
    ];

    public function report(): array
    {
        $capabilities = [];
        $missingRoutes = [];
        $missingPermissions = [];

        foreach (self::REQUIRED_CAPABILITIES as $key => $capability) {
            $routeResults = $this->routeResults($capability['routes']);
            $permissionResults = $this->permissionResults($capability['permissions'] ?? []);
            $capabilityMissingRoutes = array_keys(array_filter($routeResults, fn (bool $present) => !$present));
            $capabilityMissingPermissions = array_keys(array_filter($permissionResults, fn (bool $present) => !$present));

            $missingRoutes = [...$missingRoutes, ...$capabilityMissingRoutes];
            $missingPermissions = [...$missingPermissions, ...$capabilityMissingPermissions];

            $capabilities[$key] = [
                'label' => $capability['label'],
                'ready' => $capabilityMissingRoutes === [] && $capabilityMissingPermissions === [],
                'routes' => $routeResults,
                'permissions' => $permissionResults,
            ];
        }

        $ready = $missingRoutes === [] && $missingPermissions === [];

        return [
            'version' => config('univai.version.label', 'v1'),
            'launchProfile' => config('univai.version.launch_profile', 'university-plus-short-courses'),
            'releaseState' => $ready ? config('univai.version.release_state', 'launch-ready') : 'blocked',
            'readyForV1Launch' => $ready,
            'targetRegisteredUsers' => config('univai.capacity.target_registered_users'),
            'targetConcurrentUsers' => config('univai.capacity.target_concurrent_users'),
            'capabilities' => $capabilities,
            'missingRoutes' => array_values(array_unique($missingRoutes)),
            'missingPermissions' => array_values(array_unique($missingPermissions)),
            'publicContentRule' => 'AI-generated public content, admissions letters, policy text, certificates, and branded documents remain review-required before release.',
        ];
    }

    private function routeResults(array $requirements): array
    {
        return collect($requirements)
            ->mapWithKeys(fn (string $route) => [$route => $this->routeExists($route)])
            ->all();
    }

    private function permissionResults(array $permissions): array
    {
        return collect($permissions)
            ->mapWithKeys(fn (string $permission) => [$permission => array_key_exists($permission, AccessControl::PERMISSIONS)])
            ->all();
    }

    private function routeExists(string $requirement): bool
    {
        [$method, $uri] = explode(' ', $requirement, 2);

        foreach (Route::getRoutes() as $route) {
            if (!in_array($method, $route->methods(), true)) {
                continue;
            }

            if ($route->uri() === $uri) {
                return true;
            }
        }

        return false;
    }
}
