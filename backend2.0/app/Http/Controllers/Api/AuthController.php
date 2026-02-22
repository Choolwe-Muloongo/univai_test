<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
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
            $user = User::where('email', $payload['email'])->first();
            if (!$user || !Hash::check($payload['password'] ?? '', $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 422);
            }

            $sessionUser = $this->mapUser($user);
        } else {
            if (!config('app.debug')) {
                return response()->json(['message' => 'Email and password are required.'], 422);
            }
            $role = $payload['role'] ?? 'premium-student';
            $sessionUser = $this->demoUser($role);
        }

        $request->session()->put('user', $sessionUser);
        $request->session()->regenerate();

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
        ]);

        $sessionUser = $this->mapUser($user);
        $request->session()->put('user', $sessionUser);
        $request->session()->regenerate();

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
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'student',
            'schoolId' => $user->school_id,
            'programId' => $user->program_id,
            'intakeId' => $user->intake_id,
        ];
    }

    private function demoUser(string $role): array
    {
        return match ($role) {
            'freemium-student' => [
                'id' => 'student-freemium',
                'name' => 'Freemium Student',
                'email' => 'student.freemium@univai.edu',
                'role' => 'freemium-student',
                'schoolId' => null,
                'programId' => null,
            ],
            'lecturer' => [
                'id' => 'lecturer-1',
                'name' => 'Lecturer',
                'email' => 'lecturer@univai.edu',
                'role' => 'lecturer',
            ],
            'employer' => [
                'id' => 'employer-1',
                'name' => 'Employer',
                'email' => 'employer@univai.edu',
                'role' => 'employer',
            ],
            'admin' => [
                'id' => 'admin-1',
                'name' => 'Admin',
                'email' => 'admin@univai.edu',
                'role' => 'admin',
            ],
            default => [
                'id' => 'student-premium',
                'name' => 'Premium Student',
                'email' => 'student.premium@univai.edu',
                'role' => 'premium-student',
                'schoolId' => 'ict',
                'programId' => 'cs101',
                'intakeId' => 'cs101-2026-jan',
            ],
        };
    }
}
