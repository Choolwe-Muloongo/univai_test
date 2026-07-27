export const ROLE = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  RESEARCHER: 'researcher',
  EMPLOYER: 'employer',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  FREE_STUDENT: 'free-student',
  PAID_CERTIFICATE_STUDENT: 'paid-certificate-student',
  PREMIUM_STUDENT: 'premium-student',
  PROGRAMME_STUDENT: 'programme-student',
  FREEMIUM_STUDENT: 'freemium-student',
  ENROLLED: 'enrolled',
  APPLICANT: 'applicant',
  LECTURER_APPLICANT: 'lecturer-applicant',
  EMPLOYER_APPLICANT: 'employer-applicant',
  RESEARCHER_APPLICANT: 'researcher-applicant',
  EXAM_OFFICER: 'exam-officer',
  CERTIFICATE_STUDENT: 'certificate-student',
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];
export type AccountState = 'applicant' | 'needs_information' | 'active' | 'enrolled' | 'probation' | 'suspended' | 'withdrawn';
export type VerificationStatus = 'none' | 'email' | 'identity' | 'academic';
export type SubscriptionStatus = 'none' | 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type SubscriptionTier = 'none' | 'freemium' | 'premium' | 'institutional' | 'programme' | 'certificate';
export type EntitlementCode =
  | 'student_portal'
  | 'course_access'
  | 'ai_tutor'
  | 'teaching'
  | 'research_portal'
  | 'employer_portal'
  | 'admin_portal'
  | 'short-course-access'
  | 'certificate-access'
  | 'premium-access'
  | 'programme-access';
export type AccessPermission = 'student.portal' | 'student.premium' | 'admissions.applicant' | 'ai.generate' | 'lecturer.portal' | 'researcher.portal' | 'instructor.portal' | 'employer.portal' | 'admin.portal';

export type AccessContext = {
  role: string | null | undefined;
  accountState?: AccountState | string | null;
  verificationStatus?: VerificationStatus | string | null;
  profileCompleted?: boolean | null;
  profileStarted?: boolean | null;
  subscriptionStatus?: SubscriptionStatus | string | null;
  subscriptionTier?: SubscriptionTier | string | null;
  entitlements?: readonly string[] | null;
};

type NormalizedAccessContext = {
  role: UserRole;
  accountState: AccountState;
  verificationStatus: VerificationStatus;
  profileCompleted: boolean;
  profileStarted: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier: SubscriptionTier;
  entitlements: readonly string[];
};

type AccessRequirement = {
  roles: readonly UserRole[];
  states: readonly AccountState[];
  verification: VerificationStatus;
  profile: 'none' | 'started' | 'complete';
  subscriptions: readonly SubscriptionStatus[];
  entitlements: readonly EntitlementCode[];
};

export const STUDENT_ROLES: readonly UserRole[] = [
  ROLE.STUDENT,
  ROLE.FREE_STUDENT,
  ROLE.PAID_CERTIFICATE_STUDENT,
  ROLE.CERTIFICATE_STUDENT,
  ROLE.PREMIUM_STUDENT,
  ROLE.PROGRAMME_STUDENT,
  ROLE.FREEMIUM_STUDENT,
  ROLE.ENROLLED,
];

export const ADMIN_ROLES: readonly UserRole[] = [ROLE.ADMIN, ROLE.EXAM_OFFICER];
export const LECTURER_ROLES: readonly UserRole[] = [ROLE.LECTURER];
export const RESEARCHER_ROLES: readonly UserRole[] = [ROLE.RESEARCHER];
export const EMPLOYER_ROLES: readonly UserRole[] = [ROLE.EMPLOYER];
export const INSTRUCTOR_ROLES: readonly UserRole[] = [ROLE.INSTRUCTOR];
export const PROGRAMME_STUDENT_ROLES: readonly UserRole[] = [ROLE.PROGRAMME_STUDENT, ROLE.ENROLLED];
export const PREMIUM_STUDENT_ROLES: readonly UserRole[] = [ROLE.PREMIUM_STUDENT, ROLE.PROGRAMME_STUDENT, ROLE.ENROLLED];
export const FREE_STUDENT_ROLES: readonly UserRole[] = [ROLE.STUDENT, ROLE.FREE_STUDENT, ROLE.FREEMIUM_STUDENT];
export const CERTIFICATE_STUDENT_ROLES: readonly UserRole[] = [ROLE.CERTIFICATE_STUDENT, ROLE.PAID_CERTIFICATE_STUDENT];

