import { apiFetch } from '@/lib/api/client';
import { fallbackGamification, type GamificationState } from '@/lib/api/student-gamification';
import { isPublicShortCourse, type PublicShortCourse, type ShortCourseEnrollmentSummary, type ShortCourseProgress } from '@/lib/api/short-courses';
import type { ShortCourseAccessPlan } from '@/lib/api/short-course-access';
import type { Course, Lesson, LessonWithCourseId } from '@/lib/api/types';

type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

const memory = new Map<string, CacheEnvelope<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const TTL = {
  publicCourses: 5 * 60_000,
  publicCourse: 5 * 60_000,
  lessons: 5 * 60_000,
  lesson: 5 * 60_000,
  studentProgress: 12_000,
  studentJourneys: 12_000,
  accessPlans: 5 * 60_000,
  bundlePlans: 5 * 60_000,
  gamification: 15_000,
};

function storageKey(key: string) {
  return `univai:student-short-course:${key}`;
}

function now() {
  return Date.now();
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readFastCache<T>(key: string): T | null {
  const current = memory.get(key) as CacheEnvelope<T> | undefined;
  if (current && current.expiresAt > now()) return current.value;

  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || parsed.expiresAt <= now()) {
      window.sessionStorage.removeItem(storageKey(key));
      return null;
    }
    memory.set(key, parsed as CacheEnvelope<unknown>);
    return parsed.value;
  } catch {
    return null;
  }
}

function writeFastCache<T>(key: string, value: T, ttlMs: number) {
  const envelope: CacheEnvelope<T> = { value, expiresAt: now() + ttlMs };
  memory.set(key, envelope as CacheEnvelope<unknown>);
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(storageKey(key), JSON.stringify(envelope));
  } catch {
    // Storage can be full or blocked. Memory cache still works for this page session.
  }
}

async function fastFetch<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const cached = readFastCache<T>(key);
  if (cached !== null) return cached;

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const request = loader()
    .then((value) => {
      writeFastCache(key, value, ttlMs);
      return value;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request as Promise<unknown>);
  return request;
}

export function invalidateStudentShortCourseCache(courseId?: string | number | null) {
  const id = courseId == null ? null : String(courseId);
  const prefixes = ['my-journeys', 'gamification'];
  if (id) prefixes.push(`progress:${id}`, `course:${id}`, `lessons:${id}`);

  for (const key of Array.from(memory.keys())) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) memory.delete(key);
  }

  if (!canUseStorage()) return;
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (!key?.startsWith('univai:student-short-course:')) continue;
      const shortKey = key.replace('univai:student-short-course:', '');
      if (prefixes.some((prefix) => shortKey.startsWith(prefix))) window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }
}

export async function getFastPublicShortCourses(): Promise<PublicShortCourse[]> {
  return fastFetch('public-courses', TTL.publicCourses, async () => {
    const courses = await apiFetch<PublicShortCourse[]>('/courses');
    return courses.filter(isPublicShortCourse);
  });
}

export async function getFastPublicShortCourse(courseId: string): Promise<PublicShortCourse | null> {
  const cachedList = readFastCache<PublicShortCourse[]>('public-courses');
  const fromList = cachedList?.find((course) => String(course.id) === String(courseId));
  if (fromList) return fromList;

  return fastFetch(`course:${courseId}`, TTL.publicCourse, () => apiFetch<PublicShortCourse | null>(`/courses/${encodeURIComponent(courseId)}`));
}

export async function getFastCourseById(courseId: string): Promise<Course> {
  const cachedList = readFastCache<PublicShortCourse[]>('public-courses');
  const fromList = cachedList?.find((course) => String(course.id) === String(courseId));
  if (fromList) return fromList as unknown as Course;

  return fastFetch(`course:${courseId}`, TTL.publicCourse, () => apiFetch<Course>(`/courses/${encodeURIComponent(courseId)}`));
}

export async function getFastLessonsByCourse(courseId: string): Promise<Lesson[]> {
  return fastFetch(`lessons:${courseId}`, TTL.lessons, () => apiFetch<Lesson[]>(`/courses/${encodeURIComponent(courseId)}/lessons`));
}

export async function getFastLessonById(lessonId: string): Promise<LessonWithCourseId> {
  return fastFetch(`lesson:${lessonId}`, TTL.lesson, () => apiFetch<LessonWithCourseId>(`/lessons/${encodeURIComponent(lessonId)}`));
}

export async function getFastMyShortCourses(): Promise<ShortCourseEnrollmentSummary[]> {
  return fastFetch('my-journeys', TTL.studentJourneys, () => apiFetch<ShortCourseEnrollmentSummary[]>('/students/me/short-courses'));
}

export async function getFastShortCourseProgress(courseId: string): Promise<ShortCourseProgress> {
  return fastFetch(`progress:${courseId}`, TTL.studentProgress, () => apiFetch<ShortCourseProgress>(`/students/me/short-courses/${encodeURIComponent(courseId)}/progress`));
}

export async function getFastShortCourseAccessPlans(courseId: string): Promise<ShortCourseAccessPlan[]> {
  return fastFetch(`plans:${courseId}`, TTL.accessPlans, () => apiFetch<ShortCourseAccessPlan[]>(`/students/me/short-courses/${encodeURIComponent(courseId)}/access-plans`));
}

export async function getFastShortCourseBundlePlans(): Promise<ShortCourseAccessPlan[]> {
  return fastFetch('bundle-plans', TTL.bundlePlans, () => apiFetch<ShortCourseAccessPlan[]>('/students/me/short-courses/bundles'));
}

export async function getFastStudentGamification(progressFallback = 0): Promise<GamificationState> {
  return fastFetch('gamification', TTL.gamification, () => apiFetch<GamificationState>('/students/me/gamification')).catch(() => fallbackGamification(progressFallback));
}

export function warmStudentShortCourse(courseId: string) {
  void getFastPublicShortCourse(courseId).catch(() => null);
  void getFastLessonsByCourse(courseId).catch(() => null);
  void getFastShortCourseProgress(courseId).catch(() => null);
  void getFastShortCourseAccessPlans(courseId).catch(() => null);
}
