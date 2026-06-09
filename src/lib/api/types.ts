export type RoleCapabilities = {
  dashboard: string;
  canManageStudents: boolean;
  canManageAdmissions: boolean;
  canOpenCloseLecturerApplications: boolean;
  canApproveLecturers: boolean;
  canApproveEmployers: boolean;
  canManageSubscriptions: boolean;
  canSuspendUsers: boolean;
  canCreateAdmins: boolean;
  reports: string[];
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountState?: string | null;
  verificationStatus?: string | null;
  profileCompleted?: boolean | null;
  subscriptionStatus?: string | null;
  subscriptionTier?: string | null;
  entitlements?: string[] | null;
  schoolId?: string | null;
  programId?: string | null;
  intakeId?: string | null;
  unit: string;
  notes?: string | null;
  capabilities?: RoleCapabilities | null;
  mustChangePassword?: boolean | null;
  passwordResetByAdminAt?: string | null;
};

export type AdminUserNote = {
  id: number;
  note: string;
  adminName: string;
  createdAt?: string | null;
};

export type AdminUserInvoice = {
  id: number;
  title: string;
  description?: string | null;
  amount: string;
  currency: string;
  paidAmount: string;
  status: string;
  type?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  payments?: AdminUserPayment[];
};

export type AdminUserPayment = {
  id: number;
  invoiceId: number;
  amount: string;
  currency: string;
  method?: string | null;
  provider?: string | null;
  reference?: string | null;
  status: string;
  isTest: boolean;
  paymentMode?: string | null;
  paidAt?: string | null;
};

export type AdminUserPaymentsResponse = {
  invoices: AdminUserInvoice[];
  payments: AdminUserPayment[];
};

export type AdminUsersResponse = {
  data: ManagedUser[];
  roleCapabilities: Record<string, RoleCapabilities>;
  permissions: Record<string, unknown>;
};

export type CreateManagedUserPayload = {
  name: string;
  email: string;
  role: string;
  state?: string;
  accountState?: string;
  verificationStatus?: string;
  schoolId?: string | null;
  programId?: string | null;
  intakeId?: string | null;
  unit?: string;
  notes?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  entitlements?: string[];
};

export type AdmissionStatus = {
  status: string;
  admissionFeePaid: boolean;
  offerIssuedAt?: string | null;
  offerAcceptedAt?: string | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  schoolId?: string | null;
  programId?: string | null;
  intakeId?: string | null;
  accountState?: string | null;
  verificationStatus?: string | null;
  profileCompleted?: boolean | null;
  profileStarted?: boolean | null;
  subscriptionStatus?: string | null;
  subscriptionTier?: string | null;
  entitlements?: string[] | null;
};

export type Session = {
  user: SessionUser | null;
};

export type AccountProfile = {
  displayName?: string | null;
  phone?: string | null;
  country?: string | null;
  timezone?: string | null;
  bio?: string | null;
  avatar?: string | null;
};

export type AccountProfileResponse = {
  user: SessionUser | null;
  profile: AccountProfile;
};

export type School = {
  id: string;
  name: string;
};

export type Department = {
  id: number;
  schoolId: string;
  schoolName?: string | null;
  name: string;
  description?: string | null;
  headOfDepartmentId?: number | null;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  progress?: number | null;
  imageId: string;
  certificateType?: string;
  pricingType?: string;
  price?: string | number | null;
  currency?: string | null;
  certificateFee?: string | number | null;
  certificateCurrency?: string | null;
  durationHours?: number | null;
  level?: string | null;
  status?: 'draft' | 'published' | string | null;
  modules?: Array<{ title: string; description?: string | null }>;
  lessons?: Array<{ title: string; summary?: string | null }>;
  outcomes?: string[];
  supportedDeliveryModes?: string[];
};

export type CoursePayload = Omit<Course, 'supportedDeliveryModes'>;

export type AiShortCourseLesson = {
  title: string;
  summary: string;
  durationMinutes: number;
  outcomes: string[];
  activities: string[];
  assessment: string;
};

export type AiShortCourseModule = {
  title: string;
  description: string;
  durationMinutes: number;
  outcomes: string[];
  lessons: AiShortCourseLesson[];
  moduleAssessment: string;
};

export type AiShortCourseBlueprint = {
  courseSummary: {
    title: string;
    audience: string;
    level: string;
    description: string;
    prerequisites: string[];
    totalDurationHours: number;
    outcomes: string[];
    finalAssessment: string;
    certificateCriteria: string;
  };
  assessments: {
    quizzes: string[];
    practicalWork: string[];
    instructorReviewChecklist: string[];
  };
  modules: AiShortCourseModule[];
};

export type ShortCourseDraftCreatePayload = {
  course: CoursePayload;
  blueprint: AiShortCourseBlueprint;
  sourceMode: 'new' | 'programme-course';
  programmeTitle?: string | null;
  programmeCourseTitle?: string | null;
};

export type QualificationLevel = {
  id: string;
  name: string;
  category: string;
  defaultCredits: number;
  minimumCredits: number;
  maximumCredits?: number | null;
  durationMonths: number;
  admissionRequirements?: string | null;
  allowedDeliveryModes: string[];
  requiresExamClinic: boolean;
  requiresAccreditationApproval: boolean;
  minimumSubjectCount: number;
  minimumTotalPoints: number;
  requiredPriorQualification?: string | null;
};

export type RequiredSubject = {
  subjectId: string;
  subjectName: string;
  minimumPoints?: number | null;
};

export type ProgramPayload = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  departmentId?: number | null;
  qualificationLevelId: string;
  credits?: number | null;
  durationMonths?: number | null;
  admissionRequirements?: string | null;
  requiredSubjects?: RequiredSubject[];
  deliveryModes?: string[];
  examClinicRequired?: boolean;
};
