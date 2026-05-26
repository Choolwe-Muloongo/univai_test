export type AuthRole =
  | 'student'
  | 'free-student'
  | 'paid-certificate-student'
  | 'premium-student'
  | 'programme-student'
  | 'applicant'
  | 'lecturer'
  | 'instructor'
  | 'admin'
  | 'employer'
  | (string & {});

export type RoleKey = 'student' | 'lecturer' | 'instructor' | 'admin' | 'employer';

export type AuthRouteUser = {
  role?: AuthRole | null;
  accountState?: string | null;
  profileCompleted?: boolean | null;
  programId?: string | null;
  intakeId?: string | null;
};

export type RoleIntentOption = {
  key: RoleKey;
  label: string;
  description: string;
  loginPath: string;
  recommendedGoal: string;
};

export type OnboardingChecklist = {
  role: RoleKey;
  title: string;
  steps: string[];
};

const roleIntentOptions: RoleIntentOption[] = [
  {
    key: 'student',
    label: 'Student',
    description: 'Apply, enroll, and manage your learning journey.',
    loginPath: '/login',
    recommendedGoal: 'Complete admissions and begin classes',
  },
  {
    key: 'lecturer',
    label: 'Lecturer',
    description: 'Manage classes, grading, and student progress.',
    loginPath: '/login/lecturer',
    recommendedGoal: 'Track your lecturer application and teach',
  },
  {
    key: 'instructor',
    label: 'Instructor',
    description: 'Create and monetize short courses with AI-assisted tools.',
    loginPath: '/login/instructor',
    recommendedGoal: 'Publish your courses and manage instructor AI tools',
  },
  {
    key: 'employer',
    label: 'Employer',
    description: 'Build your profile and post opportunities.',
    loginPath: '/login/employer',
    recommendedGoal: 'Complete employer profile and post openings',
  },
];

const onboardingByRole: Record<RoleKey, OnboardingChecklist> = {
  student: {
    role: 'student',
    title: 'Student onboarding path',
    steps: ['Admissions', 'Fee', 'Offer', 'Enrollment', 'Dashboard'],
  },
  lecturer: {
    role: 'lecturer',
    title: 'Lecturer onboarding path',
    steps: ['Application', 'Approval status', 'Dashboard'],
  },
  instructor: {
    role: 'instructor',
    title: 'Instructor onboarding path',
    steps: ['Application', 'Approval status', 'Instructor dashboard'],
  },
  admin: {
    role: 'admin',
    title: 'Admin onboarding path',
    steps: ['Setup', 'Governance tools'],
  },
  employer: {
    role: 'employer',
    title: 'Employer onboarding path',
    steps: ['Profile completion', 'Posting capability'],
  },
};

const admissionsStates = ['applicant', 'needs_information', 'needs_info', 'submitted', 'under_review', 'accepted', 'offer_sent'];
const enrolledStates = ['active', 'enrolled', 'probation'];
const studentRoles = ['student', 'free-student', 'freemium-student', 'paid-certificate-student', 'certificate-student', 'premium-student', 'programme-student', 'program-student', 'enrolled'];

const postAuthRules: Array<{ matches: (user: AuthRouteUser) => boolean; destination: string }> = [
  {
    matches: (user) => user.role === 'applicant' || admissionsStates.includes(user.accountState ?? ''),
    destination: '/admissions/status',
  },
  {
    matches: (user) => Boolean(user.role && studentRoles.includes(user.role)) && enrolledStates.includes(user.accountState ?? 'active'),
    destination: '/student/dashboard',
  },
  { matches: (user) => user.role === 'lecturer', destination: '/lecturer/dashboard' },
  { matches: (user) => user.role === 'instructor', destination: '/instructor/dashboard' },
  { matches: (user) => user.role === 'admin', destination: '/admin/dashboard' },
  { matches: (user) => user.role === 'employer', destination: '/employer/dashboard' },
];

export function getRoleIntentOptions() {
  return roleIntentOptions;
}

export function getPostAuthDestination(userOrRole: AuthRole | AuthRouteUser | null | undefined) {
  if (!userOrRole) {
    return '/start';
  }

  const user: AuthRouteUser = typeof userOrRole === 'string' ? { role: userOrRole } : userOrRole;
  const matchedRule = postAuthRules.find((rule) => rule.matches(user));
  return matchedRule?.destination ?? '/start';
}

export function getOnboardingChecklist(role: RoleKey) {
  return onboardingByRole[role];
}

export function getAllOnboardingChecklists() {
  return roleIntentOptions.map((option) => onboardingByRole[option.key]);
}

export function getGuidedRecommendationsByGoal() {
  return roleIntentOptions.map((option) => ({
    role: option.label,
    goal: option.recommendedGoal,
    href: option.loginPath,
  }));
}