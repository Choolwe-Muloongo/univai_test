import { apiFetch } from '@/lib/api/client';

export type ShortCourseInsightCourse = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  pricingType?: string | null;
  price?: number;
  currency?: string | null;
  certificateFee?: number;
  certificateCurrency?: string | null;
  durationHours?: number;
  level?: string | null;
  lessonCount?: number;
  enrollmentCount?: number;
  paidEnrollmentCount?: number;
  completedEnrollmentCount?: number;
};

export type ShortCourseInsightEnrollment = {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail?: string | null;
  courseId: string;
  courseTitle: string;
  status: string;
  progress: number;
  entryFeePaid: boolean;
  certificateFeePaid: boolean;
  examScore?: number | null;
  completedAt?: string | null;
  certificateIssuedAt?: string | null;
  updatedAt?: string | null;
};

export type ShortCourseInsights = {
  summary: {
    courses: number;
    publishedCourses: number;
    draftCourses: number;
    paidCourses: number;
    freeCourses: number;
    enrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    certificateReady: number;
    entryFeesPaid: number;
    certificateFeesPaid: number;
    entryFeeValue: number;
    certificateFeeValue: number;
  };
  courses: ShortCourseInsightCourse[];
  enrollments: ShortCourseInsightEnrollment[];
};

export async function completeProgrammeLesson(
  lessonId: string,
  payload: { courseId?: string | null; programId?: string | null; moduleId?: string | null } = {},
): Promise<{ lessonId: string; completed: boolean; completedAt: string }> {
  return apiFetch(`/students/me/programme-lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getShortCourseInsights(): Promise<ShortCourseInsights> {
  return apiFetch('/admin/short-courses/insights');
}

export async function submitShortCourseForReview(courseId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/courses/${courseId}/submit-review`, { method: 'PATCH' });
}

export async function approveShortCourse(courseId: string, notes?: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/courses/${courseId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

export async function publishApprovedShortCourse(courseId: string, notes?: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/courses/${courseId}/publish-reviewed`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

export async function exportAcademicDataset(payload: { status?: 'approved' | 'published'; limit?: number } = {}): Promise<Record<string, unknown>> {
  return apiFetch('/admin/academic-datasets/export', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
