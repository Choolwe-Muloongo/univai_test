import { apiFetch, USE_MOCKS } from '@/lib/api/client';
import {
  mockGetBadges,
  mockGetConsultantApplication,
  mockGetConsultantApplications,
  mockGetCourse,
  mockGetCourses,
  mockGetDiscussionById,
  mockGetDiscussions,
  mockGetFlattenedLessons,
  mockGetJob,
  mockGetJobs,
  mockGetLesson,
  mockGetLessons,
  mockGetProgram,
  mockGetProgramModules,
  mockGetResearch,
  mockGetResearchById,
  mockGetSchools,
  mockGetSemesterExamQuestions,
  mockGetAdmissionStatus,
  mockPayAdmissionFee,
  mockSubmitApplication,
  mockLogin,
  mockLogout,
  mockGetSession,
  mockCompleteCheckout,
  mockSaveExamResult,
  mockGetExamResults,
  mockGetLatestExamId,
  mockGetCourseExamQuestions,
  mockCreateSchool,
  mockCreateCourse,
  mockDeleteSchool,
  mockDeleteCourse,
  mockGetApplications,
  mockGetApplicationById,
  mockUpdateApplicationStatus,
  mockCreateJob,
  mockCreateResearch,
  mockCreateDiscussion,
  mockApplyJob,
  mockApplyResearch,
  type Session,
} from '@/lib/api/mock';
import type {
  AdmissionStatus,
  ApplicationDetail,
  ApplicationPayload,
  ApplicationStatus,
  ApplicationSummary,
  CreateJobPayload,
  CreateResearchPayload,
  CreateDiscussionPayload,
  JobApplicationPayload,
  ResearchApplicationPayload,
} from '@/lib/api/types';
import type {
  Badge,
  Course,
  Discussion,
  Job,
  LeaderboardStudent,
  Lesson,
  LessonWithCourseId,
  Program,
  ProgramModule,
  ResearchOpportunity,
  School,
  ConsultantApplication,
} from '@/lib/data';

export async function getSchools(): Promise<School[]> {
  if (USE_MOCKS) return mockGetSchools();
  return apiFetch('/schools');
}

export async function getCourses(): Promise<Course[]> {
  if (USE_MOCKS) return mockGetCourses();
  return apiFetch('/courses');
}

export async function createSchool(name: string): Promise<School> {
  if (USE_MOCKS) return mockCreateSchool(name);
  return apiFetch('/admin/schools', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createCourse(course: Course): Promise<Course> {
  if (USE_MOCKS) return mockCreateCourse(course);
  return apiFetch('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(course),
  });
}

export async function deleteSchool(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteSchool(id);
  await apiFetch(`/admin/schools/${id}`, { method: 'DELETE', parseJson: false });
}

export async function deleteCourse(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteCourse(id);
  await apiFetch(`/admin/courses/${id}`, { method: 'DELETE', parseJson: false });
}

export async function getCourseById(id: string): Promise<Course | null> {
  if (USE_MOCKS) return mockGetCourse(id);
  return apiFetch(`/courses/${id}`);
}

export async function getProgram(): Promise<Program> {
  if (USE_MOCKS) return mockGetProgram();
  return apiFetch('/students/me/program');
}

export async function getProgramModules(): Promise<ProgramModule[]> {
  if (USE_MOCKS) return mockGetProgramModules();
  return apiFetch('/students/me/program/modules');
}

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  if (USE_MOCKS) return mockGetLessons(courseId);
  return apiFetch(`/courses/${courseId}/lessons`);
}

export async function getLessonById(lessonId: string): Promise<LessonWithCourseId | null> {
  if (USE_MOCKS) return mockGetLesson(lessonId);
  return apiFetch(`/lessons/${lessonId}`);
}

export async function getFlattenedLessons(): Promise<LessonWithCourseId[]> {
  if (USE_MOCKS) return mockGetFlattenedLessons();
  return apiFetch('/lessons');
}

export async function getJobs(): Promise<Job[]> {
  if (USE_MOCKS) return mockGetJobs();
  return apiFetch('/jobs');
}

