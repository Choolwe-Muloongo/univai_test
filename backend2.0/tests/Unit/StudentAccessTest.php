<?php

namespace Tests\Unit;

use App\Support\StudentAccess;
use PHPUnit\Framework\TestCase;

class StudentAccessTest extends TestCase
{
    public function test_free_students_only_receive_short_course_entitlement(): void
    {
        $sessionUser = StudentAccess::sessionPayload([
            'id' => 'student-free',
            'role' => StudentAccess::ROLE_FREE,
            'entitlements' => [StudentAccess::ENTITLEMENT_PROGRAMME],
        ]);

        $this->assertTrue(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_SHORT_COURSE, $sessionUser));
        $this->assertFalse(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_CERTIFICATE, $sessionUser));
        $this->assertFalse(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_PREMIUM, $sessionUser));
        $this->assertFalse(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_PROGRAMME, $sessionUser));
    }

    public function test_premium_and_programme_students_receive_expected_entitlements(): void
    {
        $premium = StudentAccess::sessionPayload([
            'id' => 'student-premium',
            'role' => StudentAccess::ROLE_PREMIUM,
        ]);
        $programme = StudentAccess::sessionPayload([
            'id' => 'student-programme',
            'role' => StudentAccess::ROLE_PROGRAMME,
        ]);

        $this->assertTrue(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_PREMIUM, $premium));
        $this->assertFalse(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_PROGRAMME, $premium));
        $this->assertTrue(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_PREMIUM, $programme));
        $this->assertTrue(StudentAccess::userHasEntitlement(null, StudentAccess::ENTITLEMENT_PROGRAMME, $programme));
    }
}
