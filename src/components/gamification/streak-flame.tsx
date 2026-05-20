'use client';

import { Flame, ShieldCheck } from 'lucide-react';

export function StreakFlame({ days, protectedToday }: { days: number; protectedToday?: boolean }) {
  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600"><Flame className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-muted-foreground">Learning streak</p>
          <h3 className="font-semibold">{days}-day streak</h3>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Complete one meaningful learning action today to protect the flame.</p>
      {protectedToday ? <p className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 p-2 text-xs"><ShieldCheck className="h-4 w-4 text-primary" /> Streak shield active</p> : null}
    </div>
  );
}
