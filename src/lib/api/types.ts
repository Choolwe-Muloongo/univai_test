
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

export type School = {
  id: string;
  name: string;
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
  supportedDeliveryModes?: string[];
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

export type ProgramPayload = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  qualificationLevelId: string;
  credits?: number | null;
  durationMonths?: number | null;
  admissionRequirements?: string | null;
  deliveryModes?: string[];
  examClinicRequired?: boolean;
  requiresAccreditationApproval?: boolean;
  accreditationApproved?: boolean;
  launchStatus?: string;
  imageId?: string | null;
};

export type ProgramModule = {
  id: string;
  code?: string | null;
  title: string;
  description: string;
  credits: number;
  hoursPerWeek?: number | null;
  progress: number;
  semester: number;
  isExamAvailable: boolean;
  supportedDeliveryModes?: string[];
  isCore?: boolean;
  track?: string | null;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  schoolName?: string | null;
  qualificationLevelId?: string | null;
  qualificationLevel?: QualificationLevel | null;
  credits?: number | null;
  durationMonths?: number | null;
  admissionRequirements?: string | null;
  deliveryModes?: string[];
  deliveryMode?: string | null;
  supportedDeliveryModes?: string[];
  campus?: string | null;
  intakeId?: string | null;
  curriculumVersion?: { id: string; name: string; status: string } | null;
  examClinicRequired?: boolean;
  requiresAccreditationApproval?: boolean;
  accreditationApprovedAt?: string | null;
  launchStatus?: string | null;
  progress: number;
  imageId: string;
  modules: ProgramModule[];
};

export type Lesson = {
  id: string;
  title: string;
  content: string;
  videoUrl?: string | null;
  exercise?: string | null;
  quiz?: LessonQuiz | null;
  learningObjects?: LearningObject[];
};

export type LearningObject = {
  id: string;
  type: 'content' | 'video' | 'quiz' | 'exercise' | 'slides' | 'flashcards' | 'document' | 'rubric' | string;
  title: string;
  description?: string | null;
  body?: string | null;
  assetUrl?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  payload?: Record<string, any> | null;
  accessRules?: Record<string, any> | null;
  version: number;
  versionLabel?: string | null;
  isCurrent: boolean;
  isReusable: boolean;
  reviewStatus: string;
  publicationStatus: string;
  position?: number | null;
  isRequired?: boolean | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  publishedAt?: string | null;
};

export type LessonQuiz = {
  title?: string | null;
  questions?: Array<{
    question: string;
    options: string[];
    answer?: string;
  }>;
};

export type LessonWithCourseId = Lesson & { courseId: string };

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description?: string | null;
};

export type ResearchOpportunity = {
  id: string;
  title: string;
  company: string;
  description: string;
  field: string;
};

export type DiscussionComment = {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  upvotes: number;
};

export type Discussion = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  snippet: string;
  comments: DiscussionComment[];
  timestamp: string;
};

