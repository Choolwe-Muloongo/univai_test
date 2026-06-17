'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

type LoadingEventDetail = {
  id?: string;
  label?: string;
  successMessage?: string;
  errorMessage?: string;
  method?: string;
  path?: string;
  loadingMode?: 'silent' | 'inline' | 'blocking';
  delayMs?: number;
  timeoutMs?: number;
};

type PendingLoading = LoadingEventDetail & {
  id: string;
  shown: boolean;
  delayTimer?: ReturnType<typeof setTimeout>;
  timeoutTimer?: ReturnType<typeof setTimeout>;
};

const DEFAULT_LABEL = 'Working on your request...';
const DEFAULT_DELAY_MS = 400;
const DEFAULT_TIMEOUT_MS = 15_000;

function isReadMethod(method?: string) {
  return ['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase());
}

function shouldUseBlockingOverlay(detail: LoadingEventDetail) {
  if (detail.loadingMode === 'silent' || detail.loadingMode === 'inline') return false;
  if (detail.loadingMode === 'blocking') return true;
  if (detail.id === 'route-change') return true;
  return !isReadMethod(detail.method);
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const pending = useRef(new Map<string, PendingLoading>());
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    function syncLabel() {
      const latest = Array.from(pending.current.values()).filter((item) => item.shown).at(-1);
      setActiveLabel(latest ? latest.label || DEFAULT_LABEL : null);
    }

    function clearTimers(record?: PendingLoading) {
      if (!record) return;
      if (record.delayTimer) clearTimeout(record.delayTimer);
      if (record.timeoutTimer) clearTimeout(record.timeoutTimer);
    }

    function start(detail: LoadingEventDetail) {
      if (!shouldUseBlockingOverlay(detail)) return;

      const id = detail.id || `manual-${Date.now()}`;
      const delayMs = Math.max(0, detail.delayMs ?? DEFAULT_DELAY_MS);
      const timeoutMs = Math.max(delayMs + 1_000, detail.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      const existing = pending.current.get(id);
      clearTimers(existing);

      const record: PendingLoading = { ...detail, id, shown: false };
      record.delayTimer = setTimeout(() => {
        const current = pending.current.get(id);
        if (!current) return;
        current.shown = true;
        syncLabel();
      }, delayMs);

      record.timeoutTimer = setTimeout(() => {
        const current = pending.current.get(id);
        if (!current) return;
        pending.current.delete(id);
        toast({
          variant: 'destructive',
          title: 'Request took too long',
          description: 'The app stopped the loading screen so you are not locked out. Try again or report the issue if nothing changed.',
        });
        syncLabel();
      }, timeoutMs);

      pending.current.set(id, record);
      syncLabel();
    }

    function end(detail: LoadingEventDetail) {
      const record = detail.id ? pending.current.get(detail.id) : undefined;
      if (detail.id) {
        clearTimers(record);
        pending.current.delete(detail.id);
      } else {
        for (const item of pending.current.values()) clearTimers(item);
        pending.current.clear();
      }

      const wasVisible = Boolean(record?.shown);
      const shouldNotify = wasVisible || !isReadMethod(detail.method);

      if (shouldNotify && detail.errorMessage) {
        toast({ variant: 'destructive', title: 'Action failed', description: detail.errorMessage });
      } else if (shouldNotify && detail.successMessage) {
        toast({ title: 'Action completed', description: detail.successMessage });
      }

      syncLabel();
    }

    function handleStart(event: Event) {
      start((event as CustomEvent<LoadingEventDetail>).detail || {});
    }

    function handleEnd(event: Event) {
      end((event as CustomEvent<LoadingEventDetail>).detail || {});
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (target.target && target.target !== '_self') return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (`${nextUrl.pathname}${nextUrl.search}` === `${window.location.pathname}${window.location.search}`) return;

      start({ id: 'route-change', label: 'Loading page...', method: 'NAVIGATION', loadingMode: 'blocking', delayMs: 250, timeoutMs: 10_000 });
    }

    window.addEventListener('univai:loading-start', handleStart);
    window.addEventListener('univai:loading-end', handleEnd);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('univai:loading-start', handleStart);
      window.removeEventListener('univai:loading-end', handleEnd);
      document.removeEventListener('click', handleDocumentClick, true);
      for (const item of pending.current.values()) clearTimers(item);
      pending.current.clear();
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      window.dispatchEvent(new CustomEvent('univai:loading-end', { detail: { id: 'route-change', method: 'NAVIGATION' } }));
    }
  }, [pathname]);

  return (
    <>
      {children}
      <Toaster />
      {activeLabel ? <UnivaiLoadingOverlay label={activeLabel} /> : null}
    </>
  );
}

function UnivaiLoadingOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/78 p-4 backdrop-blur-md" role="status" aria-live="polite" aria-label={label}>
      <div className="glass-modal flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">
        <div className="relative h-28 w-28">
          <img src="/images/brand/univai-logo-mark-transparent.png" alt="" className="absolute inset-0 h-full w-full object-contain opacity-20 grayscale" />
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path d="M31 20v48c0 30 58 30 58 0V20" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" className="text-primary/15" />
            <path d="M31 20v48c0 30 58 30 58 0V20" fill="none" stroke="url(#univai-loader-gradient)" strokeWidth="16" strokeLinecap="round" className="univai-loader-path" />
            <defs>
              <linearGradient id="univai-loader-gradient" x1="18" x2="102" y1="18" y2="102" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--brand-blue))" />
                <stop offset="0.55" stopColor="hsl(var(--brand-cyan))" />
                <stop offset="1" stopColor="hsl(var(--brand-violet))" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">UnivAI is loading</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
