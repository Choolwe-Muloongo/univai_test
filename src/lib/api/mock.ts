import {
  badges,
  consultantApplications,
  courses,
  discussions,
  flattenedLessons,
  jobs,
  lessons,
  leaderboardData,
  program,
  researchOpportunities,
  schools,
  semester1ExamQuestions,
  type Badge,
  type Course,
  type Discussion,
  type Job,
  type Lesson,
  type LessonWithCourseId,
  type Program,
  type ProgramModule,
  type ResearchOpportunity,
  type School,
} from '@/lib/data';
import type { AdmissionStatus, ApplicationPayload } from '@/lib/api/types';
import type {
  ApplicationDetail,
  ApplicationStatus,
  ApplicationSummary,
  CreateJobPayload,
  CreateResearchPayload,
  CreateDiscussionPayload,
  JobApplicationPayload,
  ResearchApplicationPayload,
} from '@/lib/api/types';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string | null;
  programId?: string | null;
};

export type Session = {
  user: SessionUser | null;
};

const SESSION_KEY = 'univai_mock_session';
const ADMISSION_KEY = 'univai_admission_status';
const SCHOOLS_KEY = 'univai_mock_schools';
const COURSES_KEY = 'univai_mock_courses';
const JOBS_KEY = 'univai_mock_jobs';
const RESEARCH_KEY = 'univai_mock_research';
const DISCUSSIONS_KEY = 'univai_mock_discussions';
const APPLICATIONS_KEY = 'univai_mock_applications';
const EXAM_RESULTS_KEY = 'univai_exam_results';
const EXAM_LATEST_KEY = 'univai_latest_exam_id';

const mockUsers: Record<string, SessionUser> = {
  'premium-student': {
    id: 'student-premium',
    name: 'Premium Student',
    email: 'student.premium@univai.edu',
    role: 'premium-student',
    schoolId: 'ict',
    programId: 'cs101',
  },
  'freemium-student': {
    id: 'student-freemium',
    name: 'Freemium Student',
    email: 'student.freemium@univai.edu',
    role: 'freemium-student',
    schoolId: null,
    programId: null,
  },
  lecturer: {
    id: 'lecturer-1',
    name: 'Lecturer',
    email: 'lecturer@univai.edu',
    role: 'lecturer',
  },
  employer: {
    id: 'employer-1',
    name: 'Employer',
    email: 'employer@univai.edu',
    role: 'employer',
  },
  admin: {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@univai.edu',
    role: 'admin',
  },
};

const readLocal = (key: string) => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

const writeLocal = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

const clearLocal = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

export async function mockLogin(role: string): Promise<Session> {
  const user = mockUsers[role] ?? mockUsers['premium-student'];
  const session = { user };
  writeLocal(SESSION_KEY, session);
  return session;
}

export async function mockLogout(): Promise<void> {
  clearLocal(SESSION_KEY);
}

export async function mockGetSession(): Promise<Session> {
  const session = readLocal(SESSION_KEY) as Session | null;
  return session ?? { user: null };
}

export async function mockCompleteCheckout(role: string): Promise<Session> {
  const user = mockUsers[role] ?? mockUsers['premium-student'];
  const session = { user };
  writeLocal(SESSION_KEY, session);
  return session;
}

export async function mockSubmitApplication(payload: ApplicationPayload) {
  const application: ApplicationDetail = {
    id: `app-${Date.now()}`,
    fullName: payload.fullName,
    email: payload.email,
    programId: payload.programId,
    schoolId: payload.schoolId,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    subjectCount: Object.values(payload.subjectPoints).filter((v) => Number(v) > 0).length,
    totalPoints: Object.values(payload.subjectPoints).reduce((sum, v) => sum + (Number(v) || 0), 0),
    deliveryMode: payload.deliveryMode,
    learningStyle: payload.learningStyle,
    studyPace: payload.studyPace,
    country: payload.country,
    subjectPoints: payload.subjectPoints,
  };

  const existing = (readLocal(APPLICATIONS_KEY) as ApplicationDetail[] | null) ?? [];
  writeLocal(APPLICATIONS_KEY, [application, ...existing]);

  writeLocal(ADMISSION_KEY, {
    status: 'submitted',
    admissionFeePaid: false,
    application: payload,
  });
  return { status: 'submitted' };
}

export async function mockGetAdmissionStatus(): Promise<AdmissionStatus> {
  const status =
    (readLocal(ADMISSION_KEY) as AdmissionStatus | null) ??
    { status: 'draft', admissionFeePaid: false };
  return {
    status: status.status ?? 'draft',
    admissionFeePaid: Boolean(status.admissionFeePaid),
  };
}

export async function mockPayAdmissionFee(referenceId: string) {
  void referenceId;
  const existing = (readLocal(ADMISSION_KEY) as AdmissionStatus | null) ?? {
    status: 'submitted',
    admissionFeePaid: false,
  };
  const nextStatus = {
    ...existing,
    status: 'fee_paid',
    admissionFeePaid: true,
  };
  writeLocal(ADMISSION_KEY, nextStatus);
  return nextStatus;
}

