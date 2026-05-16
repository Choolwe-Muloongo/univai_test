import { apiFetch } from '@/lib/api/client';

export async function completeProgrammeLesson(
  lessonId: string,
  payload: { courseId?: string | null; programId?: string | null; moduleId?: string | null } = {},
): Promise<{ lessonId: string; completed: boolean; completedAt: string }> {
  return apiFetch(`/students/me/programme-lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
