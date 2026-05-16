import type { Course, CoursePayload, ShortCourseDraftCreatePayload } from '@/lib/api/types';
import { apiFetch } from '@/lib/api/client';

function forceDraftCourse<T extends Record<string, unknown>>(course: T): T {
  return { ...course, status: 'draft' };
}

export async function saveShortCourseDraft(course: CoursePayload): Promise<Course> {
  return apiFetch('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(forceDraftCourse(course as unknown as Record<string, unknown>)),
  });
}

export async function saveShortCourseDraftWithBlueprint(payload: ShortCourseDraftCreatePayload): Promise<Course> {
  return apiFetch('/admin/short-courses/drafts', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      course: forceDraftCourse(payload.course as unknown as Record<string, unknown>),
    }),
  });
}
