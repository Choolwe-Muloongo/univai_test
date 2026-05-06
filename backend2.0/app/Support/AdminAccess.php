<?php

namespace App\Support;

class AdminAccess
{
    public const SUPER_ADMIN = 'admin';

    public const ROLE_ACADEMIC = 'admin-academic';
    public const ROLE_CURRICULUM = 'admin-curriculum';
    public const ROLE_EXAM = 'admin-exam';
    public const ROLE_QA = 'admin-qa';
    public const ROLE_CONTENT_REVIEW = 'admin-content-review';
    public const ROLE_CENTRE = 'admin-centre';
    public const ROLE_REGISTRAR = 'admin-registrar';
    public const ROLE_FINANCE = 'admin-finance';

    public const PERMISSIONS = [
        'admin.dashboard.view',
        'admin.users.manage',
        'admin.audit.view',
        'admin.academic.manage',
        'admin.curriculum.manage',
        'admin.exam.manage',
        'admin.qa.manage',
        'admin.content.review',
        'admin.centre.manage',
        'admin.registrar.manage',
        'admin.finance.manage',
        'admin.system.manage',
    ];

    private const ROLE_PERMISSIONS = [
        self::ROLE_ACADEMIC => [
            'admin.dashboard.view',
            'admin.academic.manage',
            'admin.curriculum.manage',
            'admin.exam.manage',
            'admin.qa.manage',
        ],
        self::ROLE_CURRICULUM => [
            'admin.dashboard.view',
            'admin.curriculum.manage',
            'admin.content.review',
            'admin.qa.manage',
        ],
        self::ROLE_EXAM => [
            'admin.dashboard.view',
            'admin.exam.manage',
            'admin.qa.manage',
        ],
        self::ROLE_QA => [
            'admin.dashboard.view',
            'admin.audit.view',
            'admin.qa.manage',
            'admin.content.review',
            'admin.academic.manage',
            'admin.curriculum.manage',
            'admin.exam.manage',
        ],
        self::ROLE_CONTENT_REVIEW => [
            'admin.dashboard.view',
            'admin.content.review',
            'admin.qa.manage',
        ],
        self::ROLE_CENTRE => [
            'admin.dashboard.view',
            'admin.centre.manage',
            'admin.academic.manage',
            'admin.registrar.manage',
        ],
        self::ROLE_REGISTRAR => [
            'admin.dashboard.view',
            'admin.registrar.manage',
            'admin.academic.manage',
            'admin.centre.manage',
        ],
        self::ROLE_FINANCE => [
            'admin.dashboard.view',
            'admin.finance.manage',
            'admin.audit.view',
        ],
    ];

    public static function isAdminRole(?string $role): bool
    {
        return $role === self::SUPER_ADMIN || array_key_exists((string) $role, self::ROLE_PERMISSIONS);
    }

    /**
     * @return array<int, string>
     */
    public static function permissionsForRole(?string $role): array
    {
        if ($role === self::SUPER_ADMIN) {
            return self::PERMISSIONS;
        }

        return self::ROLE_PERMISSIONS[$role] ?? [];
    }

    public static function roleHasPermission(?string $role, string $permission): bool
    {
        return in_array($permission, self::permissionsForRole($role), true);
    }
}
