import { apiFetch, buildApiUrl } from '@/lib/api/client';

export type PublicShortCourseLesson = {
  id?: string;
  title: string;
  summary?: string | null;
};

export type PublicShortCourse = {
  id: string;
  title: string;
  description: string;
  schoolId?: string | null;
  imageId?: string | null;
  pricingType?: string | null;
  price?: string | number | null;
  currency?: string | null;
  certificateFee?: string | number | null;
  certificateCurrency?: string | null;
  durationHours?: number | null;
  level?: string | null;
  status?: string | null;
  publicationStatus?: string | null;
  publication_status?: string | null;
  modules?: Array<{ title: string; description?: string | null }>;
  lessons?: PublicShortCourseLesson[];
  outcomes?: string[];
};

export type ShortCourseProgress = {
  status: string;
  entryFeePaid: boolean;
  certificateFeePaid: boolean;
  completedLessons: string[];
  progress: number;
  examScore?: string | number | null;
  completedAt?: string | null;
  certificateIssuedAt?: string | null;
  accessExpiresAt?: string | null;
  accessPlan?: string | null;
  aiPlan?: string | null;
  aiAccessExpiresAt?: string | null;
  hourlyAiQuota?: number | null;
  dailyAiQuota?: number | null;
  certificateIncluded?: boolean | null;
};

export type ShortCourseEnrollmentSummary = {
  id: number;
  course: PublicShortCourse | null;
  status: string;
  progress: number;
  entryFeePaid: boolean;
  certificateFeePaid: boolean;
  examScore?: string | number | null;
  completedAt?: string | null;
  certificateIssuedAt?: string | null;
  accessExpiresAt?: string | null;
  accessPlan?: string | null;
  aiPlan?: string | null;
  aiAccessExpiresAt?: string | null;
  hourlyAiQuota?: number | null;
  dailyAiQuota?: number | null;
  certificateIncluded?: boolean | null;
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

export type ShortCourseQuestion = {
  id: string | number;
  question: string;
  questionType?: string;
  options: string[];
  difficulty?: string;
  timeSeconds?: number;
  lessonId?: string | null;
  tags?: string[];
  visual?: Record<string, unknown> | null;
  chemistryVisual?: Record<string, unknown> | null;
  physicsVisual?: Record<string, unknown> | null;
  diagram?: Record<string, unknown> | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageCaption?: string | null;
};

export type ShortCourseExamPayload = {
  courseId: string;
  requiredQuestions: number;
  availableQuestions: number;
  ready: boolean;
  questions: ShortCourseQuestion[];
};

export type PracticeSectionRequest = {
  title?: string;
  difficulty?: string;
  questionType?: string;
  count?: number;
  timeMinutes?: number;
};

export type ShortCoursePracticePayload = {
  courseId: string;
  sections: Array<{
    id: string;
    title: string;
    difficulty: string;
    questionType: string;
    timeMinutes: number;
    questions: ShortCourseQuestion[];
  }>;
  totalQuestions: number;
  totalTimeMinutes: number;
};

export type PracticeAnswer = {
  questionId: string | number;
  answer?: string;
};

export type ExamAnswer = {
  questionId: string | number;
  answer?: string;
};

export type PracticeResult = {
  score: number;
  correct: number;
  total: number;
  results: Array<{ questionId: string | number; correct: boolean; answer?: string | null; explanation?: string | null }>;
};

const PUBLIC_SHORT_COURSE_STATUSES = new Set(['published', 'active', 'open', 'approved', 'live']);

function normalizedPublicationStatus(course: PublicShortCourse) {
  return String(course.status ?? course.publicationStatus ?? course.publication_status ?? '').trim().toLowerCase();
}

export function isPublicShortCourse(course: PublicShortCourse) {
  return PUBLIC_SHORT_COURSE_STATUSES.has(normalizedPublicationStatus(course));
}

export async function getPublicShortCourses(): Promise<PublicShortCourse[]> {
  const courses = await apiFetch<PublicShortCourse[]>('/courses');
  return courses.filter(isPublicShortCourse);
}

export async function getPublicShortCourse(courseId: string): Promise<PublicShortCourse | null> {
  return apiFetch<PublicShortCourse | null>(`/courses/${courseId}`);
}

export async function getLessonsByShortCourse(courseId: string): Promise<PublicShortCourseLesson[]> {
  return apiFetch<PublicShortCourseLesson[]>(`/courses/${courseId}/lessons`);
}

export async function getMyShortCourses(): Promise<ShortCourseEnrollmentSummary[]> {
  return apiFetch<ShortCourseEnrollmentSummary[]>('/students/me/short-courses');
}

export async function enrollShortCourse(courseId: string): Promise<PaymentInitiation> {
  return apiFetch(`/students/me/short-courses/${courseId}/enroll`, { method: 'POST' });
}

export async function getShortCourseProgress(courseId: string): Promise<ShortCourseProgress> {
  return apiFetch(`/students/me/short-courses/${courseId}/progress`);
}

export async function completeShortCourseLesson(courseId: string, lessonId: string): Promise<{ progress: number; completedLessons: number }> {
  return apiFetch(`/students/me/short-courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST' });
}

export async function getShortCourseExam(courseId: string): Promise<ShortCourseExamPayload> {
  return apiFetch(`/students/me/short-courses/${courseId}/exam`);
}

export async function submitShortCourseExam(courseId: string, answers: ExamAnswer[]): Promise<{ score: number; passed: boolean }> {
  return apiFetch(`/students/me/short-courses/${courseId}/exam/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getShortCoursePractice(courseId: string, payload: PracticeSectionRequest | { sections: PracticeSectionRequest[] }): Promise<ShortCoursePracticePayload> {
  return apiFetch(`/students/me/short-courses/${courseId}/practice`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitShortCoursePractice(courseId: string, answers: PracticeAnswer[]): Promise<PracticeResult> {
  return apiFetch(`/students/me/short-courses/${courseId}/practice/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function payShortCourseCertificate(courseId: string): Promise<PaymentInitiation> {
  return apiFetch(`/students/me/short-courses/${courseId}/certificate/pay`, { method: 'POST' });
}

export function getShortCourseCertificateUrl(courseId: string) {
  return buildApiUrl(`/students/me/short-courses/${courseId}/certificate/download`);
}

export function paymentUrl(response: PaymentInitiation) {
  return response.checkout_url ?? response.checkoutUrl ?? null;
}
