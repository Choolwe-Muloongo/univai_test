<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Access\AccessControl;
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

    public function register(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        if (User::where('email', $payload['email'])->exists()) {
            return response()->json(['message' => 'Email already registered'], 422);
        }

        $user = User::create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'role' => 'applicant',
            'account_state' => 'applicant',
            'verification_status' => 'email',
        ]);

        $sessionUser = $this->mapUser($user);
        $request->session()->regenerate();
        $request->session()->put('user', $sessionUser);

        return response()->json(['user' => $sessionUser], 201);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->session()->get('user'),
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

        $user->update([
            'password' => Hash::make($payload['password']),
        ]);

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
            'student.premium@univai.edu' => 'premium-student',
            'student.free@univai.edu' => 'free-student',
            'student.freemium@univai.edu' => 'freemium-student',
            'student.certificate@univai.edu' => 'paid-certificate-student',
            'student.programme@univai.edu' => 'programme-student',
            'lecturer@univai.edu' => 'lecturer',
            'employer@univai.edu' => 'employer',
            'admin@univai.edu' => 'admin',
        ];
    }

    private function demoUser(string $role): array
    {
        return match ($role) {
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
                'accountState' => 'active',
                'verificationStatus' => 'identity',
                'profileCompleted' => true,
                'subscriptionStatus' => 'none',
                'subscriptionTier' => 'none',
                'entitlements' => ['teaching'],
            ],
            'employer' => [
                'id' => 'employer-1',
                'name' => 'Employer',
                'email' => 'employer@univai.edu',
                'role' => 'employer',
                'accountState' => 'active',
                'verificationStatus' => 'email',
                'profileCompleted' => true,
                'subscriptionStatus' => 'none',
                'subscriptionTier' => 'none',
                'entitlements' => ['employer_portal'],
            ],
            'admin' => [
                'id' => 'admin-1',
                'name' => 'Admin',
                'email' => 'admin@univai.edu',
                'role' => 'admin',
                'accountState' => 'active',
                'verificationStatus' => 'identity',
                'profileCompleted' => true,
                'subscriptionStatus' => 'none',
                'subscriptionTier' => 'none',
                'entitlements' => ['admin_portal'],
            ],
            default => StudentAccess::sessionPayload([
                'id' => 'student-premium',
                'name' => 'Premium Student',
                'email' => 'student.premium@univai.edu',
                'role' => StudentAccess::ROLE_PREMIUM,
                'schoolId' => 'ict',
                'programId' => 'cs101',
                'intakeId' => 'cs101-2026-jan',
                'accountState' => 'active',
                'verificationStatus' => 'email',
                'profileCompleted' => true,
                'subscriptionStatus' => 'active',
                'subscriptionTier' => 'premium',
                'entitlements' => ['student_portal', 'course_access', 'ai_tutor'],
            ]),
        };
    }
}
