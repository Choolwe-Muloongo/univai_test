<?php

namespace App\Support\Access;

use App\Models\User;
use Illuminate\Support\Facades\Schema;

class AccessControl
{
    public const ROLE_SUPER_ADMIN = 'super-admin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_NORMAL_ADMIN = 'normal-admin';
    public const ROLE_ADMISSIONS_ADMIN = 'admissions-admin';
    public const ROLE_LECTURER_ADMIN = 'lecturer-admin';
    public const ROLE_EMPLOYER_VERIFICATION_ADMIN = 'employer-verification-admin';
    public const ROLE_FINANCE_ADMIN = 'finance-admin';
    public const ROLE_READ_ONLY_ADMIN = 'read-only-admin';
    public const ROLE_EXAM_OFFICER = 'exam-officer';
    public const ROLE_LECTURER = 'lecturer';
    public const ROLE_EMPLOYER = 'employer';
    public const ROLE_INSTRUCTOR = 'instructor';
    public const ROLE_INSTRUCTOR_APPLICANT = 'instructor-applicant';
    public const ROLE_STUDENT = 'student';
    public const ROLE_FREE_STUDENT = 'free-student';
    public const ROLE_CERTIFICATE_STUDENT = 'certificate-student';
    public const ROLE_PAID_CERTIFICATE_STUDENT = 'paid-certificate-student';
    public const ROLE_PREMIUM_STUDENT = 'premium-student';
    public const ROLE_FREEMIUM_STUDENT = 'freemium-student';
    public const ROLE_PROGRAMME_STUDENT = 'programme-student';
    public const ROLE_PROGRAM_STUDENT = 'program-student';
    public const ROLE_ENROLLED = 'enrolled';
    public const ROLE_APPLICANT = 'applicant';
    public const ROLE_LECTURER_APPLICANT = 'lecturer-applicant';
    public const ROLE_EMPLOYER_APPLICANT = 'employer-applicant';

