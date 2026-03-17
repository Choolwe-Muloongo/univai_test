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
  isCore?: boolean;
  track?: string | null;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  schoolId: string;
  schoolName?: string | null;
  deliveryMode?: string | null;
  campus?: string | null;
  intakeId?: string | null;
  curriculumVersion?: { id: string; name: string; status: string } | null;
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
};

export type CourseSession = {
  id: number;
  courseId: string;
  intakeId?: string | null;
  title: string;
  sessionType?: string | null;
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
  status: string;
  dueDate?: string | null;
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

export type ResearchApplication = {
  id: number;
  fullName: string;
  email: string;
  experience?: string | null;
  availability?: string | null;
  status: string;
  createdAt?: string | null;
};