export const PENDING_APPROVAL_ROLES: readonly UserRole[] = [
  ROLE.APPLICANT,
  ROLE.LECTURER_APPLICANT,
  ROLE.EMPLOYER_APPLICANT,
  ROLE.RESEARCHER_APPLICANT,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.LECTURER]: 'Lecturer',
  [ROLE.RESEARCHER]: 'Researcher',
  [ROLE.EMPLOYER]: 'Employer',
  [ROLE.INSTRUCTOR]: 'Instructor',
  [ROLE.STUDENT]: 'Student',
  [ROLE.FREE_STUDENT]: 'Free Student',
  [ROLE.PAID_CERTIFICATE_STUDENT]: 'Paid Certificate Student',
  [ROLE.CERTIFICATE_STUDENT]: 'Certificate Student',
  [ROLE.PREMIUM_STUDENT]: 'Premium Student',
  [ROLE.PROGRAMME_STUDENT]: 'Programme Student',
  [ROLE.FREEMIUM_STUDENT]: 'Freemium Student',
  [ROLE.ENROLLED]: 'Enrolled Student',
  [ROLE.APPLICANT]: 'Applicant',
  [ROLE.LECTURER_APPLICANT]: 'Lecturer Applicant',
  [ROLE.EMPLOYER_APPLICANT]: 'Employer Applicant',
  [ROLE.RESEARCHER_APPLICANT]: 'Researcher Applicant',
  [ROLE.EXAM_OFFICER]: 'Exam Officer',
};

export const ACCESS_REQUIREMENTS: Record<AccessPermission, AccessRequirement> = {
  'student.portal': {
    roles: STUDENT_ROLES,
    states: ['active', 'enrolled', 'probation'],
    verification: 'email',
    profile: 'none',
    subscriptions: ['none', 'free', 'trialing', 'active', 'past_due'],
    entitlements: ['student_portal'],
  },
  'student.premium': {
    roles: PREMIUM_STUDENT_ROLES,
    states: ['active', 'enrolled', 'probation'],
    verification: 'email',
    profile: 'complete',
    subscriptions: ['trialing', 'active', 'past_due'],
    entitlements: ['student_portal', 'course_access'],
  },
  'admissions.applicant': {
    roles: [ROLE.APPLICANT, ...STUDENT_ROLES],
    states: ['applicant', 'active', 'enrolled', 'needs_information'],
    verification: 'email',
    profile: 'none',
    subscriptions: ['none', 'free', 'trialing', 'active', 'past_due'],
    entitlements: [],
  },
  'ai.generate': {
    roles: [ROLE.PREMIUM_STUDENT, ROLE.PROGRAMME_STUDENT, ROLE.ENROLLED, ROLE.LECTURER, ROLE.INSTRUCTOR, ROLE.ADMIN],
    states: ['active', 'enrolled', 'probation'],
    verification: 'email',
    profile: 'complete',
    subscriptions: ['trialing', 'active', 'past_due'],
    entitlements: ['ai_tutor'],
  },
  'lecturer.portal': {
    roles: LECTURER_ROLES,
    states: ['active'],
    verification: 'identity',
    profile: 'complete',
    subscriptions: ['none', 'free', 'trialing', 'active'],
    entitlements: ['teaching'],
  },
  'researcher.portal': {
    roles: RESEARCHER_ROLES,
    states: ['active'],
    verification: 'identity',
    profile: 'complete',
    subscriptions: ['none', 'free', 'trialing', 'active'],
    entitlements: ['research_portal'],
  },
  'instructor.portal': {
    roles: INSTRUCTOR_ROLES,
    states: ['active', 'probation'],
    verification: 'identity',
    profile: 'complete',
    subscriptions: ['none', 'free', 'trialing', 'active'],
    entitlements: ['teaching'],
  },
  'employer.portal': {
    roles: EMPLOYER_ROLES,
    states: ['active'],
    verification: 'email',
    profile: 'complete',
    subscriptions: ['none', 'free', 'trialing', 'active'],
    entitlements: ['employer_portal'],
  },
  'admin.portal': {
    roles: ADMIN_ROLES,
    states: ['active'],
    verification: 'identity',
    profile: 'complete',
    subscriptions: ['none', 'free', 'trialing', 'active'],
    entitlements: ['admin_portal'],
  },
};

