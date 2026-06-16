import { apiFetch, buildApiUrl } from '@/lib/api/client';
import type {
  AdmissionStatus,
  AccountProfileResponse,
  AdmissionsSettings,
  Badge,
  ApplicationDetail,
  ApplicationPayload,
  ApplicationStatus,
  ApplicationSummary,
  ApplicationDocument,
  ConsultantApplication,
  Course,
  CoursePayload,
  AcademicYear,
  AdminAcademicStructureResponse,
  CreateJobPayload,
  CreateResearchPayload,
  CreateDiscussionPayload,
  CurriculumModule,
  CurriculumPolicyAssignment,
  CurriculumVersion,
  DiscussionComment,
  Discussion,
  JobApplicationPayload,
  Job,
  Lesson,
  LessonWithCourseId,
  LeaderboardStudent,
  ResearchApplicationPayload,
  ResearchOpportunity,
  School,
  Session,
  StudentDashboardData,
  LecturerDashboardData,
  EmployerDashboardData,
  AdminDashboardData,
  Intake,
  LecturerAssignment,
  AdminAssignmentsResponse,
  LessonDocument,
  CourseMeeting,
  AuditLogEntry,
  ModulePrerequisite,
  CourseSession,
  CourseUnit,
  Department,
  SessionRosterStudent,
  Invoice,
  Payment,
  EnrollmentData,
  ExamQuestion,
  ExamQuestionRecord,
  DocumentBrandingSettings,
  ExamResultsMap,
  AcademicPolicy,
  ProgramPolicyAssignment,
  LecturerStudent,
  StudentGradesResponse,
  StudentAssignment,
  StudentAssignmentDetail,
  StudentAssignmentSubmission,
  RouteChangeRequest,
  Program,
  ProgramModule,
  ProgramPayload,
  QualificationLevel,
  SupportTicket,
  SupportMessage,
  WalletSettings,
  PaymentMethod,
  PaymentSettings,
  ScholarshipApplication,
  ShortCourseDraftCreatePayload,
  PortfolioItem,
  FinanceReportRow,
  AffiliateOverview,
  AffiliateRecord,
  AffiliatePayout,
  ResearchApplication,
  LecturerApplication,
  AiResponse,
  SystemHealthData,
  LaunchReadinessReport,
  ExamCentre,
  ExamRoom,
  ExamInvigilator,
  ExamClinicSession,
  ExamBooking,
  ExamIncident,
  ExamResultsSyncLog,
  ExamClinicOverview,
  StudentEntitlementsResponse,
  AdminUsersResponse,
  CreateManagedUserPayload,
  ManagedUser,
  LearningModeRule,
  PartnerInstitution,
  PracticalSession,
  PlatformExpansionOverview,
  PlatformOperationsOverview,
  ProgrammeCourse,
  Semester,
  Venue,
} from '@/lib/api/types';


export async function getAdminUsers(params: { role?: string; state?: string; search?: string } = {}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.state) query.set('state', params.state);
  if (params.search) query.set('search', params.search);
  return apiFetch(`/admin/users${query.toString() ? `?${query.toString()}` : ''}`);
}

export async function createManagedUser(payload: CreateManagedUserPayload): Promise<ManagedUser> {
  return apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateManagedUser(id: string, payload: Partial<CreateManagedUserPayload & { profileCompleted: boolean }>): Promise<ManagedUser> {
  return apiFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function transitionManagedUser(id: string, toState: string, reason?: string): Promise<ManagedUser> {
  return apiFetch(`/admin/users/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ toState, reason }),
  });
}


export type ShortCourseProgress = {
  status: string;
  entryFeePaid: boolean;
  certificateFeePaid: boolean;
  completedLessons: string[];
  progress: number;
  examScore?: string | number | null;
  completedAt?: string | null;
  certificateIssuedAt?: string | null;
};

export type PaymentInitiation = {
  invoiceId?: number;
  checkout_url?: string | null;
  checkoutUrl?: string | null;
  reference?: string;
  status?: string;
  testMode?: boolean;
  message?: string;
};

export async function enrollShortCourse(courseId: string): Promise<PaymentInitiation> {
  return apiFetch(`/students/me/short-courses/${courseId}/enroll`, { method: 'POST' });
}

export async function getShortCourseProgress(courseId: string): Promise<ShortCourseProgress> {
  return apiFetch(`/students/me/short-courses/${courseId}/progress`);
}

export async function completeShortCourseLesson(courseId: string, lessonId: string): Promise<{ progress: number; completedLessons: number }> {
  return apiFetch(`/students/me/short-courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST' });
}

export async function submitShortCourseExam(courseId: string, answers: string[]): Promise<{ score: number; passed: boolean }> {
  return apiFetch(`/students/me/short-courses/${courseId}/exam`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function payShortCourseCertificate(courseId: string): Promise<PaymentInitiation> {
  return apiFetch(`/students/me/short-courses/${courseId}/certificate/pay`, { method: 'POST' });
}


export async function getSchools(): Promise<School[]> {
  return apiFetch('/schools');
}

export async function getCourses(): Promise<Course[]> {
  return apiFetch('/courses');
}

export async function getPrograms(): Promise<Program[]> {
  return apiFetch('/programs');
}

export async function getQualificationLevels(): Promise<QualificationLevel[]> {
  return apiFetch('/admin/qualification-levels');
}

export async function getAdminAcademicStructure(): Promise<AdminAcademicStructureResponse> {
  return apiFetch('/admin/academic-structure');
}

export async function createDepartment(payload: {
  schoolId: string;
  name: string;
  description?: string | null;
  headOfDepartmentId?: number | null;
}): Promise<Department> {
  return apiFetch('/admin/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAcademicYear(payload: {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}): Promise<AcademicYear> {
  return apiFetch('/admin/academic-years', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