export type ConsultantApplication = {
  id: string;
  name: string;
  department: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  avatar: string;
  documents: {
    cv: string;
    id: string;
  };
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type LeaderboardStudent = {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  school: string;
  points: number;
};

export type AdmissionsSettings = {
  isOpen: boolean;
  message?: string | null;
};

export type AcademicPolicy = {
  id: number;
  name: string;
  pass_mark: number;
  exam_minimum?: number | null;
  gpa_scale_type: string;
  grade_bands: Array<{ min: number; max: number; letter: string; points: number }>;
  repeat_rule: string;
  max_attempts: number;
  include_failed_in_gpa: boolean;
  include_withdrawn_in_gpa: boolean;
  credit_award_policy: string;
  condoned_mark?: number | null;
  progression_policy?: Record<string, unknown> | null;
  holds_policy?: Record<string, unknown> | null;
  rounding_decimals: number;
};

export type ProgramPolicyAssignment = {
  program_id: string;
  policy_id: number;
};

export type CurriculumPolicyAssignment = {
  curriculum_version_id: string;
  policy_id: number;
};

export type LecturerStudent = {
  id: number;
  name: string;
  email: string;
  programId?: string | null;
  intakeId?: string | null;
  avatar?: string | null;
  progress?: number | null;
  gpa?: number | null;
  standing?: string | null;
};

export type StudentGrade = {
  moduleId: string;
  moduleTitle?: string | null;
  semester?: number | null;
  credits?: number | null;
  finalPercentage?: number | null;
  letterGrade?: string | null;
  status?: string | null;
  resultStatus?: string | null;
  attempt?: number | null;
  recordedAt?: string | null;
};

export type StudentGradesResponse = {
  policy?: {
    id?: number | null;
    name?: string | null;
    passMark?: number | null;
    repeatRule?: string | null;
  } | null;
  gpa: number;
  creditsAttempted: number;
  creditsEarned: number;
  standing: string;
  probationCount?: number;
  grades: StudentGrade[];
};

export type StudentAssignment = {
  id: number;
  title: string;
  description: string;
  instructions?: string | null;
  moduleId: string;
  moduleTitle?: string | null;
  courseId?: string | null;
  assignmentType: string;
  maxPoints: number;
  dueDate?: string | null;
  status: string;
  submissionStatus?: string | null;
  grade?: number | null;
  submittedAt?: string | null;
};

export type StudentAssignmentDetail = StudentAssignment & {
  submission?: {
    id: number;
    status: string;
    grade?: number | null;
    feedback?: string | null;
    content?: string | null;
    attachmentUrl?: string | null;
    submittedAt?: string | null;
  } | null;
};

export type StudentAssignmentSubmission = {
  id: number;
  assignmentId: number;
  assignmentTitle?: string | null;
  moduleTitle?: string | null;
  status: string;
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
};

export type ExamQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export type ExamQuestionRecord = {
  id: number;
  courseId?: string | null;
  semester?: number | null;
  question: string;
  options: string[];
  answer?: string | null;
};

export type ApplicationPayload = {
  fullName: string;
  email: string;
  programId: string;
  schoolId: string;
  deliveryMode: string;
  learningStyle: string;
  studyPace: string;
  country: string;
  subjectPoints: Record<string, string>;
};

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'fee_paid'
  | 'under_review'
  | 'needs_info'
  | 'offer_sent'
  | 'approved'
  | 'rejected'
  | 'admitted';

export type ApplicationSummary = {
  id: string;
  fullName: string;
  email: string;
  programId: string;
  intakeId?: string | null;
  schoolId: string;
  status: ApplicationStatus;
  submittedAt: string;
  subjectCount: number;
  totalPoints: number;
};

export type ApplicationDetail = ApplicationSummary & {
  deliveryMode: string;
  learningStyle: string;
  studyPace: string;
  country: string;
  subjectPoints: Record<string, string>;
  notes?: string;
  admissionFeePaid?: boolean;
  offerLetterMessage?: string | null;
  offerLetterUrl?: string | null;
  offerIssuedAt?: string | null;
  offerAcceptedAt?: string | null;
  needsInfoMessage?: string | null;
  needsInfoAt?: string | null;
};

export type ApplicationDocument = {
  id: number;
  documentType: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  status: string;
  reviewNotes?: string | null;
  createdAt?: string | null;
};

export type CreateJobPayload = {
  title: string;
  company: string;
  location: string;
  type: string;
  description?: string;
};

export type CreateResearchPayload = {
  title: string;
  company: string;
  field: string;
  description: string;
};

export type CreateDiscussionPayload = {
  title: string;
  category?: string;
  details: string;
};

export type JobApplicationPayload = {
  fullName: string;
  email: string;
  portfolio?: string;
  coverLetter?: string;
};

export type ResearchApplicationPayload = {
  fullName: string;
  email: string;
  experience?: string;
  availability?: string;
};

export type DashboardMetric = {
  key: string;
  label: string;
  value: string;
  note?: string | null;
};

export type StudentDashboardAction = {
  id: number;
  title: string;
  description: string;
  href: string;
};

export type StudentDashboardDeadline = {
  id: number;
  title: string;
  type: string;
  date: string;
};

export type StudentDashboardWallet = {
  label: string;
  value: string;
  note?: string;
  cashbackEligible?: boolean;
};

export type StudentDashboardData = {
  actions: StudentDashboardAction[];
  deadlines: StudentDashboardDeadline[];
  wallet?: StudentDashboardWallet;
};

export type LecturerDashboardCourse = {
  id: string;
  title: string;
  studentCount: number;
  avgProgress: number;
  intakeId?: string | null;
  intakeName?: string | null;
};

export type LecturerDashboardData = {
  metrics: DashboardMetric[];
  managedCourses: LecturerDashboardCourse[];
};

export type Intake = {
  id: string;
  programId: string;
  curriculumVersionId?: string | null;
  name: string;
  deliveryMode: string;
  supportedDeliveryModes?: string[];
  campus?: string | null;
  capacity?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
};

export type CurriculumVersion = {
  id: string;
  programId: string;
  name: string;
  status: string;
  publishedAt?: string | null;
};

export type CurriculumModule = {
  id: string;
  code?: string | null;
  title: string;
  description: string;
  credits?: number | null;
  hoursPerWeek?: number | null;
  semester: number;
  isCore: boolean;
  supportedDeliveryModes?: string[];
  track?: string | null;
};

export type ModulePrerequisite = {
  moduleId: string;
  prerequisiteId: string;
  prerequisiteTitle?: string | null;
};

export type LecturerAssignment = {
  id: number;
  courseId: string;
  courseTitle?: string | null;
  courseDescription?: string | null;
  moduleId?: string | null;
  moduleTitle?: string | null;
  moduleSemester?: number | null;
  programId?: string | null;
  intakeId?: string | null;
  intakeName?: string | null;
  deliveryMode?: string | null;
  supportedDeliveryModes?: string[];
  campus?: string | null;
  role?: string | null;
  meetingProvider?: string | null;
  meetingUrl?: string | null;
  meetingSchedule?: Record<string, unknown> | null;
  meetingNotes?: string | null;
};

export type AdminAssignment = {
  id: number;
  courseId: string;
  courseTitle?: string | null;
  moduleId?: string | null;
  moduleTitle?: string | null;
  moduleSemester?: number | null;
  programId?: string | null;
  lecturerId: string;
  lecturerName?: string | null;
  intakeId?: string | null;
  intakeName?: string | null;
  role?: string | null;
  meetingProvider?: string | null;
  meetingUrl?: string | null;
};

export type AdminAssignmentsResponse = {
  assignments: AdminAssignment[];
  lecturers: { id: string; name: string; email: string }[];
  courses: { id: string; title: string; schoolId: string }[];
  modules: { id: string; programId: string; title: string; semester: number }[];
  intakes: Intake[];
};

export type LecturerApplication = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  specialization?: string | null;
  highestQualification?: string | null;
  yearsExperience?: number | null;
  programInterest?: string | null;
  documents?: Record<string, string> | null;
  status: string;
  notes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  login?: { email: string; temporaryPassword: string } | null;
};

