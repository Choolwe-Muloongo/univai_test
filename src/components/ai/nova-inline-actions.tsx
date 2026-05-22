'use client';

import Link from 'next/link';
import { ArrowUpRight, Bot, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NovaMode } from '@/components/ai/nova-mode-selector';

export type NovaInlineAction = {
  label: string;
  mode: NovaMode;
  intent: string;
  description?: string;
};

type NovaInlineActionsProps = {
  title?: string;
  description?: string;
  courseId?: string | null;
  lessonId?: string | null;
  cardId?: string | null;
  mistakeId?: string | null;
  attemptId?: string | null;
  questionId?: string | null;
  actions: NovaInlineAction[];
  compact?: boolean;
  className?: string;
};

function buildHref(action: NovaInlineAction, context: Omit<NovaInlineActionsProps, 'actions' | 'title' | 'description' | 'compact' | 'className'>) {
  const params = new URLSearchParams({ mode: action.mode, intent: action.intent });
  if (context.courseId) params.set('courseId', context.courseId);
  if (context.lessonId) params.set('lessonId', context.lessonId);
  if (context.cardId) params.set('cardId', context.cardId);
  if (context.mistakeId) params.set('mistakeId', context.mistakeId);
  if (context.attemptId) params.set('attemptId', context.attemptId);
  if (context.questionId) params.set('questionId', context.questionId);
  return `/student/ai/chat?${params.toString()}`;
}

export function NovaInlineActions({
  title = 'Ask Nova',
  description = 'Get help without leaving your learning flow.',
  courseId,
  lessonId,
  cardId,
  mistakeId,
  attemptId,
  questionId,
  actions,
  compact = false,
  className,
}: NovaInlineActionsProps) {
  if (!actions.length) return null;

  const context = { courseId, lessonId, cardId, mistakeId, attemptId, questionId };

  return (
    <Card className={cn('overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background', className)}>
      <CardHeader className={cn('pb-3', compact && 'p-3 pb-2')}>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </span>
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-3 w-3" /> Nova
          </Badge>
        </CardTitle>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className={cn('grid gap-2', compact ? 'p-3 pt-0 sm:grid-cols-2' : 'p-4 pt-0 sm:grid-cols-2 lg:grid-cols-4')}>
        {actions.map((action) => (
          <Link
            key={`${action.mode}-${action.intent}-${action.label}`}
            href={buildHref(action, context)}
            className="group rounded-2xl border bg-background/85 p-3 transition hover:border-primary/30 hover:bg-primary/5"
            aria-label={`Ask Nova: ${action.label}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span>
                <span className="block text-sm font-semibold leading-5">{action.label}</span>
                {action.description ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{action.description}</span> : null}
                <span className="mt-1 block text-[11px] capitalize text-muted-foreground">{action.mode.replace('_', ' ')}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
