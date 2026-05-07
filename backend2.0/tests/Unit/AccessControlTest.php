<?php

namespace Tests\Unit;

use App\Support\Access\AccessControl;
use PHPUnit\Framework\TestCase;

class AccessControlTest extends TestCase
{
    public function test_student_access_requires_entitlement_and_complete_profile(): void
    {
        $access = new AccessControl();

        $allowed = $access->authorize([
            'id' => 'student-1',
            'role' => 'premium-student',
            'accountState' => 'active',
            'verificationStatus' => 'email',
            'profileCompleted' => true,
            'subscriptionStatus' => 'active',
            'entitlements' => ['student_portal', 'course_access'],
        ], ['student.portal']);

        $missingProfile = $access->authorize([
            'id' => 'student-1',
            'role' => 'premium-student',
            'accountState' => 'active',
            'verificationStatus' => 'email',
            'profileCompleted' => false,
            'subscriptionStatus' => 'active',
            'entitlements' => ['student_portal', 'course_access'],
        ], ['student.portal']);

        $this->assertTrue($allowed->allowed);
        $this->assertFalse($missingProfile->allowed);
        $this->assertSame('Forbidden: profile is incomplete.', $missingProfile->reason);
    }

    public function test_student_tier_roles_resolve_through_central_access_formula(): void
    {
        $access = new AccessControl();

        foreach (['free-student', 'certificate-student', 'premium-student', 'programme-student', 'freemium-student', 'enrolled'] as $role) {
            $decision = $access->authorize([
                'id' => $role,
                'role' => $role,
                'accountState' => in_array($role, ['programme-student', 'enrolled'], true) ? 'enrolled' : 'active',
                'verificationStatus' => 'email',
                'profileCompleted' => true,
                'subscriptionStatus' => in_array($role, ['premium-student', 'programme-student', 'enrolled'], true) ? 'active' : 'free',
                'entitlements' => ['student_portal'],
            ], ['student.portal']);

            $this->assertTrue($decision->allowed, "Expected {$role} to access the student portal.");
        }
    }

    public function test_admin_access_requires_identity_verification(): void
    {
        $access = new AccessControl();

        $decision = $access->authorize([
            'id' => 'admin-1',
            'role' => 'admin',
            'accountState' => 'active',
            'verificationStatus' => 'email',
            'profileCompleted' => true,
            'subscriptionStatus' => 'none',
            'entitlements' => ['admin_portal'],
        ], ['admin.portal']);

        $this->assertFalse($decision->allowed);
        $this->assertSame('Forbidden: verification requirements are not met.', $decision->reason);
    }

    public function test_legacy_role_parameters_are_mapped_to_central_permissions(): void
    {
        $access = new AccessControl();

        $decision = $access->authorize([
            'id' => 'lecturer-1',
            'role' => 'lecturer',
        ], ['lecturer']);

        $this->assertTrue($decision->allowed);
    }
}
