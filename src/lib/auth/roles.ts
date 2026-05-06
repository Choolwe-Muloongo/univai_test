export const ROLE = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  EMPLOYER: 'employer',
  STUDENT: 'student',
  PREMIUM_STUDENT: 'premium-student',
  FREEMIUM_STUDENT: 'freemium-student',
  ENROLLED: 'enrolled',
  APPLICANT: 'applicant',
  LECTURER_APPLICANT: 'lecturer-applicant',
  EMPLOYER_APPLICANT: 'employer-applicant',
  EXAM_OFFICER: 'exam-officer',
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export const STUDENT_ROLES: readonly UserRole[] = [
  ROLE.STUDENT,
  ROLE.PREMIUM_STUDENT,
  ROLE.FREEMIUM_STUDENT,
  ROLE.ENROLLED,
];

export const ADMIN_ROLES: readonly UserRole[] = [ROLE.ADMIN, ROLE.EXAM_OFFICER];
export const LECTURER_ROLES: readonly UserRole[] = [ROLE.LECTURER];
export const EMPLOYER_ROLES: readonly UserRole[] = [ROLE.EMPLOYER];

export const PENDING_APPROVAL_ROLES: readonly UserRole[] = [
  ROLE.APPLICANT,
  ROLE.LECTURER_APPLICANT,
  ROLE.EMPLOYER_APPLICANT,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.LECTURER]: 'Lecturer',
  [ROLE.EMPLOYER]: 'Employer',
  [ROLE.STUDENT]: 'Student',
  [ROLE.PREMIUM_STUDENT]: 'Premium Student',
  [ROLE.FREEMIUM_STUDENT]: 'Freemium Student',
  [ROLE.ENROLLED]: 'Enrolled Student',
  [ROLE.APPLICANT]: 'Applicant',
  [ROLE.LECTURER_APPLICANT]: 'Lecturer Applicant',
  [ROLE.EMPLOYER_APPLICANT]: 'Employer Applicant',
  [ROLE.EXAM_OFFICER]: 'Exam Officer',
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
