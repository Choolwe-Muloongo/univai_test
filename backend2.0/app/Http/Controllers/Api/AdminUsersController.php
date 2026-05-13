<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicEntitlement;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserStateTransition;
use App\Models\UserSubscription;
use App\Support\Access\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUsersController extends Controller
{
    public function __construct(private readonly AccessControl $accessControl)
    {
    }

    public function index(Request $request)
    {
        $query = User::query()
            ->with(['profile', 'activeSubscription', 'activeEntitlements'])
            ->latest('updated_at');

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($state = $request->query('state')) {
            $query->where('account_state', $state);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%")
                    ->orWhere('school_id', 'like', "%{$search}%")
                    ->orWhere('program_id', 'like', "%{$search}%")
                    ->orWhere('intake_id', 'like', "%{$search}%");
            });
        }

        return [
            'data' => $query->limit(min((int) $request->query('limit', 100), 250))->get()->map(fn (User $user) => $this->mapUser($user)),
            'roleCapabilities' => AccessControl::roleCapabilities(),
            'permissions' => AccessControl::permissionMatrix(),
        ];
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'email' => ['required', 'email'],
            'role' => ['required', 'string'],
            'state' => ['nullable', 'string'],
            'accountState' => ['nullable', 'string'],
            'verificationStatus' => ['nullable', 'string'],
            'schoolId' => ['nullable', 'string'],
            'programId' => ['nullable', 'string'],
            'intakeId' => ['nullable', 'string'],
            'unit' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'subscriptionTier' => ['nullable', 'string'],
            'subscriptionStatus' => ['nullable', 'string'],
            'entitlements' => ['nullable', 'array'],
            'entitlements.*' => ['string'],
        ]);

        $role = $payload['role'];
        $state = $payload['accountState'] ?? $payload['state'] ?? 'invited';
        $verification = $payload['verificationStatus'] ?? (in_array($role, [AccessControl::ROLE_LECTURER, AccessControl::ROLE_INSTRUCTOR, ...AccessControl::ADMIN_ROLES], true) ? 'identity' : 'email');

        $user = User::updateOrCreate(
            ['email' => strtolower($payload['email'])],
            [
                'name' => $payload['name'],
                'password' => Hash::make(Str::random(24)),
                'role' => $role,
                'school_id' => $payload['schoolId'] ?? null,
                'program_id' => $payload['programId'] ?? null,
                'intake_id' => $payload['intakeId'] ?? null,
                'account_state' => $state,
                'verification_status' => $verification,
                'profile_completed_at' => $state === 'active' ? now() : null,
            ]
        );

        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $payload['name'],
                'bio' => $payload['notes'] ?? null,
                'completion_percent' => $state === 'active' ? 100 : 25,
                'completed_at' => $state === 'active' ? now() : null,
            ]
        );

        $this->syncSubscription($user, $payload['subscriptionTier'] ?? null, $payload['subscriptionStatus'] ?? null);
        $this->syncEntitlements($user, $payload['entitlements'] ?? $this->defaultEntitlementsForRole($role));
        $this->recordTransition($user, null, $state, $request, $payload['notes'] ?? 'User created by admin.');

        return response()->json($this->mapUser($user->fresh(['profile', 'activeSubscription', 'activeEntitlements'])), 201);
    }

    public function update(Request $request, User $user)
    {
        $payload = $request->validate([
            'name' => ['nullable', 'string', 'min:2'],
            'role' => ['nullable', 'string'],
            'schoolId' => ['nullable', 'string'],
            'programId' => ['nullable', 'string'],
            'intakeId' => ['nullable', 'string'],
            'verificationStatus' => ['nullable', 'string'],
            'profileCompleted' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            'subscriptionTier' => ['nullable', 'string'],
            'subscriptionStatus' => ['nullable', 'string'],
            'entitlements' => ['nullable', 'array'],
            'entitlements.*' => ['string'],
        ]);

        $user->fill([
            'name' => $payload['name'] ?? $user->name,
            'role' => $payload['role'] ?? $user->role,
            'school_id' => array_key_exists('schoolId', $payload) ? $payload['schoolId'] : $user->school_id,
            'program_id' => array_key_exists('programId', $payload) ? $payload['programId'] : $user->program_id,
            'intake_id' => array_key_exists('intakeId', $payload) ? $payload['intakeId'] : $user->intake_id,
            'verification_status' => $payload['verificationStatus'] ?? $user->verification_status,
            'profile_completed_at' => array_key_exists('profileCompleted', $payload)
                ? ($payload['profileCompleted'] ? now() : null)
                : $user->profile_completed_at,
        ])->save();

        if (array_key_exists('notes', $payload) || array_key_exists('profileCompleted', $payload)) {
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'display_name' => $user->name,
                    'bio' => $payload['notes'] ?? $user->profile?->bio,
                    'completion_percent' => ($payload['profileCompleted'] ?? (bool) $user->profile_completed_at) ? 100 : 25,
                    'completed_at' => ($payload['profileCompleted'] ?? (bool) $user->profile_completed_at) ? now() : null,
                ]
            );
        }

        if (array_key_exists('subscriptionTier', $payload) || array_key_exists('subscriptionStatus', $payload)) {
            $this->syncSubscription($user, $payload['subscriptionTier'] ?? null, $payload['subscriptionStatus'] ?? null);
        }

        if (array_key_exists('entitlements', $payload)) {
            $this->syncEntitlements($user, $payload['entitlements'] ?? []);
        }

        return $this->mapUser($user->fresh(['profile', 'activeSubscription', 'activeEntitlements']));
    }

    public function transition(Request $request, User $user)
    {
        $payload = $request->validate([
            'toState' => ['required', 'string'],
            'reason' => ['nullable', 'string'],
            'notify' => ['nullable', 'boolean'],
        ]);

        $fromState = $user->account_state;
        $toState = $payload['toState'];

        $user->update([
            'account_state' => $toState,
            'profile_completed_at' => $toState === 'active' ? ($user->profile_completed_at ?? now()) : $user->profile_completed_at,
        ]);

        if ($toState === 'active') {
            $this->syncEntitlements($user, $this->defaultEntitlementsForRole($user->role));
        }

        $this->recordTransition($user, $fromState, $toState, $request, $payload['reason'] ?? null, ['notify' => (bool) ($payload['notify'] ?? true)]);

        return $this->mapUser($user->fresh(['profile', 'activeSubscription', 'activeEntitlements']));
    }

    private function mapUser(User $user): array
    {
        $sessionLike = [
            'id' => (string) $user->id,
            'role' => $user->role,
        ];
        $context = $this->accessControl->contextFor($sessionLike);
        $unit = collect([$user->school_id, $user->program_id, $user->intake_id])->filter()->join(' · ');

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->account_state,
            'accountState' => $user->account_state,
            'verificationStatus' => $user->verification_status,
            'profileCompleted' => $context['profileCompleted'],
            'subscriptionStatus' => $context['subscription'],
            'subscriptionTier' => $context['subscriptionTier'],
            'entitlements' => $context['entitlements'],
            'schoolId' => $user->school_id,
            'programId' => $user->program_id,
            'intakeId' => $user->intake_id,
            'unit' => $unit !== '' ? $unit : 'Unassigned',
            'notes' => $user->profile?->bio,
            'capabilities' => AccessControl::roleCapabilities()[$user->role] ?? null,
        ];
    }

    private function syncSubscription(User $user, ?string $tier, ?string $status): void
    {
        UserSubscription::updateOrCreate(
            ['user_id' => $user->id, 'tier' => $tier ?? $this->defaultTierForRole($user->role)],
            [
                'status' => $status ?? $this->defaultSubscriptionStatusForRole($user->role),
                'starts_at' => now(),
                'ends_at' => null,
            ]
        );
    }

    private function syncEntitlements(User $user, array $entitlements): void
    {
        $entitlements = array_values(array_unique($entitlements));

        foreach ($entitlements as $code) {
            AcademicEntitlement::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'code' => $code,
                    'scope_type' => null,
                    'scope_id' => null,
                ],
                [
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => null,
                    'metadata' => ['source' => 'admin-users'],
                ]
            );
        }

        AcademicEntitlement::where('user_id', $user->id)
            ->whereNull('scope_type')
            ->whereNull('scope_id')
            ->whereNotIn('code', $entitlements)
            ->update(['status' => 'revoked']);
    }

    private function recordTransition(User $user, ?string $fromState, string $toState, Request $request, ?string $reason = null, array $metadata = []): void
    {
        $actor = $request->session()->get('user');

        UserStateTransition::create([
            'user_id' => $user->id,
            'from_state' => $fromState,
            'to_state' => $toState,
            'reason' => $reason,
            'changed_by' => is_numeric($actor['id'] ?? null) ? (int) $actor['id'] : null,
            'metadata' => $metadata + ['actor_role' => $actor['role'] ?? null],
        ]);
    }

    private function defaultTierForRole(?string $role): string
    {
        return match ($role) {
            AccessControl::ROLE_PROGRAMME_STUDENT, AccessControl::ROLE_PROGRAM_STUDENT, AccessControl::ROLE_ENROLLED => 'programme',
            AccessControl::ROLE_PREMIUM_STUDENT => 'premium',
            AccessControl::ROLE_CERTIFICATE_STUDENT, AccessControl::ROLE_PAID_CERTIFICATE_STUDENT => 'certificate',
            AccessControl::ROLE_STUDENT, AccessControl::ROLE_FREE_STUDENT, AccessControl::ROLE_FREEMIUM_STUDENT => 'freemium',
            default => 'none',
        };
    }

    private function defaultSubscriptionStatusForRole(?string $role): string
    {
        return in_array($role, AccessControl::STUDENT_ROLES, true) ? 'free' : 'none';
    }

    private function defaultEntitlementsForRole(?string $role): array
    {
        return match ($role) {
            AccessControl::ROLE_SUPER_ADMIN, AccessControl::ROLE_ADMIN, AccessControl::ROLE_NORMAL_ADMIN, AccessControl::ROLE_ADMISSIONS_ADMIN, AccessControl::ROLE_LECTURER_ADMIN, AccessControl::ROLE_EMPLOYER_VERIFICATION_ADMIN, AccessControl::ROLE_FINANCE_ADMIN, AccessControl::ROLE_READ_ONLY_ADMIN, AccessControl::ROLE_EXAM_OFFICER => ['admin_portal'],
            AccessControl::ROLE_LECTURER => ['teaching'],
            AccessControl::ROLE_EMPLOYER => ['employer_portal'],
            AccessControl::ROLE_INSTRUCTOR => ['instructor_portal', 'instructor_ai'],
            AccessControl::ROLE_PROGRAMME_STUDENT, AccessControl::ROLE_PROGRAM_STUDENT, AccessControl::ROLE_ENROLLED => ['student_portal', 'course_access', 'ai_tutor', 'programme-access', 'premium-access', 'certificate-access', 'short-course-access'],
            AccessControl::ROLE_PREMIUM_STUDENT => ['student_portal', 'course_access', 'ai_tutor', 'premium-access', 'certificate-access', 'short-course-access'],
            AccessControl::ROLE_CERTIFICATE_STUDENT, AccessControl::ROLE_PAID_CERTIFICATE_STUDENT => ['student_portal', 'course_access', 'certificate-access', 'short-course-access'],
            AccessControl::ROLE_STUDENT, AccessControl::ROLE_FREE_STUDENT, AccessControl::ROLE_FREEMIUM_STUDENT => ['student_portal', 'short-course-access'],
            default => [],
        };
    }
}
