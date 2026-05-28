'use client';

import type { ReactNode } from 'react';
import type { AccountingVisual } from './types';

export function AccountingShell({ visual, title, subtitle, children, metrics, thread }: { visual: AccountingVisual; title: string; subtitle?: string; children: ReactNode; metrics?: ReactNode; thread?: ReactNode }) {
  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-3 shadow-sm dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20 sm:rounded-3xl sm:p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Accounting visual card</p>
        <h4 className="break-words text-base font-bold sm:text-lg">{title}</h4>
        {subtitle ? <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {thread}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border bg-background p-3 shadow-inner sm:rounded-3xl sm:p-4">{children}</div>
        {metrics ? <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">{metrics}</div> : null}
      </div>
      <span className="text-xs text-muted-foreground">{visual.template.replace(/_/g, ' ')}</span>
    </div>
  );
}