const defaultApplications: ApplicationDetail[] = [
  {
    id: 'app-1001',
    fullName: 'Noria Banda',
    email: 'noria.banda@email.com',
    programId: 'cs101',
    schoolId: 'ict',
    status: 'fee_paid',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    subjectCount: 7,
    totalPoints: 42,
    deliveryMode: 'hybrid',
    learningStyle: 'traditional',
    studyPace: 'standard',
    country: 'Zambia',
    subjectPoints: {
      'english-language': '6',
      mathematics: '5',
      biology: '5',
      chemistry: '5',
      physics: '6',
      'computer-studies': '5',
      'civic-education': '4',
    },
    notes: 'Strong STEM profile. Recommend admission.',
  },
  {
    id: 'app-1002',
    fullName: 'Isaac Mwila',
    email: 'isaac.mwila@email.com',
    programId: 'bus301',
    schoolId: 'business',
    status: 'submitted',
    submittedAt: new Date(Date.now() - 172800000).toISOString(),
    subjectCount: 6,
    totalPoints: 34,
    deliveryMode: 'online',
    learningStyle: 'personalized',
    studyPace: 'flex',
    country: 'Zambia',
    subjectPoints: {
      'english-language': '5',
      mathematics: '4',
      commerce: '5',
      geography: '5',
      history: '5',
      'principles-of-accounts': '5',
    },
    notes: 'Meets minimum criteria. Awaiting fee payment.',
  },
];

const loadApplications = (): ApplicationDetail[] => {
  const stored = readLocal(APPLICATIONS_KEY) as ApplicationDetail[] | null;
  if (stored && stored.length) return stored;
  writeLocal(APPLICATIONS_KEY, defaultApplications);
  return defaultApplications;
};

export async function mockGetApplications(): Promise<ApplicationSummary[]> {
  return loadApplications().map((app) => ({
    id: app.id,
    fullName: app.fullName,
    email: app.email,
    programId: app.programId,
    schoolId: app.schoolId,
    status: app.status,
    submittedAt: app.submittedAt,
    subjectCount: app.subjectCount,
    totalPoints: app.totalPoints,
  }));
}

export async function mockGetApplicationById(id: string): Promise<ApplicationDetail | null> {
  return loadApplications().find((app) => app.id === id) ?? null;
}

export async function mockUpdateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<ApplicationDetail | null> {
  const apps = loadApplications();
  const updated = apps.map((app) =>
    app.id === id ? { ...app, status, notes: notes ?? app.notes } : app
  );
  writeLocal(APPLICATIONS_KEY, updated);
  return updated.find((app) => app.id === id) ?? null;
}

export async function mockSaveExamResult(examId: string, result: Record<string, unknown>) {
  const existing = (readLocal(EXAM_RESULTS_KEY) as Record<string, unknown> | null) ?? {};
  const next = { ...existing, [examId]: result };
  writeLocal(EXAM_RESULTS_KEY, next);
  writeLocal(EXAM_LATEST_KEY, examId);
  return next;
}

export async function mockGetExamResults() {
  return (readLocal(EXAM_RESULTS_KEY) as Record<string, unknown> | null) ?? {};
}

export async function mockGetLatestExamId() {
  return (readLocal(EXAM_LATEST_KEY) as string | null) ?? null;
}

export async function mockGetSchools(): Promise<School[]> {
  const stored = readLocal(SCHOOLS_KEY) as School[] | null;
  if (stored && stored.length) return stored;
  writeLocal(SCHOOLS_KEY, schools);
  return schools;
}

export async function mockGetCourses(): Promise<Course[]> {
  const stored = readLocal(COURSES_KEY) as Course[] | null;
  if (stored && stored.length) return stored;
  writeLocal(COURSES_KEY, courses);
  return courses;
}

export async function mockGetCourse(id: string): Promise<Course | null> {
  const allCourses = await mockGetCourses();
  return allCourses.find((course) => course.id === id) ?? null;
}

export async function mockGetProgram(): Promise<Program> {
  return program;
}

export async function mockGetProgramModules(): Promise<ProgramModule[]> {
  return program.modules;
}

export async function mockGetLessons(courseId: string): Promise<Lesson[]> {
  return lessons[courseId] ?? [];
}