export type AiResponse = {
  text: string;
  error?: string;
  details?: unknown;
};

export type LessonDocument = {
  id: number;
  lessonId: string;
  learningObjectId?: string | null;
  intakeId?: string | null;
  fileName: string;
  mimeType?: string | null;
  extractedText?: string | null;
  status?: string | null;
  source?: string | null;
  approvedAt?: string | null;
  reviewNotes?: string | null;
  createdAt?: string | null;
};

export type CourseMeeting = {
  courseId: string;
  intakeId?: string | null;
  lecturerName?: string | null;
  meetingProvider?: string | null;
  meetingUrl?: string | null;
  meetingSchedule?: Record<string, unknown> | null;
  meetingNotes?: string | null;
  deliveryMode?: string | null;
};

export type CourseSession = {
  id: number;
  courseId: string;
  intakeId?: string | null;
  title: string;
  sessionType?: string | null;
  deliveryMode?: string | null;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  status?: string | null;
  courseTitle?: string | null;
};

export type SessionRosterStudent = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type Invoice = {
  id: number;
  title: string;
  amount: string;
  paidAmount: string;
  currency?: string;
  status: string;
  type?: string;
  dueDate?: string | null;
  deliveryMode?: string | null;
  feePolicy?: string | null;
};

export type Payment = {
  id: number;
  invoiceId: number;
  amount: string;
  method: string;
  status: string;
  paidAt?: string | null;
};

export type EnrollmentData = {
  status: string;
  intakeId?: string | null;
  selectedModules?: string[];
  deliveryMode?: string | null;
  enrolledAt?: string | null;
  confirmedAt?: string | null;
};

export type RouteChangeRequest = {
  id: number;
  studentId: number;
  studentName?: string | null;
  studentEmail?: string | null;
  currentIntakeId?: string | null;
  currentIntakeName?: string | null;
  requestedIntakeId: string;
  requestedIntakeName?: string | null;
  reason?: string | null;
  status: string;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

export type ExamResultsMap = Record<string, unknown>;

export type AuditLogEntry = {
  id: number;
  actorId?: number | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt?: string | null;
};

export type EmployerDashboardJob = {
  id: string;
  title: string;
  status: string;
  applicants: number;
};

export type EmployerDashboardData = {
  stats: {
    activeJobs: { value: number; note?: string };
    activeResearch: { value: number; note?: string };
    totalApplicants: { value: number; note?: string };
  };
  postedJobs: EmployerDashboardJob[];
  research: {
    id: string;
    title: string;
    field: string;
    description: string;
  }[];
};

export type AdminDashboardData = {
  metrics: DashboardMetric[];
};

export type SupportMessage = {
  id: number;
  author: string;
  role: string;
  message: string;
  createdAt?: string | null;
};

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  category?: string | null;
  priority: string;
  status: string;
  createdAt?: string | null;
  messages?: SupportMessage[];
};

export type WalletSettings = {
  walletAddress?: string | null;
  payoutCurrency?: string | null;
  status?: string | null;
  cashbackEligible?: boolean;
};

export type StudentEntitlementsResponse = {
  accessTier: string;
  entitlements: string[];
  cashbackEligible: boolean;
};

