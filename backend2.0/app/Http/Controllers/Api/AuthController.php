<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicEntitlement;
use App\Models\User;
use App\Models\UserProfile;
use App\Support\Access\AccessControl;
use App\Support\Affiliates\AffiliateService;
use App\Support\Onboarding\UserOnboardingMessenger;
use Illuminate\Http\Request;
use App\Support\StudentAccess;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $payload = $request->validate([
            'email' => ['nullable', 'email'],
            'password' => ['nullable', 'string'],
            'role' => ['nullable', 'string'],
        ]);

        $persistedUser = null;

        if (!empty($payload['email'])) {
            $email = strtolower(trim($payload['email']));
            $password = $payload['password'] ?? '';
            $user = User::with(['activeSubscription', 'activeEntitlements'])->where('email', $email)->first();

            if ($user && Hash::check($password, $user->password)) {
                $persistedUser = $user;
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
        app(UserOnboardingMessenger::class)->sendWelcomeOnce($sessionUser, $persistedUser);

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

        $freshUser = $user->fresh(['activeSubscription', 'activeEntitlements']);
        $sessionUser = $this->mapUser($freshUser);
        $request->session()->regenerate();
        $request->session()->put('user', $sessionUser);
        app(UserOnboardingMessenger::class)->sendWelcomeOnce($sessionUser, $freshUser);

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
        $profile = is_array($sessionUser) && is_array($sessionUser['profile'] ?? null) ? $sessionUser['profile'] : [];

        if (!$userId || !is_numeric($userId)) {
            return response()->json([
                'user' => $sessionUser,
                'profile' => [
                    'displayName' => $profile['displayName'] ?? ($sessionUser['name'] ?? null),
                    'phone' => $profile['phone'] ?? null,
                    'country' => $profile['country'] ?? null,
                    'timezone' => $profile['timezone'] ?? null,
                    'bio' => $profile['bio'] ?? null,
                    'avatar' => $profile['avatar'] ?? ($sessionUser['avatar'] ?? null),
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

        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'avatar' => ['nullable', 'string'],
        ]);

        $incomingAvatar = $payload['avatar'] ?? null;
        if ($incomingAvatar !== null && $this->isUnsafeInlineAvatar($incomingAvatar)) {
            unset($payload['avatar']);
        }

        if (!$userId || !is_numeric($userId)) {
            $existingAvatar = is_array($sessionUser) ? ($sessionUser['avatar'] ?? null) : null;
            $profile = [
                'displayName' => trim($payload['name']),
                'phone' => $payload['phone'] ?? null,
                'country' => $payload['country'] ?? null,
                'timezone' => $payload['timezone'] ?? null,
                'bio' => $payload['bio'] ?? null,
                'avatar' => $payload['avatar'] ?? $existingAvatar,
            ];

            $session = array_merge(is_array($sessionUser) ? $sessionUser : [], [
                'name' => trim($payload['name']),
                'email' => strtolower(trim($payload['email'])),
                'avatar' => $profile['avatar'],
                'profileCompleted' => true,
                'profileStarted' => true,
                'profile' => $profile,
            ]);

            $request->session()->put('user', $session);

            return response()->json([
                'user' => $session,
                'profile' => $profile,
            ]);
        }

        $user = User::with('profile', 'activeSubscription', 'activeEntitlements')->findOrFail((int) $userId);
        $email = strtolower(trim($payload['email']));
        $emailTaken = User::where('email', $email)->where('id', '!=', $user->id)->exists();
        if ($emailTaken) {
            return response()->json(['message' => 'Email already belongs to another account.'], 422);
        }

        $safeAvatar = array_key_exists('avatar', $payload) ? $payload['avatar'] : null;
        $existingAvatar = $user->profile?->avatar ?: $user->avatar;
        $avatar = $safeAvatar ?: $existingAvatar;

        $user->forceFill([
            'name' => trim($payload['name']),
            'email' => $email,
            'avatar' => $avatar,
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
                'avatar' => $avatar,
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

    public function changePassword(Request $request)
    {
        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        if (!$userId || !is_numeric($userId)) {
            return response()->json(['message' => 'Password changes are only available for saved user accounts.'], 422);
        }

        $payload = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'confirmed', Password::min(8)],
            'newPassword_confirmation' => ['required', 'string'],
        ]);

        $user = User::findOrFail((int) $userId);

        if (!Hash::check($payload['currentPassword'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->forceFill([
            'password' => Hash::make($payload['newPassword']),
        ])->save();

        return response()->json(['message' => 'Password changed successfully.']);
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

    private function isUnsafeInlineAvatar(?string $avatar): bool
    {
        if ($avatar === null) {
            return false;
        }

        $value = trim($avatar);

        return $value === ''
            || strlen($value) > 255
            || str_starts_with(strtolower($value), 'data:image/');
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
                'profileCompleted' => false,
                'profileStarted' => false,
                'accountState' => 'applicant',
                'verificationStatus' => 'email',
                'subscriptionStatus' => 'pending',
                'subscriptionTier' => 'free',
                'entitlements' => [],
            ],
            'employer' => [
                'id' => 'employer-1',
                'name' => 'Employer Partner',
                'email' => 'employer@univai.edu',
                'role' => 'employer',
                'profileCompleted' => true,
                'profileStarted' => true,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'employer',
                'entitlements' => ['employer_portal'],
            ],
            'instructor' => [
                'id' => 'instructor-1',
                'name' => 'Instructor Creator',
                'email' => 'instructor@univai.edu',
                'role' => 'instructor',
                'profileCompleted' => true,
                'profileStarted' => true,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'instructor',
                'entitlements' => ['instructor_portal', 'instructor_ai'],
            ],
            'lecturer' => [
                'id' => 'lecturer-1',
                'name' => 'Lecturer',
                'email' => 'lecturer@univai.edu',
                'role' => 'lecturer',
                'profileCompleted' => true,
                'profileStarted' => true,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'staff',
                'entitlements' => ['lecturer_portal'],
            ],
            'admin' => [
                'id' => 'admin-1',
                'name' => 'Admin',
                'email' => 'admin@univai.edu',
                'role' => 'admin',
                'profileCompleted' => true,
                'profileStarted' => true,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'staff',
                'entitlements' => ['admin_portal', 'admin_academic', 'admin_users_manage', 'admin_finance'],
            ],
            default => [
                'id' => 'student-1',
                'name' => 'Student',
                'email' => 'student.premium@univai.edu',
                'role' => $role,
                'profileCompleted' => true,
                'profileStarted' => true,
                'accountState' => 'active',
                'verificationStatus' => 'verified',
                'subscriptionStatus' => 'active',
                'subscriptionTier' => str_contains($role, 'free') ? 'free' : 'premium',
                'entitlements' => str_contains($role, 'programme') ? ['programme_access'] : ['certificate_access'],
            ],
        };
    }
}
