import type { Course, CoursePayload, ShortCourseDraftCreatePayload } from '@/lib/api/types';
import { apiFetch } from '@/lib/api/client';

function forceDraftCourse<T extends Record<string, unknown>>(course: T): T {
  return { ...course, status: 'draft' };
}

function normalizeDraftPayload(payload: ShortCourseDraftCreatePayload): ShortCourseDraftCreatePayload {
  const legacySourceMode = (payload as unknown as { sourceMode?: string }).sourceMode;
  const sourceMode: ShortCourseDraftCreatePayload['sourceMode'] =
    legacySourceMode === 'manual-studio' ? 'new' : payload.sourceMode;

  return {
    ...payload,
    sourceMode,
    course: forceDraftCourse(payload.course as unknown as Record<string, unknown>),
  } as ShortCourseDraftCreatePayload;
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
    body: JSON.stringify(normalizeDraftPayload(payload)),
  });
}
