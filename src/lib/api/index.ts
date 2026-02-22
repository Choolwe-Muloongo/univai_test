import { apiFetch, API_BASE_URL } from '@/lib/api/client';
import type {
  AdmissionStatus,
  AdmissionsSettings,
  Badge,
  ApplicationDetail,
  ApplicationPayload,
  ApplicationStatus,
  ApplicationSummary,
  ApplicationDocument,
  ConsultantApplication,
  Course,
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
  SessionRosterStudent,
  Invoice,
  Payment,
  EnrollmentData,
  ExamQuestion,
  ExamQuestionRecord,
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
  SupportTicket,
  SupportMessage,
  WalletSettings,
  PaymentMethod,
  ScholarshipApplication,
  PortfolioItem,
  FinanceReportRow,
  ResearchApplication,
  LecturerApplication,
  AiResponse,
} from '@/lib/api/types';

export async function getSchools(): Promise<School[]> {
  return apiFetch('/schools');
}

export async function getCourses(): Promise<Course[]> {
  return apiFetch('/courses');
}

export async function getPrograms(): Promise<Program[]> {
  return apiFetch('/programs');
}

export async function getProgramModulesByProgram(programId: string): Promise<ProgramModule[]> {
  return apiFetch(`/programs/${programId}/modules`);
}

