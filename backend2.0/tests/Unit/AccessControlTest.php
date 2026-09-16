<?php

namespace Tests\Unit;

use App\Support\Access\AccessControl;
use PHPUnit\Framework\TestCase;

class AccessControlTest extends TestCase
{
    public function test_student_portal_access_requires_entitlement_but_not_a_complete_profile(): void
    {
        $access = new AccessControl();

        $allowed = $access->authorize($this->student(['profileCompleted' => true]), ['student.portal']);

        // The portal is where a student completes their profile, and it admits applicants,
        // so an incomplete profile must not lock them out of it.
        $missingProfile = $access->authorize($this->student(['profileCompleted' => false]), ['student.portal']);

        $missingEntitlement = $access->authorize($this->student(['entitlements' => []]), ['student.portal']);

        $this->assertTrue($allowed->allowed);
        $this->assertTrue($missingProfile->allowed);
        $this->assertFalse($missingEntitlement->allowed);
        $this->assertSame('Forbidden: missing academic entitlement.', $missingEntitlement->reason);
    }

    public function test_learning_access_requires_a_complete_profile(): void
    {
        $access = new AccessControl();

        $allowed = $access->authorize($this->student(['profileCompleted' => true]), ['student.learning']);
        $missingProfile = $access->authorize($this->student(['profileCompleted' => false]), ['student.learning']);

        $this->assertTrue($allowed->allowed);
        $this->assertFalse($missingProfile->allowed);
        $this->assertSame('Forbidden: profile is incomplete.', $missingProfile->reason);
    }

    /**
     * A session-shaped student, overridable per assertion.
     */
    private function student(array $overrides = []): array
    {
        return array_merge([
            'id' => 'student-1',
            'role' => 'premium-student',
            'accountState' => 'active',
            'verificationStatus' => 'email',
            'profileCompleted' => true,
            'subscriptionStatus' => 'active',
            'entitlements' => ['student_portal', 'course_access'],
        ], $overrides);
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
