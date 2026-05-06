export const ROLE = {
  ADMIN: "admin",
  LECTURER: "lecturer",
  EMPLOYER: "employer",
  STUDENT: "student",
  FREE_STUDENT: "free-student",
  CERTIFICATE_STUDENT: "certificate-student",
  PREMIUM_STUDENT: "premium-student",
  FREEMIUM_STUDENT: "freemium-student",
  ENROLLED: "enrolled",
  PROGRAMME_STUDENT: "programme-student",
  APPLICANT: "applicant",
  LECTURER_APPLICANT: "lecturer-applicant",
  EMPLOYER_APPLICANT: "employer-applicant",
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export const STUDENT_ROLES: readonly UserRole[] = [
  ROLE.STUDENT,
  ROLE.FREE_STUDENT,
  ROLE.CERTIFICATE_STUDENT,
  ROLE.PREMIUM_STUDENT,
  ROLE.FREEMIUM_STUDENT,
  ROLE.ENROLLED,
  ROLE.PROGRAMME_STUDENT,
];

export const ADMIN_ROLES: readonly UserRole[] = [ROLE.ADMIN];
export const LECTURER_ROLES: readonly UserRole[] = [ROLE.LECTURER];
export const EMPLOYER_ROLES: readonly UserRole[] = [ROLE.EMPLOYER];

export const PENDING_APPROVAL_ROLES: readonly UserRole[] = [
  ROLE.APPLICANT,
  ROLE.LECTURER_APPLICANT,
  ROLE.EMPLOYER_APPLICANT,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE.ADMIN]: "Admin",
  [ROLE.LECTURER]: "Lecturer",
  [ROLE.EMPLOYER]: "Employer",
  [ROLE.STUDENT]: "Student",
  [ROLE.FREE_STUDENT]: "Free Student",
  [ROLE.CERTIFICATE_STUDENT]: "Certificate Student",
  [ROLE.PREMIUM_STUDENT]: "Premium Student",
  [ROLE.FREEMIUM_STUDENT]: "Freemium Student",
  [ROLE.ENROLLED]: "Enrolled Student",
  [ROLE.PROGRAMME_STUDENT]: "Programme Student",
  [ROLE.APPLICANT]: "Applicant",
  [ROLE.LECTURER_APPLICANT]: "Lecturer Applicant",
  [ROLE.EMPLOYER_APPLICANT]: "Employer Applicant",
};

export function isKnownUserRole(
  role: string | null | undefined,
): role is UserRole {
  if (!role) {
    return false;
  }

  return Object.values(ROLE).includes(role as UserRole);
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return "Unknown role";
  }

  return isKnownUserRole(role) ? ROLE_LABELS[role] : role;
}

export function isStudentRole(role: string | null | undefined): boolean {
  return isKnownUserRole(role) && STUDENT_ROLES.includes(role);
}

export const STUDENT_ACCESS_TIER = {
  FREE_LEARNING: "free-learning",
  CERTIFICATE: "certificate",
  PREMIUM: "premium",
  PROGRAMME: "programme",
} as const;

export type StudentAccessTier =
  (typeof STUDENT_ACCESS_TIER)[keyof typeof STUDENT_ACCESS_TIER];

export const STUDENT_ENTITLEMENT = {
  SHORT_COURSE: "short-course-access",
  CERTIFICATE: "certificate-access",
  PREMIUM: "premium-access",
  PROGRAMME: "programme-access",
} as const;

export type StudentEntitlement =
  (typeof STUDENT_ENTITLEMENT)[keyof typeof STUDENT_ENTITLEMENT];

export const STUDENT_ACCESS_TIER_LABELS: Record<StudentAccessTier, string> = {
  [STUDENT_ACCESS_TIER.FREE_LEARNING]: "Free Learning",
  [STUDENT_ACCESS_TIER.CERTIFICATE]: "Paid Certificates",
  [STUDENT_ACCESS_TIER.PREMIUM]: "Premium Membership",
  [STUDENT_ACCESS_TIER.PROGRAMME]: "Formal Programme",
};

export function roleToStudentAccessTier(
  role: string | null | undefined,
): StudentAccessTier {
  switch (role) {
    case ROLE.CERTIFICATE_STUDENT:
      return STUDENT_ACCESS_TIER.CERTIFICATE;
    case ROLE.PREMIUM_STUDENT:
      return STUDENT_ACCESS_TIER.PREMIUM;
    case ROLE.ENROLLED:
    case ROLE.PROGRAMME_STUDENT:
      return STUDENT_ACCESS_TIER.PROGRAMME;
    default:
      return STUDENT_ACCESS_TIER.FREE_LEARNING;
  }
}

export function studentEntitlementsForTier(
  tier: StudentAccessTier,
): StudentEntitlement[] {
  switch (tier) {
    case STUDENT_ACCESS_TIER.CERTIFICATE:
      return [
        STUDENT_ENTITLEMENT.SHORT_COURSE,
        STUDENT_ENTITLEMENT.CERTIFICATE,
      ];
    case STUDENT_ACCESS_TIER.PREMIUM:
      return [
        STUDENT_ENTITLEMENT.SHORT_COURSE,
        STUDENT_ENTITLEMENT.CERTIFICATE,
        STUDENT_ENTITLEMENT.PREMIUM,
      ];
    case STUDENT_ACCESS_TIER.PROGRAMME:
      return [
        STUDENT_ENTITLEMENT.SHORT_COURSE,
        STUDENT_ENTITLEMENT.CERTIFICATE,
        STUDENT_ENTITLEMENT.PREMIUM,
        STUDENT_ENTITLEMENT.PROGRAMME,
      ];
    default:
      return [STUDENT_ENTITLEMENT.SHORT_COURSE];
  }
}

export function hasStudentEntitlement(
  entitlement: StudentEntitlement,
  entitlements?: readonly string[] | null,
  tier?: StudentAccessTier | null,
): boolean {
  if (entitlements?.includes(entitlement)) {
    return true;
  }

  return tier ? studentEntitlementsForTier(tier).includes(entitlement) : false;
}
