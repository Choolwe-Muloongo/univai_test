'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bot, CheckCircle2, Clock3, GraduationCap, Layers3, LockKeyhole, MessageSquareText, Route, ShieldCheck } from 'lucide-react';
import { NovaInsightCard } from './nova-insight-card';

type NovaContextPanelProps = {
  accessLabel: string;
  accessTier: string;
  dailyPromptLimit: number;
  courseId?: string | null;
  lessonId?: string | null;
  promptsUsedLabel?: string;
  onPromptSelect?: (prompt: string) => void;
};

export function NovaContextPanel({
  accessLabel,
  accessTier,
  dailyPromptLimit,
  courseId,
  lessonId,
  promptsUsedLabel = 'Tracked by your access policy',
  onPromptSelect,
}: NovaContextPanelProps) {
  const hasJourney = Boolean(courseId);
  const hasLesson = Boolean(lessonId);
  const activeContext = [hasJourney ? 'Journey' : null, hasLesson ? 'Mission' : null].filter(Boolean).join(' + ') || 'General study';

  const quickTools = [
    'Build my study plan',
    'Show my weak areas',
    'Prepare me for the final trial',
    'Create a rescue drill',
  ];

  return (
    <aside className="space-y-4">
      <NovaInsightCard
        currentMission={hasLesson ? `Mission ID: ${lessonId}` : hasJourney ? 'Journey learning session' : 'General UnivAI study'}
        weakArea={hasLesson ? 'Use Nova after each difficult card to build stronger recall.' : 'Ask a focused question to help Nova identify your weak area.'}
        recommendation={hasLesson ? 'Ask Nova to quiz you on this mission before you continue.' : 'Start with a study plan or ask Nova what to revise first.'}
        actionLabel="Use recommendation"
        onAction={onPromptSelect ? () => onPromptSelect(hasLesson ? 'Quiz me on this mission.' : 'Create a focused study plan for me.') : undefined}
      />

      <Card className="border-primary/10 bg-background/90">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" /> Nova Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
              <span className="flex items-center gap-2 text-muted-foreground"><Route className="h-4 w-4" /> Active context</span>
              <Badge variant="secondary">{activeContext}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
              <span className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" /> AI access tier</span>
              <Badge variant="outline">{accessLabel}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
              <span className="flex items-center gap-2 text-muted-foreground"><MessageSquareText className="h-4 w-4" /> Daily prompt limit</span>
              <Badge>{dailyPromptLimit}/day</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Context attached</p>
            <div className="grid gap-2">
              <ContextRow active label="Current Journey" icon={<Layers3 className="h-4 w-4" />} detail={hasJourney ? courseId : 'Not attached'} />
              <ContextRow active={hasLesson} label="Current Mission" icon={<GraduationCap className="h-4 w-4" />} detail={hasLesson ? lessonId : 'Not attached'} />
              <ContextRow active label="My Progress" icon={<Clock3 className="h-4 w-4" />} detail={promptsUsedLabel} />
              <ContextRow active={accessTier === 'short-course'} label="Short-course AI" icon={<LockKeyhole className="h-4 w-4" />} detail={accessTier === 'short-course' ? 'Active' : 'General mode'} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick tools</p>
            <div className="grid gap-2">
              {quickTools.map((tool) => (
                <Button key={tool} type="button" variant="outline" className="justify-start rounded-2xl bg-background/70" onClick={() => onPromptSelect?.(tool)}>
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {tool}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function ContextRow({ active, label, detail, icon }: { active: boolean; label: string; detail: string | null | undefined; icon: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border bg-background/70 p-3">
      <div className="flex items-center gap-2">
        <span className={active ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span className="max-w-[46%] truncate text-right text-xs text-muted-foreground">{active ? detail : 'Off'}</span>
    </div>
  );
}
