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

export async function createSemester(payload: {
  academicYearId: number;
  name: string;
  number: number;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}): Promise<Semester> {
  return apiFetch('/admin/semesters', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createProgrammeCourse(payload: {
  programId: string;
  departmentId?: number | null;
  courseId?: string | null;
  moduleId?: string | null;
  academicYearId?: number | null;
  semesterId?: number | null;
  yearLevel?: number;
  semesterNumber?: number | null;
  durationType?: string;
  deliveryMode?: string;
  isCore?: boolean;
  credits?: number;
  status?: string;
}): Promise<ProgrammeCourse> {
  return apiFetch('/admin/programme-courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCourseUnit(payload: {
  programmeCourseId: number;
  semesterId?: number | null;
  title: string;
  description?: string | null;
  unitNumber?: number;
  estimatedHours?: number | null;
  status?: string;
}): Promise<CourseUnit> {
  return apiFetch('/admin/course-units', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createLearningModeRule(payload: {
  programId?: string | null;
  courseId?: string | null;
  mode: string;
  rules?: Record<string, unknown>;
}): Promise<LearningModeRule> {
  return apiFetch('/admin/learning-mode-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createVenue(payload: {
  name: string;
  type?: string | null;
  location?: string | null;
  capacity?: number | null;
  status?: string;
}): Promise<Venue> {
  return apiFetch('/admin/venues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPartnerInstitution(payload: {
  name: string;
  type?: string | null;
  location?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  status?: string;
}): Promise<PartnerInstitution> {
  return apiFetch('/admin/partner-institutions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPracticalSession(payload: {
  courseOfferingId?: number | null;
  programmeCourseId?: number | null;
  deliveryGroupId?: number | null;
  title: string;
  description?: string | null;
  venueId?: number | null;
  partnerInstitutionId?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  capacity?: number | null;
  supervisorId?: number | null;
  status?: string;
}): Promise<PracticalSession> {
  return apiFetch('/admin/practical-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPlatformExpansionOverview(): Promise<PlatformExpansionOverview> {
  return apiFetch('/admin/platform-expansion');
}

export async function createCourseOffering(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/course-offerings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCourseDeliveryGroup(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/course-delivery-groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAssessment(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createGradingPolicy(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/grading-policies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createTestAnnouncement(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/lecturer/test-announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAiStudySession(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/students/me/ai-study-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStudentLearningOverview(): Promise<Record<string, unknown>> {
  return apiFetch('/students/me/learning');
}

export async function getLecturerTestingOverview(): Promise<Record<string, unknown>> {
  return apiFetch('/lecturer/testing');
}

export async function getInstructorPortalOverview(): Promise<Record<string, unknown>> {
  return apiFetch('/instructor/portal');
}

export async function submitInstructorApplication(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/instructor-applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPlatformOperationsOverview(): Promise<PlatformOperationsOverview> {
  return apiFetch('/admin/platform-operations');
}

export async function createInstructorCourseSource(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/instructor/course-sources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createInstructorAiGeneration(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/instructor/ai-generations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createFeeRule(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/fee-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCertificate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/certificates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createMessageTemplate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/message-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAnnouncement(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createSavedReport(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/admin/saved-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProgramModulesByProgram(programId: string): Promise<ProgramModule[]> {
  return apiFetch(`/programs/${programId}/modules`);
}

export async function updateProgramDeliveryModes(programId: string, supportedDeliveryModes: string[]): Promise<Program> {
  return apiFetch(`/admin/programs/${programId}/delivery-modes`, {
    method: 'PATCH',
    body: JSON.stringify({ supportedDeliveryModes }),
  });
}

export async function createSchool(name: string): Promise<School> {
  return apiFetch('/admin/schools', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createCourse(course: CoursePayload): Promise<Course> {
  return apiFetch('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(course),
  });
}

export async function createShortCourseDraftWithBlueprint(payload: ShortCourseDraftCreatePayload): Promise<Course> {
  return apiFetch('/admin/short-courses/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createProgram(program: ProgramPayload): Promise<Program> {
  return apiFetch('/admin/programs', {
    method: 'POST',
    body: JSON.stringify(program),
  });
}

export async function updateProgram(id: string, program: ProgramPayload): Promise<Program> {
  return apiFetch(`/admin/programs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(program),
  });
}

export async function deleteSchool(id: string): Promise<void> {
  await apiFetch(`/admin/schools/${id}`, { method: 'DELETE', parseJson: false });
}

export async function deleteCourse(id: string): Promise<void> {
  await apiFetch(`/admin/courses/${id}`, { method: 'DELETE', parseJson: false });
}

export async function updateCourse(id: string, payload: Record<string, unknown>): Promise<Course> {
  return apiFetch(`/admin/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    loadingLabel: 'Saving course changes...',
    successMessage: 'Course updated successfully.',
  });
}

export async function testSmtpEmail(payload: { to: string; subject?: string; message?: string }): Promise<Record<string, unknown>> {
  return apiFetch('/admin/system/email/test', {
    method: 'POST',
    body: JSON.stringify(payload),
    loadingLabel: 'Sending SMTP test email...',
    successMessage: 'Email sent successfully.',
  });
}

export async function deleteProgram(id: string): Promise<void> {
  await apiFetch(`/admin/programs/${id}`, { method: 'DELETE', parseJson: false });
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
    code?: string | null;
    title: string;
    description: string;
    credits?: number;
    hoursPerWeek?: number | null;
    semester: number;
    isCore?: boolean;
    track?: string | null;
    supportedDeliveryModes?: string[];
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
  const response = await fetch(buildApiUrl(`/lecturer/lessons/${lessonId}/documents`), {
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

export async function payInvoice(invoiceId: number, amount?: number): Promise<PaymentInitiation> {
  return apiFetch(`/students/me/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: amount ? JSON.stringify({ amount }) : undefined,
  });
}

export async function verifyInvoicePayment(invoiceId: number): Promise<{ id: number; status: string; message?: string }> {
  return apiFetch(`/students/me/invoices/${invoiceId}/verify`, { method: 'POST' });
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

export async function getStudentEntitlements(): Promise<StudentEntitlementsResponse> {
  return apiFetch('/students/me/entitlements');
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

export async function saveEnrollmentModules(modules: string[], deliveryMode: string): Promise<EnrollmentData> {
  return apiFetch('/students/me/enrollment/modules', {
    method: 'POST',
    body: JSON.stringify({ modules, deliveryMode }),
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
  lecturerApplicationsOpen?: boolean;
  lecturerApplicationsMessage?: string | null;
}): Promise<AdmissionsSettings> {
  return apiFetch('/admin/admissions/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  return apiFetch('/admin/payment-settings');
}

export async function updatePaymentSettings(payload: PaymentSettings): Promise<PaymentSettings> {
  return apiFetch('/admin/payment-settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getDocumentBrandingSettings(): Promise<DocumentBrandingSettings> {
  return apiFetch('/admin/document-branding');
}

export async function updateDocumentBrandingSettings(payload: DocumentBrandingSettings): Promise<DocumentBrandingSettings> {
  return apiFetch('/admin/document-branding', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function documentBrandingPreviewUrl(type: 'offer' | 'admission' | 'certificate'): string {
  return buildApiUrl(`/admin/document-branding/preview/${type}`);
}

export async function getAffiliateOverview(): Promise<AffiliateOverview> {
  return apiFetch('/admin/affiliates');
}

export async function createAffiliate(payload: {
  userId?: number | null;
  code?: string | null;
  displayName: string;
  scope?: string;
  status?: string;
  formalProgrammeRate?: number;
  shortCourseRate?: number;
  lencoAccountId?: string | null;
  payoutPhone?: string | null;
  payoutOperator?: string | null;
  payoutCountry?: string | null;
  notes?: string | null;
}): Promise<AffiliateRecord> {
  return apiFetch('/admin/affiliates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestAffiliatePayout(
  affiliateId: number,
  payload: {
    amount: number;
    currency?: string;
    phone?: string | null;
    operator?: string | null;
    country?: string | null;
    reference?: string | null;
    fee?: number;
  }
): Promise<AffiliatePayout> {
  return apiFetch(`/admin/affiliates/${affiliateId}/payouts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyAffiliatePayout(payoutId: number): Promise<AffiliatePayout> {
  return apiFetch(`/admin/affiliates/payouts/${payoutId}/verify`, {
    method: 'PATCH',
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
  const response = await fetch(buildApiUrl('/admissions/me/documents'), {
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
  approvedMaterials?: string;
  accessTier?: string;
  feature?: string;
  audience?: string;
  brandContext?: string;
}): Promise<AiResponse> {
  return apiFetch('/ai/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type LoginPayload = { email: string; password: string; role?: string };
export type RegisterPayload = { name: string; email: string; password: string; role?: string };

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

export async function getAccountProfile(): Promise<AccountProfileResponse> {
  return apiFetch('/auth/profile');
}

export async function updateAccountProfile(payload: {
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  timezone?: string | null;
  bio?: string | null;
  avatar?: string | null;
}): Promise<AccountProfileResponse> {
  return apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function completeCheckout(role: string, accessTier?: string): Promise<Session> {
  return apiFetch('/students/checkout', {
    method: 'POST',
    body: JSON.stringify({ role, accessTier }),
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

export async function getLaunchReadiness(): Promise<LaunchReadinessReport> {
  return apiFetch('/launch-readiness');
}

export async function getSystemHealth(): Promise<SystemHealthData> {
  return apiFetch('/admin/system-health');
}

export async function runSystemDiagnostics(): Promise<any> {
  return apiFetch('/admin/system-health/diagnostics', {
    method: 'POST',
  });
}


export async function getExamClinicOverview(): Promise<ExamClinicOverview> {
  return apiFetch('/admin/exam-clinic');
}

export async function createExamCentre(payload: {
  name: string;
  code?: string;
  location: string;
  timezone?: string;
  capacity?: number;
  approvalStatus?: string;
  approvalNotes?: string;
}): Promise<ExamCentre> {
  return apiFetch('/admin/exam-clinic/centres', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateExamCentreApproval(id: number, payload: { approvalStatus: string; approvalNotes?: string }): Promise<ExamCentre> {
  return apiFetch(`/admin/exam-clinic/centres/${id}/approval`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function createExamRoom(payload: { centreId: number; name: string; code?: string; capacity: number; accessibilityNotes?: string; equipment?: string[]; status?: string }): Promise<ExamRoom> {
  return apiFetch('/admin/exam-clinic/rooms', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createExamInvigilator(payload: { name: string; email: string; phone?: string; certifications?: string[]; status?: string }): Promise<ExamInvigilator> {
  return apiFetch('/admin/exam-clinic/invigilators', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createExamClinicSession(payload: {
  centreId: number;
  roomId?: number | null;
  invigilatorId?: number | null;
  examId: string;
  title: string;
  programId?: string | null;
  moduleId?: string | null;
  courseId?: string | null;
  deliveryMode: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status?: string;
  rules?: string[];
}): Promise<ExamClinicSession> {
  return apiFetch('/admin/exam-clinic/sessions', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateExamClinicSession(id: number, payload: { status?: string; capacity?: number; invigilatorId?: number }): Promise<ExamClinicSession> {
  return apiFetch(`/admin/exam-clinic/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function createExamIncident(sessionId: number, payload: { bookingId?: number | null; severity: string; category: string; description: string; status?: string; actions?: string[] }): Promise<ExamIncident> {
  return apiFetch(`/admin/exam-clinic/sessions/${sessionId}/incidents`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function markExamAttendance(bookingId: number, payload: { status: string; notes?: string }): Promise<ExamBooking> {
  return apiFetch(`/admin/exam-clinic/bookings/${bookingId}/attendance`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function syncExamResults(payload: { sessionId?: number | null; recordsSynced?: number; message?: string }): Promise<ExamResultsSyncLog> {
  return apiFetch('/admin/exam-clinic/results-sync', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getStudentExamClinicSessions(): Promise<ExamClinicSession[]> {
  return apiFetch('/students/me/exam-clinic/sessions');
}

export async function getStudentExamBookings(): Promise<ExamBooking[]> {
  return apiFetch('/students/me/exam-clinic/bookings');
}

export async function bookExamClinicSession(sessionId: number, accommodations?: string): Promise<ExamBooking> {
  return apiFetch('/students/me/exam-clinic/bookings', { method: 'POST', body: JSON.stringify({ sessionId, accommodations }) });
}

export async function cancelExamBooking(bookingId: number): Promise<ExamBooking> {
  return apiFetch(`/students/me/exam-clinic/bookings/${bookingId}`, { method: 'DELETE' });
}
