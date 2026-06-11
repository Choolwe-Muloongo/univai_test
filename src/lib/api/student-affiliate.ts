import { apiFetch } from '@/lib/api/client';
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

export async function getMyAffiliate(): Promise<AffiliateRecord | null> {
  try {
    return await apiFetch<AffiliateRecord | null>('/students/me/affiliate');
  } catch (error) {
    return null;
  }
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
