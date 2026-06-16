'use client';

import { useEffect } from 'react';
import { submitBetaReport } from '@/lib/api/beta-reports';

const STORAGE_KEY = 'univai.lastClientErrorReportAt';
const MIN_INTERVAL_MS = 15_000;

function canReportNow() {
  if (typeof window === 'undefined') return false;
  const last = Number(window.sessionStorage.getItem(STORAGE_KEY) || 0);
  const now = Date.now();
  if (now - last < MIN_INTERVAL_MS) return false;
  window.sessionStorage.setItem(STORAGE_KEY, String(now));
  return true;
}

function safeMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return 'Unknown client error'; }
}

function baseContext(extra: Record<string, unknown> = {}) {
  return {
    href: typeof window !== 'undefined' ? window.location.href : null,
    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    viewport: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : null,
    ...extra,
  };
}

async function reportClientError(payload: {
  source?: string;
  title: string;
  errorName?: string;
  errorMessage?: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
}) {
  if (!canReportNow()) return;

  try {
    await submitBetaReport({
      type: 'error',
      source: payload.source || 'client-auto',
      severity: 'high',
      title: payload.title,
      description: 'Automatically captured client-side error during beta testing.',
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      errorName: payload.errorName,
      errorMessage: payload.errorMessage,
      stackTrace: payload.stackTrace,
      context: payload.context,
    });
  } catch {
    // Error reporting must never break the app.
  }
}

export function ClientErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      const error = event.error instanceof Error ? event.error : null;
      void reportClientError({
        source: 'client-error-event',
        title: event.message || error?.message || 'Unhandled browser error',
        errorName: error?.name || 'ErrorEvent',
        errorMessage: error?.message || event.message || 'Unknown browser error',
        stackTrace: error?.stack,
        context: baseContext({
          filename: event.filename || null,
          lineno: event.lineno || null,
          colno: event.colno || null,
          hasErrorObject: Boolean(error),
        }),
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const error = reason instanceof Error ? reason : null;
      void reportClientError({
        source: 'client-promise-rejection',
        title: error?.message || 'Unhandled promise rejection',
        errorName: error?.name || 'UnhandledPromiseRejection',
        errorMessage: error?.message || safeMessage(reason),
        stackTrace: error?.stack,
        context: baseContext({ reasonType: typeof reason }),
      });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
