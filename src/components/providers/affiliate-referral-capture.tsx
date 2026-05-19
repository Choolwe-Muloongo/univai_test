'use client';

import { useEffect } from 'react';

const STORAGE_KEYS = ['univai.affiliate.code', 'univai.referral.code'];
const PARAM_NAMES = ['ref', 'affiliate', 'affiliateCode', 'referralCode'];

function cleanCode(value: string | null) {
  if (!value) return '';
  return value.trim().replace(/[^A-Za-z0-9]+/g, '').toUpperCase();
}

export function AffiliateReferralCapture() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const next = cleanCode(PARAM_NAMES.map((name) => searchParams.get(name)).find(Boolean) ?? null);
    if (!next) return;

    try {
      for (const key of STORAGE_KEYS) {
        window.localStorage.setItem(key, next);
      }
    } catch {
      // Referral capture must never break page rendering.
    }
  }, []);

  return null;
}