const LEGACY_ROLE_PERMISSIONS: Partial<Record<UserRole, AccessPermission>> = {
  [ROLE.STUDENT]: 'student.portal',
  [ROLE.FREE_STUDENT]: 'student.portal',
  [ROLE.PAID_CERTIFICATE_STUDENT]: 'student.portal',
  [ROLE.CERTIFICATE_STUDENT]: 'student.portal',
  [ROLE.PREMIUM_STUDENT]: 'student.portal',
  [ROLE.PROGRAMME_STUDENT]: 'student.portal',
  [ROLE.FREEMIUM_STUDENT]: 'student.portal',
  [ROLE.ENROLLED]: 'student.portal',
  [ROLE.APPLICANT]: 'admissions.applicant',
  [ROLE.LECTURER]: 'lecturer.portal',
  [ROLE.RESEARCHER]: 'researcher.portal',
  [ROLE.EMPLOYER]: 'employer.portal',
  [ROLE.INSTRUCTOR]: 'instructor.portal',
  [ROLE.ADMIN]: 'admin.portal',
  [ROLE.EXAM_OFFICER]: 'admin.portal',
};

export function isKnownUserRole(role: string | null | undefined): role is UserRole {
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
  COHORT: "cohort-access",
  EXAM_CLINIC: "exam-clinic-access",
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
    case ROLE.PAID_CERTIFICATE_STUDENT:
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

export function hasAccess(context: AccessContext, permissionOrRole: AccessPermission | UserRole): boolean {
  const permission = toAccessPermission(permissionOrRole);
  const requirement = permission ? ACCESS_REQUIREMENTS[permission] : undefined;

  if (!requirement || !isKnownUserRole(context.role)) {
    return false;
  }

  const normalized = normalizeAccessContext(context);

  return requirement.roles.includes(normalized.role)
    && requirement.states.includes(normalized.accountState)
    && verificationRank(normalized.verificationStatus) >= verificationRank(requirement.verification)
    && (requirement.profile === 'none'
      || (requirement.profile === 'started' && normalized.profileStarted)
      || (requirement.profile === 'complete' && normalized.profileCompleted))
    && requirement.subscriptions.includes(normalized.subscriptionStatus)
    && requirement.entitlements.every((entitlement) => hasEntitlement(normalized.entitlements, entitlement));
}

function toAccessPermission(permissionOrRole: AccessPermission | UserRole): AccessPermission | undefined {
  if (permissionOrRole in ACCESS_REQUIREMENTS) {
    return permissionOrRole as AccessPermission;
  }

  return LEGACY_ROLE_PERMISSIONS[permissionOrRole as UserRole];
}

function normalizeAccessContext(context: AccessContext): NormalizedAccessContext {
  const role = context.role as UserRole;

  return {
    role,
    accountState: normalizeAccountState(context.accountState, role),
    verificationStatus: normalizeVerificationStatus(context.verificationStatus, role),
    profileCompleted: context.profileCompleted ?? fallbackProfileCompleted(role),
    profileStarted: context.profileStarted ?? context.profileCompleted ?? true,
    subscriptionStatus: normalizeSubscriptionStatus(context.subscriptionStatus, role),
    subscriptionTier: normalizeSubscriptionTier(context.subscriptionTier, role),
    entitlements: context.entitlements ?? fallbackEntitlements(role),
  };
}

function normalizeAccountState(state: string | null | undefined, role: UserRole): AccountState {
  const knownStates: readonly AccountState[] = ['applicant', 'needs_information', 'active', 'enrolled', 'probation', 'suspended', 'withdrawn'];
  return knownStates.includes(state as AccountState) ? (state as AccountState) : fallbackState(role);
}

function normalizeVerificationStatus(status: string | null | undefined, role: UserRole): VerificationStatus {
  const knownStatuses: readonly VerificationStatus[] = ['none', 'email', 'identity', 'academic'];
  return knownStatuses.includes(status as VerificationStatus) ? (status as VerificationStatus) : fallbackVerification(role);
}

function normalizeSubscriptionStatus(status: string | null | undefined, role: UserRole): SubscriptionStatus {
  const knownStatuses: readonly SubscriptionStatus[] = ['none', 'free', 'trialing', 'active', 'past_due', 'canceled', 'expired'];
  return knownStatuses.includes(status as SubscriptionStatus) ? (status as SubscriptionStatus) : fallbackSubscription(role);
}

function normalizeSubscriptionTier(tier: string | null | undefined, role: UserRole): SubscriptionTier {
  const knownTiers: readonly SubscriptionTier[] = ['none', 'freemium', 'premium', 'institutional', 'programme', 'certificate'];
  return knownTiers.includes(tier as SubscriptionTier) ? (tier as SubscriptionTier) : fallbackSubscriptionTier(role);
}

function verificationRank(status: string | null | undefined): number {
  return { none: 0, email: 1, identity: 2, academic: 3 }[status ?? 'none'] ?? 0;
}

function fallbackState(role: UserRole): AccountState {
  if (PROGRAMME_STUDENT_ROLES.includes(role)) {
    return 'enrolled';
  }

  return PENDING_APPROVAL_ROLES.includes(role) ? 'applicant' : 'active';
}

function fallbackVerification(role: UserRole): VerificationStatus {
  return ([ROLE.ADMIN, ROLE.LECTURER, ROLE.RESEARCHER, ROLE.INSTRUCTOR] as readonly UserRole[]).includes(role) ? 'identity' : 'email';
}

function fallbackProfileCompleted(role: UserRole): boolean {
  return !PENDING_APPROVAL_ROLES.includes(role);
}

function fallbackSubscription(role: UserRole): SubscriptionStatus {
  if (PREMIUM_STUDENT_ROLES.includes(role)) {
    return 'active';
  }

  if ([...FREE_STUDENT_ROLES, ...CERTIFICATE_STUDENT_ROLES].includes(role)) {
    return 'free';
  }

  return 'none';
}

function fallbackSubscriptionTier(role: UserRole): SubscriptionTier {
  if (PROGRAMME_STUDENT_ROLES.includes(role)) {
    return 'programme';
  }

  if (role === ROLE.PREMIUM_STUDENT) {
    return 'premium';
  }

  if (CERTIFICATE_STUDENT_ROLES.includes(role)) {
    return 'certificate';
  }

  if (FREE_STUDENT_ROLES.includes(role)) {
    return 'freemium';
  }

  return 'none';
}

function fallbackEntitlements(role: UserRole): EntitlementCode[] {
  switch (role) {
    case ROLE.ADMIN:
    case ROLE.EXAM_OFFICER:
      return ['admin_portal'];
    case ROLE.LECTURER:
      return ['teaching'];
    case ROLE.RESEARCHER:
      return ['research_portal'];
    case ROLE.INSTRUCTOR:
      return ['teaching'];
    case ROLE.EMPLOYER:
      return ['employer_portal'];
    case ROLE.PROGRAMME_STUDENT:
    case ROLE.ENROLLED:
      return ['student_portal', 'course_access', 'ai_tutor', 'programme-access', 'premium-access', 'certificate-access', 'short-course-access'];
    case ROLE.PREMIUM_STUDENT:
      return ['student_portal', 'course_access', 'ai_tutor', 'premium-access', 'certificate-access', 'short-course-access'];
    case ROLE.CERTIFICATE_STUDENT:
    case ROLE.PAID_CERTIFICATE_STUDENT:
      return ['student_portal', 'course_access', 'certificate-access', 'short-course-access'];
    case ROLE.STUDENT:
    case ROLE.FREE_STUDENT:
    case ROLE.FREEMIUM_STUDENT:
      return ['student_portal', 'short-course-access'];
    default:
      return [];
  }
}

function hasEntitlement(actual: readonly string[], required: EntitlementCode): boolean {
  const aliases: Record<EntitlementCode, readonly string[]> = {
    student_portal: ['student_portal', 'short-course-access', 'certificate-access', 'premium-access', 'programme-access'],
    course_access: ['course_access', 'short-course-access', 'certificate-access', 'premium-access', 'programme-access'],
    ai_tutor: ['ai_tutor', 'premium-access', 'programme-access'],
    teaching: ['teaching'],
    research_portal: ['research_portal'],
    employer_portal: ['employer_portal'],
    admin_portal: ['admin_portal'],
    'short-course-access': ['short-course-access'],
    'certificate-access': ['certificate-access'],
    'premium-access': ['premium-access'],
    'programme-access': ['programme-access'],
  };

  return aliases[required].some((code) => actual.includes(code));
}
