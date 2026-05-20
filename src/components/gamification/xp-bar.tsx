'use client';

import { Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function XpBar({ xp, level, levelTitle, nextLevelXp }: { xp: number; level: number; levelTitle: string; nextLevelXp: number }) {
  const percent = nextLevelXp > 0 ? Math.min(100, Math.round((xp / nextLevelXp) * 100)) : 100;
  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Level {level}</p>
            <h3 className="font-semibold">{levelTitle}</h3>
          </div>
        </div>
        <p className="text-sm font-bold">{xp.toLocaleString()} XP</p>
      </div>
      <div className="mt-4 space-y-2">
        <Progress value={percent} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>{percent}% to next level</span><span>{nextLevelXp.toLocaleString()} XP target</span></div>
      </div>
    </div>
  );
}
