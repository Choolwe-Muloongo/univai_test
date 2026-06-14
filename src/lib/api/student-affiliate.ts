import { apiFetch, buildApiUrl } from '@/lib/api/client';
import type { AffiliatePayout, AffiliateRecord } from '@/lib/api/types';

export type AffiliateApplicationPayload = {
  displayName?: string;
  payoutPhone: string;
  payoutOperator: 'airtel' | 'mtn' | 'zamtel';
  payoutCountry?: string;
  applicationReason: string;
  promotionChannels?: string[];
  acceptedTerms: boolean;
};

export type AffiliatePayoutPayload = {
  amount: number;
  currency?: string;
  phone?: string;
  operator?: 'airtel' | 'mtn' | 'zamtel';
  country?: string;
};

function isUsableAffiliate(value: unknown): value is AffiliateRecord {
  if (!value || typeof value !== 'object') return false;

  const record = value as Partial<AffiliateRecord> & Record<string, unknown>;
  return Boolean(record.id && record.status);
}

export async function getMyAffiliate(): Promise<AffiliateRecord | null> {
  const response = await fetch(buildApiUrl('/students/me/affiliate'), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const data = await response.json();
  return isUsableAffiliate(data) ? data : null;
}

export async function applyForAffiliate(payload: AffiliateApplicationPayload): Promise<AffiliateRecord> {
  return apiFetch<AffiliateRecord>('/students/me/affiliate/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestMyAffiliatePayout(payload: AffiliatePayoutPayload): Promise<AffiliatePayout> {
  return apiFetch<AffiliatePayout>('/students/me/affiliate/payouts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestAffiliateUpgrade(message?: string): Promise<Record<string, any>> {
  return apiFetch('/students/me/affiliate/upgrade-request', {
    method: 'POST',
    body: JSON.stringify({ message: message ?? '' }),
  });
}
