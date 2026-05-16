import { apiFetch } from '@/lib/api/client';

export async function deleteAdminShortCourse(courseId: string): Promise<void> {
  await apiFetch(`/admin/courses/${courseId}`, { method: 'DELETE' });
}
