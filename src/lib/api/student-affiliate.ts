import { apiFetch } from '@/lib/api/client';
import type { AffiliateRecord } from '@/lib/api/types';

export async function getMyAffiliate(): Promise<AffiliateRecord | null> {
  try {
    return await apiFetch<AffiliateRecord | null>('/students/me/affiliate');
  } catch (error) {
    return null;
  }
}
