// src/components/layout/ai-tutor-widget.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { buildNovaChatHref, getNovaQuickActions, getNovaRouteContext } from '@/lib/nova-context';
import { ArrowUpRight, Bot, MessageCircle, Sparkles, X, Zap } from 'lucide-react';

export function AiTutorWidget() {
  const pathname = usePathname();
  const context = getNovaRouteContext(pathname ?? '/student');
  const actions = getNovaQuickActions(context.page);
  const fullChatHref = buildNovaChatHref({ label: 'Open full Nova Chat', mode: 'tutor', intent: 'current_page_help' }, context);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full border border-primary/25 bg-primary text-primary-foreground shadow-[0_24px_60px_-28px_hsl(var(--primary))] hover:bg-primary/90 md:bottom-6 md:right-6 md:h-16 md:w-16"
          size="icon"
        >
          <Sparkles className="h-6 w-6 md:h-7 md:w-7" />
          <span className="sr-only">Open Nova Mentor</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="mr-2 w-[min(calc(100vw-2rem),24rem)] rounded-3xl border-primary/15 p-0 shadow-[0_30px_90px_-55px_hsl(var(--foreground))] md:mr-4" side="top" align="end">
        <div className="overflow-hidden rounded-3xl bg-background">
          <div className="bg-gradient-to-br from-primary/15 via-background to-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold leading-none">Nova Mentor</h4>
                  <p className="mt-1.5 text-sm text-muted-foreground">I can help with this page.</p>
                </div>
              </div>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close Nova Mentor</span>
                </Button>
              </PopoverTrigger>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {context.label}
              </Badge>
              {context.courseId ? <Badge variant="outline">Journey attached</Badge> : null}
              {context.lessonId ? <Badge variant="outline">Mission attached</Badge> : null}
            </div>
          </div>

          <Separator />

          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Zap className="h-3.5 w-3.5" /> Quick actions
            </div>

            <div className="grid gap-2">
              {actions.map((action) => (
                <Link
                  key={`${action.mode}-${action.intent}`}
                  href={buildNovaChatHref(action, context)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border bg-background/80 p-3 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium leading-5">{action.label}</span>
                      <span className="text-xs capitalize text-muted-foreground">{action.mode.replace('_', ' ')}</span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>

            <Button asChild className="w-full justify-between rounded-2xl">
              <Link href={fullChatHref}>
                Open full Nova Chat
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