export async function mockGetLesson(lessonId: string): Promise<Lesson | null> {
  const allLessons = flattenedLessons;
  return allLessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export async function mockGetFlattenedLessons(): Promise<LessonWithCourseId[]> {
  return flattenedLessons;
}

export async function mockCreateSchool(name: string): Promise<School> {
  const allSchools = await mockGetSchools();
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const nextSchool = { id, name };
  const updated = [...allSchools, nextSchool];
  writeLocal(SCHOOLS_KEY, updated);
  return nextSchool;
}

export async function mockCreateCourse(course: Course): Promise<Course> {
  const allCourses = await mockGetCourses();
  const updated = [...allCourses, course];
  writeLocal(COURSES_KEY, updated);
  return course;
}

export async function mockDeleteSchool(id: string): Promise<void> {
  const allSchools = await mockGetSchools();
  const updated = allSchools.filter((school) => school.id !== id);
  writeLocal(SCHOOLS_KEY, updated);
  const allCourses = await mockGetCourses();
  writeLocal(COURSES_KEY, allCourses.filter((course) => course.schoolId !== id));
}

export async function mockDeleteCourse(id: string): Promise<void> {
  const allCourses = await mockGetCourses();
  const updated = allCourses.filter((course) => course.id !== id);
  writeLocal(COURSES_KEY, updated);
}

const loadJobs = (): Job[] => {
  const stored = readLocal(JOBS_KEY) as Job[] | null;
  if (stored && stored.length) return stored;
  writeLocal(JOBS_KEY, jobs);
  return jobs;
};

const loadResearch = (): ResearchOpportunity[] => {
  const stored = readLocal(RESEARCH_KEY) as ResearchOpportunity[] | null;
  if (stored && stored.length) return stored;
  writeLocal(RESEARCH_KEY, researchOpportunities);
  return researchOpportunities;
};

const loadDiscussions = (): Discussion[] => {
  const stored = readLocal(DISCUSSIONS_KEY) as Discussion[] | null;
  if (stored && stored.length) return stored;
  writeLocal(DISCUSSIONS_KEY, discussions);
  return discussions;
};

const formatJobType = (value: string) => {
  const normalized = value.toLowerCase();
  const map: Record<string, string> = {
    internship: 'Internship',
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    contract: 'Contract',
  };
  return map[normalized] ?? value;
};

export async function mockGetJobs(): Promise<Job[]> {
  return loadJobs();
}

export async function mockGetJob(id: string): Promise<Job | null> {
  const allJobs = loadJobs();
  return allJobs.find((job) => job.id === id) ?? null;
}

export async function mockGetResearch(): Promise<ResearchOpportunity[]> {
  return loadResearch();
}

export async function mockGetResearchById(id: string): Promise<ResearchOpportunity | null> {
  const allResearch = loadResearch();
  return allResearch.find((item) => item.id === id) ?? null;
}

export async function mockGetDiscussions(): Promise<Discussion[]> {
  return loadDiscussions();
}

export async function mockGetDiscussionById(id: string): Promise<Discussion | null> {
  const allDiscussions = loadDiscussions();
  return allDiscussions.find((discussion) => discussion.id === id) ?? null;
}

export async function mockGetBadges(): Promise<Badge[]> {
  return badges;
}

export async function mockGetLeaderboard() {
  return leaderboardData;
}

export async function mockGetConsultantApplications() {
  return consultantApplications;
}

export async function mockGetConsultantApplication(id: string) {
  return consultantApplications.find((application) => application.id === id) ?? null;
}

export async function mockGetSemesterExamQuestions() {
  return semester1ExamQuestions;
}

export async function mockGetCourseExamQuestions() {
  return semester1ExamQuestions;
}

export async function mockCreateJob(payload: CreateJobPayload): Promise<Job> {
  const allJobs = loadJobs();
  const job: Job = {
    id: `j-${Date.now()}`,
    title: payload.title,
    company: payload.company,
    location: payload.location,
    type: formatJobType(payload.type),
    description: payload.description,
  };
  writeLocal(JOBS_KEY, [job, ...allJobs]);
  return job;
}

export async function mockApplyJob(jobId: string, payload: JobApplicationPayload) {
  void jobId;
  void payload;
  return { status: 'submitted' };
}

export async function mockCreateResearch(payload: CreateResearchPayload): Promise<ResearchOpportunity> {
  const allResearch = loadResearch();
  const opportunity: ResearchOpportunity = {
    id: `r-${Date.now()}`,
    title: payload.title,
    company: payload.company,
    field: payload.field,
    description: payload.description,
  };
  writeLocal(RESEARCH_KEY, [opportunity, ...allResearch]);
  return opportunity;
}

export async function mockApplyResearch(opportunityId: string, payload: ResearchApplicationPayload) {
  void opportunityId;
  void payload;
  return { status: 'submitted' };
}

export async function mockCreateDiscussion(payload: CreateDiscussionPayload): Promise<Discussion> {
  const allDiscussions = loadDiscussions();
  const discussion: Discussion = {
    id: `d-${Date.now()}`,
    title: payload.title,
    author: 'You',
    avatar: 'https://i.pravatar.cc/40?u=univai-user',
    snippet: payload.details,
    comments: [],
    timestamp: 'just now',
  };
  writeLocal(DISCUSSIONS_KEY, [discussion, ...allDiscussions]);
  return discussion;
}
