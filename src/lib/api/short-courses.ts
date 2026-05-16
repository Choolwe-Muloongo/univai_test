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
};

export type PaymentInitiation = {
  invoiceId?: number;
  checkout_url?: string | null;
  checkoutUrl?: string | null;
  reference?: string;
  status?: string;
};

export type ShortCourseExamQuestion = {
  id: string | number;
  question: string;
  options: string[];
};

export type ShortCourseExamPayload = {
  courseId: string;
  requiredQuestions: number;
  availableQuestions: number;
  ready: boolean;
  questions: ShortCourseExamQuestion[];
};

export async function getPublicShortCourses(): Promise<PublicShortCourse[]> {
  const courses = await apiFetch<PublicShortCourse[]>('/courses');
  return courses.filter((course) => course.status === 'published' || course.status === 'active');
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

export async function getShortCourseExam(courseId: string): Promise<ShortCourseExamPayload> {
  return apiFetch(`/students/me/short-courses/${courseId}/exam`);
}

export async function submitShortCourseExam(courseId: string, answers: string[]): Promise<{ score: number; passed: boolean }> {
  return apiFetch(`/students/me/short-courses/${courseId}/exam/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function payShortCourseCertificate(courseId: string): Promise<PaymentInitiation> {
  return apiFetch(`/students/me/short-courses/${courseId}/certificate/pay`, { method: 'POST' });
}

export function getShortCourseCertificateUrl(courseId: string) {
  return buildApiUrl(`/students/me/short-courses/${courseId}/certificate`);
}

export function paymentUrl(response: PaymentInitiation) {
  return response.checkout_url || response.checkoutUrl || null;
}

export function formatMoney(amount?: string | number | null, currency = 'ZMW') {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 'Free';
  return `${currency} ${value.toLocaleString()}`;
}
