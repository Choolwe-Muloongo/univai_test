'use client';

import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { DailyQuest } from '@/lib/api/student-gamification';

export function DailyQuests({ quests }: { quests: DailyQuest[] }) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Today’s quests</p>
          <h2 className="text-xl font-bold">Earn XP before midnight</h2>
        </div>
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-3">
        {quests.map((quest) => {
          const percent = quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0;
          return (
            <div key={quest.id} className="rounded-2xl border p-3">
              <div className="flex items-start gap-3">
                {quest.completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{quest.title}</p>
                    <span className="text-xs font-semibold text-primary">+{quest.rewardXp} XP · +{quest.rewardPoints} pts</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{quest.description}</p>
                  <div className="mt-3 space-y-1">
                    <Progress value={percent} className="h-2" />
                    <p className="text-xs text-muted-foreground">{quest.progress}/{quest.target} complete</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