    public const ADMIN_ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
        self::ROLE_NORMAL_ADMIN,
        self::ROLE_ADMISSIONS_ADMIN,
        self::ROLE_LECTURER_ADMIN,
        self::ROLE_EMPLOYER_VERIFICATION_ADMIN,
        self::ROLE_FINANCE_ADMIN,
        self::ROLE_READ_ONLY_ADMIN,
        self::ROLE_EXAM_OFFICER,
    ];

    public const STUDENT_ROLES = [
        self::ROLE_APPLICANT,
        self::ROLE_STUDENT,
        self::ROLE_FREE_STUDENT,
        self::ROLE_CERTIFICATE_STUDENT,
        self::ROLE_PAID_CERTIFICATE_STUDENT,
        self::ROLE_PREMIUM_STUDENT,
        self::ROLE_FREEMIUM_STUDENT,
        self::ROLE_PROGRAMME_STUDENT,
        self::ROLE_PROGRAM_STUDENT,
        self::ROLE_ENROLLED,
    ];

    public const LEARNING_STUDENT_ROLES = [
        self::ROLE_CERTIFICATE_STUDENT,
        self::ROLE_PAID_CERTIFICATE_STUDENT,
        self::ROLE_PREMIUM_STUDENT,
        self::ROLE_PROGRAMME_STUDENT,
        self::ROLE_PROGRAM_STUDENT,
        self::ROLE_ENROLLED,
    ];

    /**
     * Central access formula for every protected backend route.
     *
     * access = authenticated session user
     *   + one of the allowed roles
     *   + allowed lifecycle state
     *   + required verification level
     *   + required profile completion
     *   + acceptable subscription state/tier
     *   + required academic entitlement(s), including legacy aliases
     */
    public const PERMISSIONS = [
        'student.portal' => [
            'roles' => self::STUDENT_ROLES,
            'states' => ['applicant', 'active', 'enrolled', 'probation'],
            'verification' => 'email',
            'profile' => 'none',
            'subscriptions' => ['none', 'free', 'trialing', 'active', 'past_due'],
            'entitlements' => ['student_portal'],
        ],
        'student.learning' => [
            'roles' => self::LEARNING_STUDENT_ROLES,
            'states' => ['active', 'enrolled', 'probation'],
            'verification' => 'email',
            'profile' => 'complete',
            'subscriptions' => ['free', 'trialing', 'active', 'past_due'],
            'entitlements' => ['course_access'],
        ],
        'student.premium' => [
            'roles' => [self::ROLE_PREMIUM_STUDENT, self::ROLE_PROGRAMME_STUDENT, self::ROLE_PROGRAM_STUDENT, self::ROLE_ENROLLED],
            'states' => ['active', 'enrolled', 'probation'],
            'verification' => 'email',
            'profile' => 'complete',
            'subscriptions' => ['trialing', 'active', 'past_due'],
            'entitlements' => ['student_portal', 'course_access'],
        ],
        'admissions.applicant' => [
            'roles' => [self::ROLE_APPLICANT, ...self::STUDENT_ROLES],
            'states' => ['applicant', 'active', 'enrolled', 'needs_information', 'accepted'],
            'verification' => 'email',
            'profile' => 'none',
            'subscriptions' => ['none', 'free', 'trialing', 'active', 'past_due'],
            'entitlements' => [],
        ],
        'ai.generate' => [
            'roles' => [self::ROLE_PREMIUM_STUDENT, self::ROLE_PROGRAMME_STUDENT, self::ROLE_PROGRAM_STUDENT, self::ROLE_ENROLLED, self::ROLE_LECTURER, ...self::ADMIN_ROLES],
            'states' => ['active', 'enrolled', 'probation'],
            'verification' => 'email',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active', 'past_due'],
            'entitlements' => [],
        ],
        'lecturer.portal' => [
            'roles' => [self::ROLE_LECTURER],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['teaching'],
        ],
        'employer.portal' => [
            'roles' => [self::ROLE_EMPLOYER],
            'states' => ['active'],
            'verification' => 'email',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['employer_portal'],
        ],
        'instructor.portal' => [
            'roles' => [self::ROLE_INSTRUCTOR],
            'states' => ['active', 'probation'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['instructor_portal'],
        ],
        'instructor.ai' => [
            'roles' => [self::ROLE_INSTRUCTOR],
            'states' => ['active', 'probation'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['instructor_ai'],
        ],
        'admin.portal' => [
            'roles' => self::ADMIN_ROLES,
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.academic' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.admissions' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN, self::ROLE_ADMISSIONS_ADMIN],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.lecturers' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN, self::ROLE_LECTURER_ADMIN],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.employers' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN, self::ROLE_EMPLOYER_VERIFICATION_ADMIN],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.finance' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN, self::ROLE_FINANCE_ADMIN],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.users.manage' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
        'admin.exam' => [
            'roles' => [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN, self::ROLE_EXAM_OFFICER],
            'states' => ['active'],
            'verification' => 'identity',
            'profile' => 'complete',
            'subscriptions' => ['none', 'free', 'trialing', 'active'],
            'entitlements' => ['admin_portal'],
        ],
    ];

    public const LEGACY_ROLE_PERMISSIONS = [
        'student' => 'student.portal',
        'lecturer' => 'lecturer.portal',
        'employer' => 'employer.portal',
        'instructor' => 'instructor.portal',
        'admin' => 'admin.portal',
        'applicant' => 'admissions.applicant',
        'exam-officer' => 'admin.exam',
    ];

    public const ENTITLEMENT_ALIASES = [
        'student_portal' => ['student_portal', 'short-course-access', 'certificate-access', 'premium-access', 'programme-access'],
        'course_access' => ['course_access', 'short-course-access', 'certificate-access', 'premium-access', 'programme-access'],
        'ai_tutor' => ['ai_tutor', 'premium-access', 'programme-access'],
        'admin_portal' => ['admin_portal'],
        'teaching' => ['teaching'],
        'employer_portal' => ['employer_portal'],
        'instructor_portal' => ['instructor_portal'],
        'instructor_ai' => ['instructor_ai'],
    ];

    public const ROLE_CAPABILITIES = [
        self::ROLE_SUPER_ADMIN => [
            'dashboard' => 'Full master dashboard for all admissions, student, lecturer, employer, finance, audit, and system-health operations.',
            'canManageStudents' => true,
            'canManageAdmissions' => true,
            'canOpenCloseLecturerApplications' => true,
            'canApproveLecturers' => true,
            'canApproveEmployers' => true,
            'canManageSubscriptions' => true,
            'canSuspendUsers' => true,
            'canCreateAdmins' => true,
            'reports' => ['system-wide', 'users', 'students', 'lecturers', 'employers', 'finance', 'audit'],
        ],
        self::ROLE_ADMIN => [
            'dashboard' => 'Operations dashboard for catalog, curriculum, admissions, learning, and reporting.',
            'canManageStudents' => true,
            'canManageAdmissions' => true,
            'canOpenCloseLecturerApplications' => true,
            'canApproveLecturers' => true,
            'canApproveEmployers' => true,
            'canManageSubscriptions' => true,
            'canSuspendUsers' => true,
            'canCreateAdmins' => false,
            'reports' => ['users', 'students', 'lecturers', 'employers', 'finance'],
        ],
        self::ROLE_NORMAL_ADMIN => [
            'dashboard' => 'General administration dashboard for catalog, reports, and routine approvals.',
            'canManageStudents' => true,
            'canManageAdmissions' => true,
            'canOpenCloseLecturerApplications' => true,
            'canApproveLecturers' => true,
            'canApproveEmployers' => true,
            'canManageSubscriptions' => true,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['users', 'students', 'lecturers', 'employers'],
        ],
        self::ROLE_ADMISSIONS_ADMIN => [
            'dashboard' => 'Student applications and admissions documents dashboard.',
            'canManageStudents' => true,
            'canManageAdmissions' => true,
            'canOpenCloseLecturerApplications' => false,
            'canApproveLecturers' => false,
            'canApproveEmployers' => false,
            'canManageSubscriptions' => false,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['students', 'admissions'],
        ],
        self::ROLE_LECTURER_ADMIN => [
            'dashboard' => 'Lecturer applications, course assignment, and teaching quality dashboard.',
            'canManageStudents' => false,
            'canManageAdmissions' => false,
            'canOpenCloseLecturerApplications' => true,
            'canApproveLecturers' => true,
            'canApproveEmployers' => false,
            'canManageSubscriptions' => false,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['lecturers'],
        ],
        self::ROLE_EMPLOYER_VERIFICATION_ADMIN => [
            'dashboard' => 'Employer verification, jobs, and research partner dashboard.',
            'canManageStudents' => false,
            'canManageAdmissions' => false,
            'canOpenCloseLecturerApplications' => false,
            'canApproveLecturers' => false,
            'canApproveEmployers' => true,
            'canManageSubscriptions' => true,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['employers'],
        ],
        self::ROLE_FINANCE_ADMIN => [
            'dashboard' => 'Finance, payments, subscriptions, and refunds dashboard.',
            'canManageStudents' => false,
            'canManageAdmissions' => false,
            'canOpenCloseLecturerApplications' => false,
            'canApproveLecturers' => false,
            'canApproveEmployers' => false,
            'canManageSubscriptions' => true,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['finance'],
        ],
        self::ROLE_READ_ONLY_ADMIN => [
            'dashboard' => 'Read-only operational dashboard.',
            'canManageStudents' => false,
            'canManageAdmissions' => false,
            'canOpenCloseLecturerApplications' => false,
            'canApproveLecturers' => false,
            'canApproveEmployers' => false,
            'canManageSubscriptions' => false,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['read-only'],
        ],
        self::ROLE_EXAM_OFFICER => [
            'dashboard' => 'Exam clinic operations dashboard.',
            'canManageStudents' => false,
            'canManageAdmissions' => false,
            'canOpenCloseLecturerApplications' => false,
            'canApproveLecturers' => false,
            'canApproveEmployers' => false,
            'canManageSubscriptions' => false,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['exam-clinic'],
        ],
        self::ROLE_INSTRUCTOR => [
            'dashboard' => 'Instructor marketplace dashboard for short courses, learners, earnings, payouts, and paid AI Course Builder usage.',
            'canManageStudents' => false,
            'canManageAdmissions' => false,
            'canOpenCloseLecturerApplications' => false,
            'canApproveLecturers' => false,
            'canApproveEmployers' => false,
            'canManageSubscriptions' => false,
            'canSuspendUsers' => false,
            'canCreateAdmins' => false,
            'reports' => ['instructor-courses', 'learners', 'earnings', 'payouts', 'ai-package-usage'],
        ],
    ];

    public function authorize(?array $sessionUser, array $abilities): AccessDecision
    {
        if (!is_array($sessionUser) || empty($sessionUser['id'])) {
            return AccessDecision::deny('Unauthorized', 401);
        }

        $context = $this->contextFor($sessionUser);
        $requirements = $this->requirementsFor($abilities);

        if ($requirements === []) {
            return AccessDecision::deny('No access policy was configured for this route.');
        }

        foreach ($requirements as $requirement) {
            $decision = $this->evaluate($context, $requirement);
            if ($decision->allowed) {
                return $decision;
            }
        }

        return $decision ?? AccessDecision::deny('Forbidden');
    }

    public function contextFor(array $sessionUser): array
    {
        $user = $this->databaseUser($sessionUser);

        if ($user) {
            $profile = $user->profile;
            $subscription = $user->activeSubscription;

            return [
                'id' => (string) $user->id,
                'role' => $user->role ?? self::ROLE_APPLICANT,
                'state' => $user->account_state ?? $this->fallbackState($user->role),
                'verification' => $user->verification_status ?? $this->fallbackVerification($user->role),
                'profileCompleted' => (bool) ($user->profile_completed_at || $profile?->completed_at),
                'profileStarted' => (bool) ($profile || $user->profile_completed_at),
                'subscription' => $subscription?->status ?? $this->fallbackSubscription($user->role),
                'subscriptionTier' => $subscription?->tier ?? $this->fallbackSubscriptionTier($user->role),
                'entitlements' => $this->entitlementCodes($user),
            ];
        }

        return [
            'id' => (string) $sessionUser['id'],
            'role' => $sessionUser['role'] ?? self::ROLE_APPLICANT,
            'state' => $sessionUser['accountState'] ?? $sessionUser['state'] ?? $this->fallbackState($sessionUser['role'] ?? null),
            'verification' => $sessionUser['verificationStatus'] ?? $sessionUser['verification'] ?? $this->fallbackVerification($sessionUser['role'] ?? null),
            'profileCompleted' => (bool) ($sessionUser['profileCompleted'] ?? $this->fallbackProfileCompleted($sessionUser['role'] ?? null)),
            'profileStarted' => (bool) ($sessionUser['profileStarted'] ?? $sessionUser['profileCompleted'] ?? true),
            'subscription' => $sessionUser['subscriptionStatus'] ?? $sessionUser['subscription']['status'] ?? $this->fallbackSubscription($sessionUser['role'] ?? null),
            'subscriptionTier' => $sessionUser['subscriptionTier'] ?? $sessionUser['subscription']['tier'] ?? $this->fallbackSubscriptionTier($sessionUser['role'] ?? null),
            'entitlements' => $sessionUser['entitlements'] ?? $this->fallbackEntitlements($sessionUser['role'] ?? null),
        ];
    }

    public function requirementsFor(array $abilities): array
    {
        return collect($abilities)
            ->map(fn (string $ability) => self::LEGACY_ROLE_PERMISSIONS[$ability] ?? $ability)
            ->map(fn (string $ability) => self::PERMISSIONS[$ability] ?? null)
            ->filter()
            ->values()
            ->all();
    }

    public function capabilitiesFor(?array $sessionUser): array
    {
        if (!is_array($sessionUser) || empty($sessionUser['id'])) {
            return [
                'context' => null,
                'abilities' => [],
                'roleCapabilities' => null,
            ];
        }

        $context = $this->contextFor($sessionUser);
        $abilities = [];
        foreach (array_keys(self::PERMISSIONS) as $ability) {
            $abilities[$ability] = $this->authorize($sessionUser, [$ability])->allowed;
        }

        return [
            'context' => $context,
            'abilities' => $abilities,
            'roleCapabilities' => self::ROLE_CAPABILITIES[$context['role']] ?? null,
        ];
    }

    public static function roleCapabilities(): array
    {
        return self::ROLE_CAPABILITIES;
    }

    public static function permissionMatrix(): array
    {
        return self::PERMISSIONS;
    }

    private function evaluate(array $context, array $requirement): AccessDecision
    {
        if (!in_array($context['role'], $requirement['roles'], true)) {
            return AccessDecision::deny('Forbidden: role is not permitted.');
        }

        if (!in_array($context['state'], $requirement['states'], true)) {
            return AccessDecision::deny('Forbidden: account state is not permitted.');
        }

        if (!$this->verificationSatisfies($context['verification'], $requirement['verification'])) {
            return AccessDecision::deny('Forbidden: verification requirements are not met.');
        }

        if (($requirement['profile'] ?? 'none') === 'complete' && !$context['profileCompleted']) {
            return AccessDecision::deny('Forbidden: profile is incomplete.');
        }

        if (($requirement['profile'] ?? 'none') === 'started' && !$context['profileStarted']) {
            return AccessDecision::deny('Forbidden: profile has not been started.');
        }

        if (!in_array($context['subscription'], $requirement['subscriptions'], true)) {
            return AccessDecision::deny('Forbidden: subscription status is not permitted.');
        }

        $entitlements = $context['entitlements'] ?? [];
        foreach ($requirement['entitlements'] as $entitlement) {
            if (!$this->entitlementSatisfies($entitlements, $entitlement)) {
                return AccessDecision::deny('Forbidden: missing academic entitlement.');
            }
        }

        return AccessDecision::allow();
    }

    private function databaseUser(array $sessionUser): ?User
    {
        if (!is_numeric($sessionUser['id'] ?? null) || !$this->hasAccessColumns()) {
            return null;
        }

        return User::with(['profile', 'activeSubscription', 'activeEntitlements'])
            ->find((int) $sessionUser['id']);
    }

    private function hasAccessColumns(): bool
    {
        try {
            return Schema::hasColumn('users', 'account_state')
                && Schema::hasTable('user_profiles')
                && Schema::hasTable('user_subscriptions')
                && Schema::hasTable('academic_entitlements');
        } catch (\Throwable) {
            return false;
        }
    }

    private function entitlementCodes(User $user): array
    {
        return array_values(array_unique($user->activeEntitlements->pluck('code')->all()));
    }

    private function entitlementSatisfies(array $actual, string $required): bool
    {
        $allowed = self::ENTITLEMENT_ALIASES[$required] ?? [$required];
        return count(array_intersect($actual, $allowed)) > 0;
    }

    private function verificationSatisfies(?string $actual, string $required): bool
    {
        $rank = ['none' => 0, 'email' => 1, 'identity' => 2, 'academic' => 3];

        return ($rank[$actual ?? 'none'] ?? 0) >= ($rank[$required] ?? 0);
    }

    private function fallbackState(?string $role): string
    {
        return match ($role) {
            self::ROLE_APPLICANT, self::ROLE_LECTURER_APPLICANT, self::ROLE_EMPLOYER_APPLICANT, self::ROLE_INSTRUCTOR_APPLICANT => 'applicant',
            self::ROLE_PROGRAMME_STUDENT, self::ROLE_PROGRAM_STUDENT, self::ROLE_ENROLLED => 'enrolled',
            default => 'active',
        };
    }

    private function fallbackVerification(?string $role): string
    {
        return in_array($role, [self::ROLE_LECTURER, self::ROLE_INSTRUCTOR, ...self::ADMIN_ROLES], true) ? 'identity' : 'email';
    }

    private function fallbackProfileCompleted(?string $role): bool
    {
        return !in_array($role, [self::ROLE_APPLICANT, self::ROLE_LECTURER_APPLICANT, self::ROLE_EMPLOYER_APPLICANT, self::ROLE_INSTRUCTOR_APPLICANT], true);
    }

    private function fallbackSubscription(?string $role): string
    {
        return match ($role) {
            self::ROLE_PREMIUM_STUDENT, self::ROLE_PROGRAMME_STUDENT, self::ROLE_PROGRAM_STUDENT, self::ROLE_ENROLLED => 'active',
            self::ROLE_FREEMIUM_STUDENT, self::ROLE_FREE_STUDENT, self::ROLE_CERTIFICATE_STUDENT, self::ROLE_PAID_CERTIFICATE_STUDENT, self::ROLE_STUDENT => 'free',
            default => 'none',
        };
    }

    private function fallbackSubscriptionTier(?string $role): string
    {
        return match ($role) {
            self::ROLE_PREMIUM_STUDENT => 'premium',
            self::ROLE_PROGRAMME_STUDENT, self::ROLE_PROGRAM_STUDENT, self::ROLE_ENROLLED => 'programme',
            self::ROLE_CERTIFICATE_STUDENT, self::ROLE_PAID_CERTIFICATE_STUDENT => 'certificate',
            self::ROLE_FREEMIUM_STUDENT, self::ROLE_FREE_STUDENT, self::ROLE_STUDENT => 'freemium',
            default => 'none',
        };
    }

    private function fallbackEntitlements(?string $role): array
    {
        return match ($role) {
            self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_NORMAL_ADMIN, self::ROLE_ADMISSIONS_ADMIN, self::ROLE_LECTURER_ADMIN, self::ROLE_EMPLOYER_VERIFICATION_ADMIN, self::ROLE_FINANCE_ADMIN, self::ROLE_READ_ONLY_ADMIN, self::ROLE_EXAM_OFFICER => ['admin_portal'],
            self::ROLE_LECTURER => ['teaching'],
            self::ROLE_EMPLOYER => ['employer_portal'],
            self::ROLE_INSTRUCTOR => ['instructor_portal', 'instructor_ai'],
            self::ROLE_PROGRAMME_STUDENT, self::ROLE_PROGRAM_STUDENT, self::ROLE_ENROLLED => ['student_portal', 'course_access', 'ai_tutor', 'programme-access', 'premium-access', 'certificate-access', 'short-course-access'],
            self::ROLE_PREMIUM_STUDENT => ['student_portal', 'course_access', 'ai_tutor', 'premium-access', 'certificate-access', 'short-course-access'],
            self::ROLE_CERTIFICATE_STUDENT, self::ROLE_PAID_CERTIFICATE_STUDENT => ['student_portal', 'course_access', 'certificate-access', 'short-course-access'],
            self::ROLE_STUDENT, self::ROLE_FREEMIUM_STUDENT, self::ROLE_FREE_STUDENT => ['student_portal', 'short-course-access'],
            default => [],
        };
    }
}
