export const ROLE = {
  ADMIN: 'admin',
  ADMIN_ACADEMIC: 'admin-academic',
  ADMIN_CURRICULUM: 'admin-curriculum',
  ADMIN_EXAM: 'admin-exam',
  ADMIN_QA: 'admin-qa',
  ADMIN_CONTENT_REVIEW: 'admin-content-review',
  ADMIN_CENTRE: 'admin-centre',
  ADMIN_REGISTRAR: 'admin-registrar',
  ADMIN_FINANCE: 'admin-finance',
  LECTURER: 'lecturer',
  EMPLOYER: 'employer',
  STUDENT: 'student',
  PREMIUM_STUDENT: 'premium-student',
  FREEMIUM_STUDENT: 'freemium-student',
  ENROLLED: 'enrolled',
  APPLICANT: 'applicant',
  LECTURER_APPLICANT: 'lecturer-applicant',
  EMPLOYER_APPLICANT: 'employer-applicant',
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export const ADMIN_PERMISSIONS = {
  DASHBOARD_VIEW: 'admin.dashboard.view',
  USERS_MANAGE: 'admin.users.manage',
  AUDIT_VIEW: 'admin.audit.view',
  ACADEMIC_MANAGE: 'admin.academic.manage',
  CURRICULUM_MANAGE: 'admin.curriculum.manage',
  EXAM_MANAGE: 'admin.exam.manage',
  QA_MANAGE: 'admin.qa.manage',
  CONTENT_REVIEW: 'admin.content.review',
  CENTRE_MANAGE: 'admin.centre.manage',
  REGISTRAR_MANAGE: 'admin.registrar.manage',
  FINANCE_MANAGE: 'admin.finance.manage',
  SYSTEM_MANAGE: 'admin.system.manage',
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const STUDENT_ROLES: readonly UserRole[] = [
  ROLE.STUDENT,
  ROLE.PREMIUM_STUDENT,
  ROLE.FREEMIUM_STUDENT,
  ROLE.ENROLLED,
];

export const ADMIN_ROLES = [
  ROLE.ADMIN,
  ROLE.ADMIN_ACADEMIC,
  ROLE.ADMIN_CURRICULUM,
  ROLE.ADMIN_EXAM,
  ROLE.ADMIN_QA,
  ROLE.ADMIN_CONTENT_REVIEW,
  ROLE.ADMIN_CENTRE,
  ROLE.ADMIN_REGISTRAR,
  ROLE.ADMIN_FINANCE,
];
export const LECTURER_ROLES: readonly UserRole[] = [ROLE.LECTURER];
export const EMPLOYER_ROLES: readonly UserRole[] = [ROLE.EMPLOYER];

export const PENDING_APPROVAL_ROLES: readonly UserRole[] = [
  ROLE.APPLICANT,
  ROLE.LECTURER_APPLICANT,
  ROLE.EMPLOYER_APPLICANT,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.ADMIN_ACADEMIC]: 'Academic Admin',
  [ROLE.ADMIN_CURRICULUM]: 'Curriculum Admin',
  [ROLE.ADMIN_EXAM]: 'Exam Admin',
  [ROLE.ADMIN_QA]: 'QA Admin',
  [ROLE.ADMIN_CONTENT_REVIEW]: 'Content Review Admin',
  [ROLE.ADMIN_CENTRE]: 'Centre Admin',
  [ROLE.ADMIN_REGISTRAR]: 'Registrar Admin',
  [ROLE.ADMIN_FINANCE]: 'Finance Admin',
  [ROLE.LECTURER]: 'Lecturer',
  [ROLE.EMPLOYER]: 'Employer',
  [ROLE.STUDENT]: 'Student',
  [ROLE.PREMIUM_STUDENT]: 'Premium Student',
  [ROLE.FREEMIUM_STUDENT]: 'Freemium Student',
  [ROLE.ENROLLED]: 'Enrolled Student',
  [ROLE.APPLICANT]: 'Applicant',
  [ROLE.LECTURER_APPLICANT]: 'Lecturer Applicant',
  [ROLE.EMPLOYER_APPLICANT]: 'Employer Applicant',
};

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  [ROLE.ADMIN]: Object.values(ADMIN_PERMISSIONS),
  [ROLE.ADMIN_ACADEMIC]: [
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.ACADEMIC_MANAGE,
    ADMIN_PERMISSIONS.CURRICULUM_MANAGE,
    ADMIN_PERMISSIONS.EXAM_MANAGE,
    ADMIN_PERMISSIONS.QA_MANAGE,
  ],
  [ROLE.ADMIN_CURRICULUM]: [
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.CURRICULUM_MANAGE,
    ADMIN_PERMISSIONS.CONTENT_REVIEW,
    ADMIN_PERMISSIONS.QA_MANAGE,
  ],
  [ROLE.ADMIN_EXAM]: [ADMIN_PERMISSIONS.DASHBOARD_VIEW, ADMIN_PERMISSIONS.EXAM_MANAGE, ADMIN_PERMISSIONS.QA_MANAGE],
  [ROLE.ADMIN_QA]: [
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.AUDIT_VIEW,
    ADMIN_PERMISSIONS.QA_MANAGE,
    ADMIN_PERMISSIONS.CONTENT_REVIEW,
    ADMIN_PERMISSIONS.ACADEMIC_MANAGE,
    ADMIN_PERMISSIONS.CURRICULUM_MANAGE,
    ADMIN_PERMISSIONS.EXAM_MANAGE,
  ],
  [ROLE.ADMIN_CONTENT_REVIEW]: [ADMIN_PERMISSIONS.DASHBOARD_VIEW, ADMIN_PERMISSIONS.CONTENT_REVIEW, ADMIN_PERMISSIONS.QA_MANAGE],
  [ROLE.ADMIN_CENTRE]: [
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.CENTRE_MANAGE,
    ADMIN_PERMISSIONS.ACADEMIC_MANAGE,
    ADMIN_PERMISSIONS.REGISTRAR_MANAGE,
  ],
  [ROLE.ADMIN_REGISTRAR]: [
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.REGISTRAR_MANAGE,
    ADMIN_PERMISSIONS.ACADEMIC_MANAGE,
    ADMIN_PERMISSIONS.CENTRE_MANAGE,
  ],
  [ROLE.ADMIN_FINANCE]: [ADMIN_PERMISSIONS.DASHBOARD_VIEW, ADMIN_PERMISSIONS.FINANCE_MANAGE, ADMIN_PERMISSIONS.AUDIT_VIEW],
};

export function isKnownUserRole(role: string | null | undefined): role is UserRole {
  if (!role) {
    return false;
  }

  return Object.values(ROLE).includes(role as UserRole);
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return 'Unknown role';
  }

  return isKnownUserRole(role) ? ROLE_LABELS[role] : role;
}

export function isStudentRole(role: string | null | undefined): boolean {
  return isKnownUserRole(role) && STUDENT_ROLES.includes(role);
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return isKnownUserRole(role) && ADMIN_ROLES.includes(role as AdminRole);
}

export function getAdminPermissions(role: string | null | undefined): readonly AdminPermission[] {
  return isAdminRole(role) ? ADMIN_ROLE_PERMISSIONS[role] : [];
}

export function adminHasPermission(
  role: string | null | undefined,
  permission: AdminPermission,
  explicitPermissions?: readonly string[] | null
): boolean {
  if (explicitPermissions?.includes(permission)) {
    return true;
  }

  return getAdminPermissions(role).includes(permission);
}
