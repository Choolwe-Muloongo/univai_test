'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowRight, BrainCircuit, CheckCircle2, Target, Zap } from 'lucide-react';

type NovaInsightCardProps = {
  title?: string;
  currentMission?: string;
  weakArea?: string;
  recommendation?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function NovaInsightCard({
  title = 'Nova Insight',
  currentMission = 'Current learning context',
  weakArea = 'Not enough recent data yet',
  recommendation = 'Ask Nova for a short study plan, then complete one focused practice task.',
  actionLabel = 'Ask Nova to plan',
  onAction,
  className,
}: NovaInsightCardProps) {
  return (
    <Card className={cn('overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BrainCircuit className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3">
          <div className="rounded-2xl border bg-background/75 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Current mission
            </div>
            <p className="font-medium">{currentMission}</p>
          </div>
          <div className="rounded-2xl border bg-background/75 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Zap className="h-3.5 w-3.5" /> Weak area
            </div>
            <p className="font-medium">{weakArea}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-primary/8 p-3">
          <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">Recommended next action</Badge>
          <p className="text-muted-foreground">{recommendation}</p>
        </div>

        {onAction ? (
          <Button type="button" className="w-full justify-between rounded-2xl" onClick={onAction}>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {actionLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
