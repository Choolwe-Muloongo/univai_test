import { apiFetch } from '@/lib/api/client';
import type { PaymentInitiation } from '@/lib/api/short-courses';

export type ShortCourseAccessPlan = {
  code: string;
  name: string;
  courseCount?: number;
  amount: number;
  currency: string;
  accessHours: number;
  aiHours: number;
  hourlyAiQuota: number;
  dailyAiQuota: number;
  certificateIncluded: boolean;
};

export async function getShortCourseAccessPlans(courseId: string): Promise<ShortCourseAccessPlan[]> {
  return apiFetch(`/students/me/short-courses/${courseId}/access-plans`);
}

export async function purchaseShortCourseAccessPlan(courseId: string, plan: string): Promise<PaymentInitiation & { plan?: ShortCourseAccessPlan }> {
  return apiFetch(`/students/me/short-courses/${courseId}/access-plans/purchase`, {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function getShortCourseBundlePlans(): Promise<ShortCourseAccessPlan[]> {
  return apiFetch('/students/me/short-courses/bundles');
}

export async function purchaseShortCourseBundle(bundle: string, courseIds: string[]): Promise<PaymentInitiation & { plan?: ShortCourseAccessPlan }> {
  return apiFetch('/students/me/short-courses/bundles/purchase', {
    method: 'POST',
    body: JSON.stringify({ bundle, courseIds }),
  });
}
