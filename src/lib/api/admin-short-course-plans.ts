import { apiFetch } from '@/lib/api/client';

export type AdminShortCoursePlan = {
  code: string;
  name: string;
  amount: number;
  currency: string;
  accessHours: number;
  aiHours: number;
  hourlyAiQuota: number;
  dailyAiQuota: number;
  certificateIncluded: boolean;
  isActive: boolean;
  sortOrder: number;
};

export async function getAdminShortCoursePlans(): Promise<AdminShortCoursePlan[]> {
  return apiFetch('/admin/short-courses/plans');
}

export async function updateAdminShortCoursePlan(code: string, payload: AdminShortCoursePlan): Promise<AdminShortCoursePlan[]> {
  return apiFetch(`/admin/short-courses/plans/${code}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
