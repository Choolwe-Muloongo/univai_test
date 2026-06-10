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
};

const DEFAULT_LABEL = 'Working on your request...';

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const pending = useRef(new Map<string, LoadingEventDetail>());
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    function syncLabel() {
      const latest = Array.from(pending.current.values()).at(-1);
      setActiveLabel(latest ? latest.label || DEFAULT_LABEL : null);
    }

    function start(detail: LoadingEventDetail) {
      const id = detail.id || `manual-${Date.now()}`;
      pending.current.set(id, { ...detail, id });
      syncLabel();
    }

    function end(detail: LoadingEventDetail) {
      if (detail.id) {
        pending.current.delete(detail.id);
      } else {
        pending.current.clear();
      }

      if (detail.errorMessage) {
        toast({ variant: 'destructive', title: 'Action failed', description: detail.errorMessage });
      } else if (detail.successMessage) {
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

      start({ id: 'route-change', label: 'Loading page...' });
    }
    window.addEventListener('univai:loading-start', handleStart);
    window.addEventListener('univai:loading-end', handleEnd);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('univai:loading-start', handleStart);
      window.removeEventListener('univai:loading-end', handleEnd);
      document.removeEventListener('click', handleDocumentClick, true);
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      window.dispatchEvent(new CustomEvent('univai:loading-end', { detail: { id: 'route-change' } }));
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
