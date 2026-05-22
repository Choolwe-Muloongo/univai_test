'use client';

import { useEffect } from 'react';
import { submitBetaReport } from '@/lib/api/beta-reports';

const STORAGE_KEY = 'univai.lastClientErrorReportAt';
const MIN_INTERVAL_MS = 30_000;

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

async function reportClientError(payload: {
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
      source: 'client-auto',
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
    // Never throw from the reporter. Reporting must not break the app.
  }
}

export function ClientErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      void reportClientError({
        title: event.message || 'Unhandled browser error',
        errorName: event.error?.name || 'ErrorEvent',
        errorMessage: event.message,
        stackTrace: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      void reportClientError({
        title: 'Unhandled promise rejection',
        errorName: reason instanceof Error ? reason.name : 'PromiseRejection',
        errorMessage: safeMessage(reason),
        stackTrace: reason instanceof Error ? reason.stack : undefined,
        context: { reasonType: typeof reason },
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
