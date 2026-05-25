'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bot, CheckCircle2, Clock3, GraduationCap, History, Layers3, LockKeyhole, MessageSquareText, Route, ShieldCheck } from 'lucide-react';
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

type HistoryItem = { key: string; href: string; title: string; subtitle: string; count: number; active: boolean };

export function NovaContextPanel({
  accessLabel,
  accessTier,
  dailyPromptLimit,
  courseId,
  lessonId,
  promptsUsedLabel = 'Tracked by your access policy',
  onPromptSelect,
}: NovaContextPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const hasJourney = Boolean(courseId);
  const hasLesson = Boolean(lessonId);
  const activeContext = [hasJourney ? 'Journey' : null, hasLesson ? 'Mission' : null].filter(Boolean).join(' + ') || 'General study';
  const activeKey = useMemo(() => {
    if (courseId && lessonId) return `univai_ai_chat:${courseId}:${lessonId}`;
    if (courseId) return `univai_ai_chat:${courseId}`;
    return 'univai_ai_chat:general';
  }, [courseId, lessonId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items: HistoryItem[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('univai_ai_chat:')) continue;
      let count = 0;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        count = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        count = 0;
      }
      if (count > 0) items.push(toHistoryItem(key, count, key === activeKey));
    }
    setHistory(items.sort((a, b) => Number(b.active) - Number(a.active) || b.count - a.count).slice(0, 8));
  }, [activeKey]);

  const quickTools = [
    'Build my study plan',
    'Show my weak areas',
    'Prepare me for the final trial',
    'Create a rescue drill',
  ];

  return (
    <aside className="min-w-0 space-y-4">
      <NovaInsightCard
        currentMission={hasLesson ? `Mission ID: ${lessonId}` : hasJourney ? 'Journey learning session' : 'General UnivAI study'}
        weakArea={hasLesson ? 'Use Nova after each difficult card to build stronger recall.' : 'Ask a focused question to help Nova identify your weak area.'}
        recommendation={hasLesson ? 'Ask Nova to quiz you on this mission before you continue.' : 'Start with a study plan or ask Nova what to revise first.'}
        actionLabel="Use recommendation"
        onAction={onPromptSelect ? () => onPromptSelect(hasLesson ? 'Quiz me on this mission.' : 'Create a focused study plan for me.') : undefined}
      />

      <Card className="border-primary/10 bg-background/90">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" /> Chat History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length ? history.map((item) => (
            <Button key={item.key} asChild variant={item.active ? 'secondary' : 'outline'} className="h-auto min-h-12 w-full justify-start rounded-2xl bg-background/70 px-3 py-3 text-left">
              <Link href={item.href}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.subtitle} · {item.count} message{item.count === 1 ? '' : 's'}</span>
                </span>
              </Link>
            </Button>
          )) : <p className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">No saved Nova chats yet. Your conversations will appear here after you send messages.</p>}
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-background/90">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" /> Nova Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><Route className="h-4 w-4 shrink-0" /> <span className="truncate">Active context</span></span>
              <Badge variant="secondary" className="shrink-0">{activeContext}</Badge>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" /> <span className="truncate">AI access tier</span></span>
              <Badge variant="outline" className="max-w-[52%] truncate">{accessLabel}</Badge>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><MessageSquareText className="h-4 w-4 shrink-0" /> <span className="truncate">Daily prompt limit</span></span>
              <Badge className="shrink-0">{dailyPromptLimit}/day</Badge>
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
                <Button key={tool} type="button" variant="outline" className="min-h-11 justify-start rounded-2xl bg-background/70 text-left" onClick={() => onPromptSelect?.(tool)}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> <span className="min-w-0 truncate">{tool}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function toHistoryItem(key: string, count: number, active: boolean): HistoryItem {
  const parts = key.split(':');
  const courseId = parts[1] && parts[1] !== 'general' ? parts[1] : null;
  const lessonId = parts[2] ?? null;
  const params = new URLSearchParams();
  if (courseId) params.set('courseId', courseId);
  if (lessonId) params.set('lessonId', lessonId);
  return {
    key,
    href: `/student/ai/chat${params.toString() ? `?${params.toString()}` : ''}`,
    title: courseId ? lessonId ? 'Mission chat' : 'Journey chat' : 'General Nova chat',
    subtitle: courseId ? lessonId ? `Journey ${courseId} · Mission ${lessonId}` : `Journey ${courseId}` : 'General study',
    count,
    active,
  };
}

function ContextRow({ active, label, detail, icon }: { active: boolean; label: string; detail: string | null | undefined; icon: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border bg-background/70 p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={active ? 'shrink-0 text-primary' : 'shrink-0 text-muted-foreground'}>{icon}</span>
        <span className="min-w-0 truncate font-medium">{label}</span>
      </div>
      <span className="max-w-[46%] truncate text-right text-xs text-muted-foreground">{active ? detail : 'Off'}</span>
    </div>
  );
}