export async function getJobById(id: string): Promise<Job | null> {
  if (USE_MOCKS) return mockGetJob(id);
  return apiFetch(`/jobs/${id}`);
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  if (USE_MOCKS) return mockCreateJob(payload);
  return apiFetch('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function applyJob(jobId: string, payload: JobApplicationPayload) {
  if (USE_MOCKS) return mockApplyJob(jobId, payload);
  return apiFetch(`/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getResearchOpportunities(): Promise<ResearchOpportunity[]> {
  if (USE_MOCKS) return mockGetResearch();
  return apiFetch('/research');
}

export async function getResearchById(id: string): Promise<ResearchOpportunity | null> {
  if (USE_MOCKS) return mockGetResearchById(id);
  return apiFetch(`/research/${id}`);
}

export async function createResearch(payload: CreateResearchPayload): Promise<ResearchOpportunity> {
  if (USE_MOCKS) return mockCreateResearch(payload);
  return apiFetch('/research', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function applyResearch(opportunityId: string, payload: ResearchApplicationPayload) {
  if (USE_MOCKS) return mockApplyResearch(opportunityId, payload);
  return apiFetch(`/research/${opportunityId}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDiscussions(): Promise<Discussion[]> {
  if (USE_MOCKS) return mockGetDiscussions();
  return apiFetch('/community/discussions');
}

export async function getDiscussionById(id: string): Promise<Discussion | null> {
  if (USE_MOCKS) return mockGetDiscussionById(id);
  return apiFetch(`/community/discussions/${id}`);
}

export async function createDiscussion(payload: CreateDiscussionPayload): Promise<Discussion> {
  if (USE_MOCKS) return mockCreateDiscussion(payload);
  return apiFetch('/community/discussions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBadges(): Promise<Badge[]> {
  if (USE_MOCKS) return mockGetBadges();
  return apiFetch('/students/me/badges');
}

export async function getLeaderboard(): Promise<LeaderboardStudent[]> {
  if (USE_MOCKS) return mockGetLeaderboard();
  return apiFetch('/leaderboard');
}

export async function getConsultantApplications(): Promise<ConsultantApplication[]> {
  if (USE_MOCKS) return mockGetConsultantApplications();
  return apiFetch('/admin/consultants');
}

export async function getConsultantApplicationById(id: string): Promise<ConsultantApplication | null> {
  if (USE_MOCKS) return mockGetConsultantApplication(id);
  return apiFetch(`/admin/consultants/${id}`);
}

export async function getSemesterExamQuestions(semesterId: string) {
  if (USE_MOCKS) return mockGetSemesterExamQuestions();
  return apiFetch(`/students/me/exams/semester-${semesterId}`);
}

export async function getCourseExamQuestions(courseId: string) {
  if (USE_MOCKS) return mockGetCourseExamQuestions();
  return apiFetch(`/courses/${courseId}/exam`);
}

export async function submitApplication(payload: ApplicationPayload) {
  if (USE_MOCKS) return mockSubmitApplication(payload);
  return apiFetch('/admissions/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdmissionStatus(): Promise<AdmissionStatus> {
  if (USE_MOCKS) return mockGetAdmissionStatus();
  return apiFetch('/admissions/status');
}

export async function payAdmissionFee(referenceId: string) {
  if (USE_MOCKS) return mockPayAdmissionFee(referenceId);
  return apiFetch('/admissions/fee', {
    method: 'POST',
    body: JSON.stringify({ referenceId }),
  });
}

export async function getApplications(): Promise<ApplicationSummary[]> {
  if (USE_MOCKS) return mockGetApplications();
  return apiFetch('/admin/admissions');
}

export async function getApplicationById(id: string): Promise<ApplicationDetail | null> {
  if (USE_MOCKS) return mockGetApplicationById(id);
  return apiFetch(`/admin/admissions/${id}`);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<ApplicationDetail | null> {
  if (USE_MOCKS) return mockUpdateApplicationStatus(id, status, notes);
  return apiFetch(`/admin/admissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

export async function login(role: string): Promise<Session> {
  if (USE_MOCKS) return mockLogin(role);
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) return mockLogout();
  await apiFetch('/auth/logout', { method: 'POST', parseJson: false });
}

export async function getSession(): Promise<Session> {
  if (USE_MOCKS) return mockGetSession();
  return apiFetch('/auth/me');
}

export async function completeCheckout(role: string): Promise<Session> {
  if (USE_MOCKS) return mockCompleteCheckout(role);
  return apiFetch('/students/checkout', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function saveExamResult(examId: string, result: Record<string, unknown>) {
  if (USE_MOCKS) return mockSaveExamResult(examId, result);
  return apiFetch('/students/me/exams/results', {
    method: 'POST',
    body: JSON.stringify({ examId, result }),
  });
}

export async function getExamResults() {
  if (USE_MOCKS) return mockGetExamResults();
  return apiFetch('/students/me/exams/results');
}

export async function getLatestExamId() {
  if (USE_MOCKS) return mockGetLatestExamId();
  return apiFetch('/students/me/exams/latest');
}
