<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicEntitlement;
use App\Models\User;
use App\Models\UserProfile;
use App\Support\Access\AccessControl;
use App\Support\Affiliates\AffiliateService;
use Illuminate\Http\Request;
use App\Support\StudentAccess;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $payload = $request->validate([
            'email' => ['nullable', 'email'],
            'password' => ['nullable', 'string'],
            'role' => ['nullable', 'string'],
        ]);

        if (!empty($payload['email'])) {
            $email = strtolower(trim($payload['email']));
            $password = $payload['password'] ?? '';
            $user = User::with(['activeSubscription', 'activeEntitlements'])->where('email', $email)->first();

            if ($user && Hash::check($password, $user->password)) {
                $sessionUser = $this->mapUser($user);
            } elseif ($this->isDemoCredential($email, $password)) {
                $sessionUser = $this->demoUser($this->demoRoleFromEmail($email));
            } else {
                return response()->json(['message' => 'Invalid credentials'], 422);
            }
        } else {
            if (!config('app.debug')) {
                return response()->json(['message' => 'Email and password are required.'], 422);
            }
            $role = $payload['role'] ?? 'premium-student';
            $sessionUser = $this->demoUser($role);
        }

        $request->session()->regenerate();
        $request->session()->put('user', $sessionUser);

        return response()->json(['user' => $sessionUser]);
    }

    public function register(Request $request, AffiliateService $affiliates)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['nullable', 'in:applicant,free-student,employer,instructor-applicant'],
        ]);

        if (User::where('email', $payload['email'])->exists()) {
            return response()->json(['message' => 'Email already registered'], 422);
        }

        $role = $payload['role'] ?? 'applicant';
        $accountState = $role === 'applicant' ? 'applicant' : 'active';
        $profileCompletedAt = in_array($role, ['employer', 'free-student'], true) ? now() : null;

        $user = User::create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'role' => $role,
            'account_state' => $accountState,
            'verification_status' => 'email',
            'profile_completed_at' => $profileCompletedAt,
            'referred_by_affiliate_code' => $affiliates->captureReferralCode($request),
        ]);

        if ($role === 'applicant') {
            StudentAccess::syncUserEntitlements($user, StudentAccess::TIER_FREE, 'registration');
        } elseif ($role === 'free-student') {
            StudentAccess::syncUserEntitlements($user, StudentAccess::TIER_FREE, 'short_course_registration');
        } else {
            $this->syncRoleEntitlements($user, $role);
        }

        $sessionUser = $this->mapUser($user->fresh(['activeSubscription', 'activeEntitlements']));
        $request->session()->regenerate();
        $request->session()->put('user', $sessionUser);

        return response()->json(['user' => $sessionUser], 201);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->session()->get('user')]);
    }

    public function profile(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        if (!$userId || !is_numeric($userId)) {
            return response()->json([
                'user' => $sessionUser,
                'profile' => [
                    'displayName' => $sessionUser['name'] ?? null,
                    'phone' => null,
                    'country' => null,
                    'timezone' => null,
                    'bio' => null,
                    'avatar' => $sessionUser['avatar'] ?? null,
                ],
            ]);
        }

        $user = User::with('profile', 'activeSubscription', 'activeEntitlements')->findOrFail((int) $userId);

        return response()->json([
            'user' => $this->mapUser($user),
            'profile' => $this->mapProfile($user),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        if (!$userId || !is_numeric($userId)) {
            return response()->json(['message' => 'Profile editing requires a saved user account.'], 422);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'avatar' => ['nullable', 'string', 'max:1000000'],
        ]);

        $user = User::with('profile', 'activeSubscription', 'activeEntitlements')->findOrFail((int) $userId);
        $email = strtolower(trim($payload['email']));
        $emailTaken = User::where('email', $email)->where('id', '!=', $user->id)->exists();
        if ($emailTaken) {
            return response()->json(['message' => 'Email already belongs to another account.'], 422);
        }

        $user->forceFill([
            'name' => trim($payload['name']),
            'email' => $email,
            'avatar' => $payload['avatar'] ?: $user->avatar,
            'profile_completed_at' => now(),
        ])->save();

        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => trim($payload['name']),
                'phone' => $payload['phone'] ?? null,
                'country' => $payload['country'] ?? null,
                'timezone' => $payload['timezone'] ?? null,
                'bio' => $payload['bio'] ?? null,
                'avatar' => $payload['avatar'] ?? $user->profile?->avatar,
                'completion_percent' => 100,
                'completed_at' => now(),
            ]
        );

        $fresh = $user->fresh(['profile', 'activeSubscription', 'activeEntitlements']);
        $session = $this->mapUser($fresh);
        $request->session()->put('user', $session);

        return response()->json([
            'user' => $session,
            'profile' => $this->mapProfile($fresh),
        ]);
    }

    public function logout(Request $request)
    {
        $request->session()->forget('user');
        return response()->noContent();
    }

    public function resetPassword(Request $request)
    {
        if (!app()->environment(['local', 'development']) && !config('app.debug')) {
            return response()->json(['message' => 'Password reset is disabled.'], 403);
        }

        $payload = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::where('email', $payload['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->update(['password' => Hash::make($payload['password'])]);
        return response()->json(['status' => 'ok']);
    }

    private function mapUser(User $user): array
    {
        $sessionUser = [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? StudentAccess::ROLE_STUDENT,
            'schoolId' => $user->school_id,
            'programId' => $user->program_id,
            'intakeId' => $user->intake_id,
            'avatar' => $user->profile?->avatar ?: $user->avatar,
        ];

        $access = app(AccessControl::class)->contextFor($sessionUser);

        return $sessionUser + [
            'accountState' => $access['state'],
            'verificationStatus' => $access['verification'],
            'profileCompleted' => $access['profileCompleted'],
            'profileStarted' => $access['profileStarted'],
            'subscriptionStatus' => $access['subscription'],
            'subscriptionTier' => $access['subscriptionTier'],
            'entitlements' => $access['entitlements'],
        ];
    }

    private function mapProfile(User $user): array
    {
        return [
            'displayName' => $user->profile?->display_name ?: $user->name,
            'phone' => $user->profile?->phone,
            'country' => $user->profile?->country,
            'timezone' => $user->profile?->timezone,
            'bio' => $user->profile?->bio,
            'avatar' => $user->profile?->avatar ?: $user->avatar,
        ];
    }

    private function syncRoleEntitlements(User $user, string $role): void
    {
        $entitlements = match ($role) {
            'employer' => ['employer_portal'],
            'instructor' => ['instructor_portal', 'instructor_ai'],
            default => [],
        };

        foreach ($entitlements as $code) {
            AcademicEntitlement::updateOrCreate(
                ['user_id' => $user->id, 'code' => $code, 'scope_type' => 'platform', 'scope_id' => null],
                ['status' => 'active', 'starts_at' => now(), 'metadata' => ['source' => 'registration']]
            );
        }
    }

    private function isDemoCredential(string $email, string $password): bool
    {
        return $password === 'password123' && array_key_exists($email, $this->demoEmailRoleMap());
    }

    private function demoRoleFromEmail(string $email): string
    {
        return $this->demoEmailRoleMap()[$email] ?? 'premium-student';
    }

    private function demoEmailRoleMap(): array
    {
        return [
            'applicant@univai.edu' => 'applicant',
            'student.premium@univai.edu' => 'premium-student',
            'student.free@univai.edu' => 'free-student',
            'student.freemium@univai.edu' => 'freemium-student',
            'student.certificate@univai.edu' => 'paid-certificate-student',
            'student.programme@univai.edu' => 'programme-student',
            'lecturer@univai.edu' => 'lecturer',
            'employer@univai.edu' => 'employer',
            'instructor@univai.edu' => 'instructor',
            'admin@univai.edu' => 'admin',
        ];
    }

    private function demoUser(string $role): array
    {
        return match ($role) {
            'applicant' => [
                'id' => 'applicant-1',
                'name' => 'Applicant',
                'email' => 'applicant@univai.edu',
                'role' => 'applicant',
                'schoolId' => null,
                'programId' => null,
                'intakeId' => null,
                'accountState' => 'applicant',
                'verificationStatus' => 'email',
                'profileCompleted' => false,
                'profileStarted' => false,
                'subscriptionStatus' => 'none',
                'subscriptionTier' => 'none',
                'entitlements' => [],
            ],
            'free-student', 'freemium-student' => StudentAccess::sessionPayload([
                'id' => $role === 'free-student' ? 'student-free' : 'student-freemium',
                'name' => $role === 'free-student' ? 'Free Student' : 'Freemium Student',
                'email' => $role === 'free-student' ? 'student.free@univai.edu' : 'student.freemium@univai.edu',
                'role' => $role === 'free-student' ? StudentAccess::ROLE_FREE : StudentAccess::ROLE_FREEMIUM,
                'schoolId' => null,
                'programId' => null,
                'accountState' => 'active',
                'verificationStatus' => 'email',
                'profileCompleted' => true,
                'subscriptionStatus' => 'free',
                'subscriptionTier' => 'freemium',
                'entitlements' => ['student_portal'],
            ]),
            'paid-certificate-student', 'certificate-student' => StudentAccess::sessionPayload([
                'id' => 'student-certificate',
                'name' => 'Certificate Student',
                'email' => 'student.certificate@univai.edu',
                'role' => StudentAccess::ROLE_CERTIFICATE,
                'schoolId' => null,
                'programId' => null,
            ]),
            'programme-student', 'enrolled' => StudentAccess::sessionPayload([
                'id' => 'student-programme',
                'name' => 'Programme Student',
                'email' => 'student.programme@univai.edu',
                'role' => StudentAccess::ROLE_PROGRAMME,
                'schoolId' => 'ict',
                'programId' => 'cs101',
                'intakeId' => 'cs101-2026-jan',
            ]),
            'lecturer' => [
                'id' => 'lecturer-1',
                'name' => 'Lecturer',
                'email' => 'lecturer@univai.edu',
                'role' => 'lecturer',
                'schoolId' => 'ict',
                'programId' => null,
                'intakeId' => null,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'profileCompleted' => true,
                'profileStarted' => true,
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'staff',
                'entitlements' => ['lecturer_portal'],
            ],
            'employer' => [
                'id' => 'employer-1',
                'name' => 'Employer',
                'email' => 'employer@univai.edu',
                'role' => 'employer',
                'schoolId' => null,
                'programId' => null,
                'intakeId' => null,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'profileCompleted' => true,
                'profileStarted' => true,
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'employer',
                'entitlements' => ['employer_portal'],
            ],
            'instructor' => [
                'id' => 'instructor-1',
                'name' => 'Instructor',
                'email' => 'instructor@univai.edu',
                'role' => 'instructor',
                'schoolId' => null,
                'programId' => null,
                'intakeId' => null,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'profileCompleted' => true,
                'profileStarted' => true,
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'instructor',
                'entitlements' => ['instructor_portal', 'instructor_ai'],
            ],
            'admin' => [
                'id' => 'admin-1',
                'name' => 'Admin',
                'email' => 'admin@univai.edu',
                'role' => 'admin',
                'schoolId' => null,
                'programId' => null,
                'intakeId' => null,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'profileCompleted' => true,
                'profileStarted' => true,
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'staff',
                'entitlements' => ['admin_portal', 'admin_academic', 'admin_users', 'admin_finance'],
            ],
            default => StudentAccess::sessionPayload([
                'id' => 'student-premium',
                'name' => 'Premium Student',
                'email' => 'student.premium@univai.edu',
                'role' => StudentAccess::ROLE_PREMIUM,
                'schoolId' => null,
                'programId' => null,
            ]),
        };
    }
}
