import { apiFetch } from '@/lib/api/client';
import type { AffiliateOverview, AffiliatePayout, AffiliateRecord } from '@/lib/api/types';

export type AdminAffiliatePayload = {
  userId?: number | null;
  code?: string | null;
  displayName: string;
  scope?: string;
  status?: string;
  tier?: 'starter' | 'campus_promoter' | 'ambassador' | 'elite_partner' | string;
  formalProgrammeRate?: number;
  shortCourseRate?: number;
  lencoAccountId?: string | null;
  payoutPhone?: string | null;
  payoutOperator?: string | null;
  payoutCountry?: string | null;
  notes?: string | null;
};

export async function getAffiliateOverview(): Promise<AffiliateOverview> {
  return apiFetch('/admin/affiliates');
}

export async function createAffiliate(payload: AdminAffiliatePayload): Promise<AffiliateRecord> {
  return apiFetch('/admin/affiliates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestAffiliatePayout(
  affiliateId: number,
  payload: {
    amount: number;
    currency?: string;
    phone?: string | null;
    operator?: string | null;
    country?: string | null;
    reference?: string | null;
    fee?: number;
  }
): Promise<AffiliatePayout> {
  return apiFetch(`/admin/affiliates/${affiliateId}/payouts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyAffiliatePayout(payoutId: number): Promise<AffiliatePayout> {
  return apiFetch(`/admin/affiliates/payouts/${payoutId}/verify`, {
    method: 'PATCH',
  });
}

export async function calculateAffiliateRewards(payload: { month?: number; year?: number } = {}): Promise<Record<string, any>> {
  return apiFetch('/admin/affiliates/rewards/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveAffiliateUpgrade(requestId: number, notes?: string): Promise<AffiliateRecord> {
  return apiFetch(`/admin/affiliates/upgrade-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes ?? '' }),
  });
}

export async function rejectAffiliateUpgrade(requestId: number, notes?: string): Promise<Record<string, any>> {
  return apiFetch(`/admin/affiliates/upgrade-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes ?? '' }),
  });
}

export async function updateAffiliateBonus(bonusId: number, status: 'approved' | 'rejected' | 'paid' | 'cancelled', notes?: string): Promise<Record<string, any>> {
  return apiFetch(`/admin/affiliates/monthly-bonuses/${bonusId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes: notes ?? '' }),
  });
}

export async function downgradeAffiliateFromReview(reviewId: number): Promise<AffiliateRecord> {
  return apiFetch(`/admin/affiliates/tier-reviews/${reviewId}/downgrade`, {
    method: 'POST',
  });
}