export async function createSchool(name: string): Promise<School> {
  return apiFetch('/admin/schools', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createCourse(course: Course): Promise<Course> {
  return apiFetch('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(course),
  });
}

export async function deleteSchool(id: string): Promise<void> {
  await apiFetch(`/admin/schools/${id}`, { method: 'DELETE', parseJson: false });
}

export async function deleteCourse(id: string): Promise<void> {
  await apiFetch(`/admin/courses/${id}`, { method: 'DELETE', parseJson: false });
}

export async function getCourseById(id: string): Promise<Course | null> {
  return apiFetch(`/courses/${id}`);
}

export async function getProgram(): Promise<Program> {
  return apiFetch('/students/me/program');
}

export async function getIntakes(): Promise<Intake[]> {
  return apiFetch('/admin/intakes');
}

export async function getAvailableIntakes(): Promise<Intake[]> {
  return apiFetch('/students/me/intakes');
}

export async function createIntake(payload: Omit<Intake, 'id'>) {
  return apiFetch('/admin/intakes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurriculumVersions(programId?: string): Promise<CurriculumVersion[]> {
  const query = programId ? `?programId=${encodeURIComponent(programId)}` : '';
  return apiFetch(`/admin/curriculum/versions${query}`);
}

export async function createCurriculumVersion(payload: {
  programId: string;
  name: string;
  status?: string;
}): Promise<CurriculumVersion> {
  return apiFetch('/admin/curriculum/versions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCurriculumVersion(id: string, payload: { status: string }): Promise<CurriculumVersion> {
  return apiFetch(`/admin/curriculum/versions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getCurriculumModules(versionId: string): Promise<CurriculumModule[]> {
  return apiFetch(`/admin/curriculum/versions/${versionId}/modules`);
}

export async function createCurriculumModule(
  versionId: string,
  payload: {
    title: string;
    description: string;
    credits?: number;
    semester: number;
    isCore?: boolean;
    track?: string | null;
  }
): Promise<CurriculumModule> {
  return apiFetch(`/admin/curriculum/versions/${versionId}/modules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addModulePrerequisite(moduleId: string, prerequisiteId: string) {
  return apiFetch(`/admin/modules/${moduleId}/prerequisites`, {
    method: 'POST',
    body: JSON.stringify({ prerequisiteId }),
  });
}

export async function getModulePrerequisites(moduleId: string): Promise<ModulePrerequisite[]> {
  return apiFetch(`/admin/modules/${moduleId}/prerequisites`);
}

export async function getProgramModules(): Promise<ProgramModule[]> {
  return apiFetch('/students/me/program/modules');
}

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  return apiFetch(`/courses/${courseId}/lessons`);
}

export async function getLessonById(lessonId: string): Promise<LessonWithCourseId | null> {
  return apiFetch(`/lessons/${lessonId}`);
}

export async function getFlattenedLessons(): Promise<LessonWithCourseId[]> {
  return apiFetch('/lessons');
}

export async function getJobs(): Promise<Job[]> {
  return apiFetch('/jobs');
}

export async function getJobById(id: string): Promise<Job | null> {
  return apiFetch(`/jobs/${id}`);
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  return apiFetch('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function applyJob(jobId: string, payload: JobApplicationPayload) {
  return apiFetch(`/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getResearchOpportunities(): Promise<ResearchOpportunity[]> {
  return apiFetch('/research');
}

export async function getResearchById(id: string): Promise<ResearchOpportunity | null> {
  return apiFetch(`/research/${id}`);
}

export async function createResearch(payload: CreateResearchPayload): Promise<ResearchOpportunity> {
  return apiFetch('/research', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function applyResearch(opportunityId: string, payload: ResearchApplicationPayload) {
  return apiFetch(`/research/${opportunityId}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getResearchApplications(opportunityId: string): Promise<ResearchApplication[]> {
  return apiFetch(`/research/${opportunityId}/applications`);
}

export async function updateResearchApplication(opportunityId: string, applicationId: number, status: string) {
  return apiFetch(`/research/${opportunityId}/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getDiscussions(): Promise<Discussion[]> {
  return apiFetch('/community/discussions');
}

export async function getDiscussionById(id: string): Promise<Discussion | null> {
  return apiFetch(`/community/discussions/${id}`);
}

export async function createDiscussion(payload: CreateDiscussionPayload): Promise<Discussion> {
  return apiFetch('/community/discussions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createDiscussionComment(discussionId: string, content: string): Promise<DiscussionComment> {
  return apiFetch(`/community/discussions/${discussionId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getBadges(): Promise<Badge[]> {
  return apiFetch('/students/me/badges');
}

export async function getLeaderboard(): Promise<LeaderboardStudent[]> {
  return apiFetch('/leaderboard');
}

export async function getConsultantApplications(): Promise<ConsultantApplication[]> {
  return apiFetch('/admin/consultants');
}

export async function getAdminAssignments(): Promise<AdminAssignmentsResponse> {
  return apiFetch('/admin/assignments');
}

export async function createAssignment(payload: {
  courseId: string;
  moduleId?: string | null;
  lecturerId: string;
  intakeId?: string | null;
  role?: string;
}) {
  return apiFetch('/admin/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createLecturerApplication(payload: {
  fullName: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  specialization?: string | null;
  highestQualification?: string | null;
  yearsExperience?: number | null;
  programInterest?: string | null;
  documents?: Record<string, string> | null;
}) {
  return apiFetch('/lecturer-applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getLecturerApplications(): Promise<LecturerApplication[]> {
  return apiFetch('/admin/lecturer-applications');
}

export async function getLecturerApplication(id: number | string): Promise<LecturerApplication> {
  return apiFetch(`/admin/lecturer-applications/${id}`);
}

export async function updateLecturerApplication(
  id: number | string,
  payload: { status: string; notes?: string | null }
): Promise<LecturerApplication> {
  return apiFetch(`/admin/lecturer-applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getLecturerAssignments(): Promise<LecturerAssignment[]> {
  return apiFetch('/lecturer/assignments');
}

export async function getLessonDocuments(lessonId: string, intakeId?: string | null): Promise<LessonDocument[]> {
  const query = intakeId ? `?intakeId=${encodeURIComponent(intakeId)}` : '';
  return apiFetch(`/lecturer/lessons/${lessonId}/documents${query}`);
}

export async function reviewLessonDocument(
  lessonId: string,
  documentId: number,
  status: 'approved' | 'rejected',
  reviewNotes?: string
): Promise<LessonDocument> {
  return apiFetch(`/lecturer/lessons/${lessonId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reviewNotes }),
  });
}

export async function uploadLessonDocument(
  lessonId: string,
  formData: FormData
): Promise<LessonDocument> {
  const response = await fetch(`${API_BASE_URL}/lecturer/lessons/${lessonId}/documents`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload document');
  }
  return response.json();
}

export async function updateAssignmentMeeting(
  assignmentId: number,
  payload: {
    meetingProvider?: string;
    meetingUrl?: string;
    meetingSchedule?: Record<string, unknown> | null;
    meetingNotes?: string;
  }
): Promise<LecturerAssignment> {
  return apiFetch(`/lecturer/assignments/${assignmentId}/meeting`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getCourseMeeting(courseId: string): Promise<CourseMeeting | null> {
  try {
    return await apiFetch(`/students/me/courses/${courseId}/meeting`);
  } catch (error) {
    return null;
  }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return apiFetch('/admin/audit-logs');
}

export async function getCourseSessions(courseId: string, intakeId: string): Promise<CourseSession[]> {
  return apiFetch(`/lecturer/courses/${courseId}/sessions?intakeId=${encodeURIComponent(intakeId)}`);
}

export async function createCourseSession(
  courseId: string,
  payload: {
    intakeId: string;
    title: string;
    sessionType?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    meetingUrl?: string;
  }
): Promise<CourseSession> {
  return apiFetch(`/lecturer/courses/${courseId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSessionRoster(sessionId: number): Promise<SessionRosterStudent[]> {
  return apiFetch(`/lecturer/sessions/${sessionId}/roster`);
}

export async function markSessionAttendance(
  sessionId: number,
  records: { studentId: number | string; status: string }[]
) {
  return apiFetch(`/lecturer/sessions/${sessionId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

export async function getStudentTimetable(): Promise<CourseSession[]> {
  return apiFetch('/students/me/timetable');
}

export async function getInvoices(): Promise<Invoice[]> {
  return apiFetch('/students/me/invoices');
}

export async function payInvoice(invoiceId: number, amount?: number): Promise<Invoice> {
  return apiFetch(`/students/me/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function getPayments(): Promise<Payment[]> {
  return apiFetch('/students/me/payments');
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  return apiFetch('/students/me/support/tickets');
}

export async function createSupportTicket(payload: {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
}): Promise<SupportTicket> {
  return apiFetch('/students/me/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSupportTicketById(id: string): Promise<SupportTicket | null> {
  return apiFetch(`/students/me/support/tickets/${id}`);
}

export async function addSupportMessage(ticketId: string, message: string): Promise<SupportMessage> {
  return apiFetch(`/students/me/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getWalletSettings(): Promise<WalletSettings> {
  return apiFetch('/students/me/wallet/settings');
}

export async function updateWalletSettings(payload: {
  walletAddress: string;
  payoutCurrency: string;
}): Promise<WalletSettings> {
  return apiFetch('/students/me/wallet/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch('/students/me/payment-methods');
}

export async function addPaymentMethod(payload: {
  type: string;
  provider: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}): Promise<PaymentMethod> {
  return apiFetch('/students/me/payment-methods', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function setDefaultPaymentMethod(id: number, isDefault: boolean) {
  return apiFetch(`/students/me/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isDefault }),
  });
}

export async function deletePaymentMethod(id: number) {
  return apiFetch(`/students/me/payment-methods/${id}`, {
    method: 'DELETE',
    parseJson: false,
  });
}

export async function getScholarshipApplications(): Promise<ScholarshipApplication[]> {
  return apiFetch('/students/me/aid/applications');
}

export async function createScholarshipApplication(payload: {
  programId?: string;
  statement: string;
}): Promise<ScholarshipApplication> {
  return apiFetch('/students/me/aid/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  return apiFetch('/students/me/portfolio');
}

export async function createPortfolioItem(payload: {
  title: string;
  description?: string;
  link?: string;
  itemType?: string;
  status?: string;
}): Promise<PortfolioItem> {
  return apiFetch('/students/me/portfolio', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePortfolioItem(id: number, payload: {
  title: string;
  description?: string;
  link?: string;
  itemType?: string;
  status?: string;
}): Promise<PortfolioItem> {
  return apiFetch(`/students/me/portfolio/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePortfolioItem(id: number) {
  return apiFetch(`/students/me/portfolio/${id}`, {
    method: 'DELETE',
    parseJson: false,
  });
}

export async function getEnrollment(): Promise<EnrollmentData | null> {
  try {
    return await apiFetch('/students/me/enrollment');
  } catch {
    return null;
  }
}

export async function saveEnrollmentModules(modules: string[]): Promise<EnrollmentData> {
  return apiFetch('/students/me/enrollment/modules', {
    method: 'POST',
    body: JSON.stringify({ modules }),
  });
}

export async function confirmEnrollment(): Promise<EnrollmentData> {
  return apiFetch('/students/me/enrollment/confirm', {
    method: 'POST',
  });
}

export async function getRouteChangeRequests(): Promise<RouteChangeRequest[]> {
  return apiFetch('/students/me/route-change-requests');
}

export async function submitRouteChangeRequest(payload: { requestedIntakeId: string; reason?: string }) {
  return apiFetch('/students/me/route-change-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdminRouteChangeRequests(): Promise<RouteChangeRequest[]> {
  return apiFetch('/admin/route-change-requests');
}

export async function reviewRouteChangeRequest(id: number, payload: { status: string; reviewNotes?: string }) {
  return apiFetch(`/admin/route-change-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getConsultantApplicationById(id: string): Promise<ConsultantApplication | null> {
  return apiFetch(`/admin/consultants/${id}`);
}

export async function getSemesterExamQuestions(semesterId: string): Promise<ExamQuestion[]> {
  return apiFetch(`/students/me/exams/semester-${semesterId}`);
}

export async function getCourseExamQuestions(courseId: string): Promise<ExamQuestion[]> {
  return apiFetch(`/courses/${courseId}/exam`);
}

export async function getAdminExamQuestions(filters?: { courseId?: string; semester?: number }): Promise<ExamQuestionRecord[]> {
  const params = new URLSearchParams();
  if (filters?.courseId) params.set('courseId', filters.courseId);
  if (filters?.semester) params.set('semester', String(filters.semester));
  const query = params.toString();
  return apiFetch(`/admin/exam-questions${query ? `?${query}` : ''}`);
}

export async function createExamQuestion(payload: {
  courseId?: string | null;
  semester?: number | null;
  question: string;
  options: string[];
  answer?: string | null;
}): Promise<ExamQuestionRecord> {
  return apiFetch('/admin/exam-questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExamQuestion(id: number, payload: {
  courseId?: string | null;
  semester?: number | null;
  question: string;
  options: string[];
  answer?: string | null;
}): Promise<ExamQuestionRecord> {
  return apiFetch(`/admin/exam-questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteExamQuestion(id: number): Promise<void> {
  await apiFetch(`/admin/exam-questions/${id}`, { method: 'DELETE', parseJson: false });
}

export async function getLecturerExamQuestions(filters?: { courseId?: string; semester?: number }): Promise<ExamQuestionRecord[]> {
  const params = new URLSearchParams();
  if (filters?.courseId) params.set('courseId', filters.courseId);
  if (filters?.semester) params.set('semester', String(filters.semester));
  const query = params.toString();
  return apiFetch(`/lecturer/exam-questions${query ? `?${query}` : ''}`);
}

export async function createLecturerExamQuestion(payload: {
  courseId?: string | null;
  semester?: number | null;
  question: string;
  options: string[];
  answer?: string | null;
}): Promise<ExamQuestionRecord> {
  return apiFetch('/lecturer/exam-questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLecturerExamQuestion(id: number, payload: {
  courseId?: string | null;
  semester?: number | null;
  question: string;
  options: string[];
  answer?: string | null;
}): Promise<ExamQuestionRecord> {
  return apiFetch(`/lecturer/exam-questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLecturerExamQuestion(id: number): Promise<void> {
  await apiFetch(`/lecturer/exam-questions/${id}`, { method: 'DELETE', parseJson: false });
}

export async function submitApplication(payload: ApplicationPayload) {
  return apiFetch('/admissions/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdmissionsSettings(): Promise<AdmissionsSettings> {
  return apiFetch('/admissions/settings');
}

export async function updateAdmissionsSettings(payload: {
  isOpen: boolean;
  message?: string | null;
}): Promise<AdmissionsSettings> {
  return apiFetch('/admin/admissions/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getAdmissionStatus(): Promise<AdmissionStatus> {
  return apiFetch('/admissions/status');
}

export async function getAdmissionApplication(): Promise<ApplicationDetail | null> {
  return apiFetch('/admissions/me');
}

export async function getAdmissionDocuments(): Promise<ApplicationDocument[]> {
  return apiFetch('/admissions/me/documents');
}

export async function uploadAdmissionDocument(documentType: string, file: File): Promise<ApplicationDocument> {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/admissions/me/documents`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload document');
  }
  return response.json();
}

export async function acceptAdmissionOffer(): Promise<ApplicationDetail | null> {
  return apiFetch('/admissions/offer/accept', { method: 'POST' });
}

export async function payAdmissionFee(referenceId: string) {
  return apiFetch('/admissions/fee', {
    method: 'POST',
    body: JSON.stringify({ referenceId }),
  });
}

export async function getApplications(): Promise<ApplicationSummary[]> {
  return apiFetch('/admin/admissions');
}

export async function getApplicationById(id: string): Promise<ApplicationDetail | null> {
  return apiFetch(`/admin/admissions/${id}`);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string,
  intakeId?: string | null,
  extra?: { offerMessage?: string; offerLetterUrl?: string; needsInfoMessage?: string }
): Promise<ApplicationDetail | null> {
  return apiFetch(`/admin/admissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes, intakeId, ...extra }),
  });
}

export async function getApplicationDocuments(id: string): Promise<ApplicationDocument[]> {
  return apiFetch(`/admin/admissions/${id}/documents`);
}

export async function reviewApplicationDocument(
  applicationId: string,
  documentId: number,
  status: 'verified' | 'rejected',
  reviewNotes?: string
): Promise<ApplicationDocument> {
  return apiFetch(`/admin/admissions/${applicationId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reviewNotes }),
  });
}

export async function generateAi(payload: {
  prompt: string;
  mode?: string;
  model?: string;
  context?: string;
}): Promise<AiResponse> {
  return apiFetch('/ai/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type LoginPayload = { email: string; password: string; role?: string };
export type RegisterPayload = { name: string; email: string; password: string };

export async function registerAccount(payload: RegisterPayload): Promise<Session> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload | string): Promise<Session> {
  const body =
    typeof payload === 'string'
      ? { role: payload }
      : { email: payload.email, password: payload.password, role: payload.role };
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST', parseJson: false });
}

export async function getSession(): Promise<Session> {
  return apiFetch('/auth/me');
}

export async function completeCheckout(role: string): Promise<Session> {
  return apiFetch('/students/checkout', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function saveExamResult(examId: string, result: Record<string, unknown>) {
  return apiFetch('/students/me/exams/results', {
    method: 'POST',
    body: JSON.stringify({ examId, result }),
  });
}

export async function getExamResults(): Promise<ExamResultsMap> {
  return apiFetch('/students/me/exams/results');
}

export async function getLatestExamId() {
  return apiFetch('/students/me/exams/latest');
}

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  return apiFetch('/students/me/dashboard');
}

export async function getStudentGrades(): Promise<StudentGradesResponse> {
  return apiFetch('/students/me/grades');
}

export async function getStudentAssignments(): Promise<StudentAssignment[]> {
  return apiFetch('/students/me/assignments');
}

export async function getStudentAssignmentById(id: number | string): Promise<StudentAssignmentDetail> {
  return apiFetch(`/students/me/assignments/${id}`);
}

export async function submitStudentAssignment(
  id: number | string,
  payload: { content?: string; attachmentUrl?: string }
) {
  return apiFetch(`/students/me/assignments/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStudentAssignmentSubmissions(): Promise<StudentAssignmentSubmission[]> {
  return apiFetch('/students/me/assignments/submissions');
}

export async function getLecturerDashboard(): Promise<LecturerDashboardData> {
  return apiFetch('/lecturer/dashboard');
}

export async function getLecturerStudents(intakeId: string): Promise<LecturerStudent[]> {
  return apiFetch(`/lecturer/students?intakeId=${encodeURIComponent(intakeId)}`);
}

export async function recordGrade(payload: {
  student_id: number;
  module_id: string;
  final_percentage: number;
  exam_score?: number | null;
  result_status?: string;
}) {
  return apiFetch('/lecturer/grades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAcademicPolicies(): Promise<AcademicPolicy[]> {
  return apiFetch('/admin/policies');
}

export async function createAcademicPolicy(payload: Partial<AcademicPolicy>): Promise<AcademicPolicy> {
  return apiFetch('/admin/policies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAcademicPolicy(id: number, payload: Partial<AcademicPolicy>): Promise<AcademicPolicy> {
  return apiFetch(`/admin/policies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function assignProgramPolicy(payload: ProgramPolicyAssignment) {
  return apiFetch('/admin/policies/assign/program', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function assignCurriculumPolicy(payload: CurriculumPolicyAssignment) {
  return apiFetch('/admin/policies/assign/curriculum', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getEmployerDashboard(): Promise<EmployerDashboardData> {
  return apiFetch('/employer/dashboard');
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch('/admin/dashboard');
}

export async function getFinanceReport(): Promise<FinanceReportRow[]> {
  return apiFetch('/admin/reports/finance');
}

export async function getSystemHealth(): Promise<any> {
  return apiFetch('/admin/system-health');
}

export async function runSystemDiagnostics(): Promise<any> {
  return apiFetch('/admin/system-health/diagnostics', {
    method: 'POST',
  });
}