export type PaymentMethod = {
  id: number;
  type: string;
  provider: string;
  last4: string;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault?: boolean;
  status?: string;
};

export type ScholarshipApplication = {
  id: number;
  programId?: string | null;
  statement: string;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  decisionNotes?: string | null;
};

export type PortfolioItem = {
  id: number;
  title: string;
  description?: string | null;
  link?: string | null;
  itemType?: string | null;
  status: string;
  createdAt?: string | null;
};

export type FinanceReportRow = {
  label: string;
  amount: string;
  status: string;
};

export type IncidentLifecycleStep = {
  key: 'acknowledge' | 'assign' | 'mitigate' | 'notify_affected_roles' | 'resolve' | 'postmortem';
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string | null;
};

export type IncidentTimelineUpdate = {
  at: string;
  actor: string;
  message: string;
};

export type QueueImpact = {
  queue: string;
  module: string;
  backlog: number;
  delayedByMinutes: number;
  status: 'degraded' | 'blocked' | 'recovering';
};

export type SystemHealthIncident = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
  eta: string;
  communicationStatus: string;
  impactedModules: string[];
  affectedQueues: QueueImpact[];
  lifecycle: IncidentLifecycleStep[];
  timelineUpdates: IncidentTimelineUpdate[];
};


export type LaunchCapabilityStatus = {
  label: string;
  ready: boolean;
  routes: Record<string, boolean>;
  permissions: Record<string, boolean>;
};

export type LaunchReadinessReport = {
  version: string;
  launchProfile: string;
  releaseState: string;
  readyForV1Launch: boolean;
  targetRegisteredUsers: number;
  targetConcurrentUsers: number;
  capabilities: Record<string, LaunchCapabilityStatus>;
  missingRoutes: string[];
  missingPermissions: string[];
  publicContentRule: string;
};

export type SystemHealthData = {
  uptime: string;
  incidents: number;
  apiRequests: number;
  dbThroughput: string;
  services: Array<{ name: string; status: string }>;
  utilization: {
    apiThroughput: number;
    dbLoad: number;
    queueLatency: number;
  };
  incidentLifecycleGuide: IncidentLifecycleStep[];
  incidentQueueDirectory: QueueImpact[];
  incidentRecords: SystemHealthIncident[];
  launchReadiness?: LaunchReadinessReport;
};

export type ResearchApplication = {
  id: number;
  fullName: string;
  email: string;
  experience?: string | null;
  availability?: string | null;
  status: string;
  createdAt?: string | null;
};

export type ExamCentre = {
  id: number;
  name: string;
  code: string;
  location: string;
  timezone: string;
  capacity: number;
  approvalStatus: string;
  approvalNotes?: string | null;
  approvedAt?: string | null;
  roomsCount?: number | null;
  sessionsCount?: number | null;
};

export type ExamRoom = {
  id: number;
  centreId: number;
  centreName?: string | null;
  name: string;
  code?: string | null;
  capacity: number;
  accessibilityNotes?: string | null;
  equipment: string[];
  status: string;
};

export type ExamInvigilator = {
  id: number;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  certifications: string[];
  status: string;
};

export type ExamClinicSession = {
  id: number;
  centreId: number;
  centreName?: string | null;
  roomId?: number | null;
  roomName?: string | null;
  invigilatorId?: number | null;
  invigilatorName?: string | null;
  examId: string;
  title: string;
  programId?: string | null;
  moduleId?: string | null;
  courseId?: string | null;
  deliveryMode: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookingsCount: number;
  incidentsCount?: number | null;
  status: string;
  rules: string[];
};

export type ExamBooking = {
  id: number;
  sessionId: number;
  studentId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  status: string;
  accommodations?: string | null;
  bookedAt?: string | null;
  session?: ExamClinicSession | null;
  attendance?: {
    id: number;
    status: string;
    checkedInAt?: string | null;
    checkedOutAt?: string | null;
    notes?: string | null;
  } | null;
};

export type ExamIncident = {
  id: number;
  sessionId: number;
  bookingId?: number | null;
  severity: string;
  category: string;
  description: string;
  status: string;
  reportedBy?: string | null;
  actions: string[];
  createdAt?: string | null;
  sessionTitle?: string | null;
};

export type ExamResultsSyncLog = {
  id: number;
  sessionId?: number | null;
  sessionTitle?: string | null;
  status: string;
  recordsSynced: number;
  message?: string | null;
  syncedAt?: string | null;
  triggeredBy?: string | null;
};

export type ExamClinicOverview = {
  centres: ExamCentre[];
  rooms: ExamRoom[];
  invigilators: ExamInvigilator[];
  sessions: ExamClinicSession[];
  bookings: ExamBooking[];
  incidents: ExamIncident[];
  resultsSync: ExamResultsSyncLog[];
};
