// src/components/layout/ai-tutor-widget.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { buildNovaChatHref, getNovaQuickActions, getNovaRouteContext } from '@/lib/nova-context';
import { ArrowUpRight, Bot, MessageCircle, Sparkles, X, Zap } from 'lucide-react';

export function AiTutorWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = getNovaRouteContext(pathname ?? '/student', searchParams);
  const actions = getNovaQuickActions(context.page);
  const fullChatHref = buildNovaChatHref({ label: 'Open full Nova Chat', mode: 'tutor', intent: 'current_page_help' }, context);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-20 right-3 z-40 h-12 w-12 rounded-full border border-primary/25 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-6 md:right-6 md:h-16 md:w-16"
        size="icon"
        aria-expanded={open}
        aria-label={open ? 'Close Nova Mentor' : 'Open Nova Mentor'}
      >
        {open ? <X className="h-5 w-5 md:h-6 md:w-6" /> : <Sparkles className="h-5 w-5 md:h-7 md:w-7" />}
      </Button>

      {open ? (
        <div className="fixed bottom-[8.5rem] right-3 z-40 w-[min(calc(100vw-1.5rem),24rem)] rounded-3xl border border-primary/15 bg-background shadow-2xl md:bottom-24 md:right-6">
          <div className="overflow-hidden rounded-3xl">
            <div className="bg-gradient-to-br from-primary/15 via-background to-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-semibold leading-none">Nova Mentor</h4>
                    <p className="mt-1.5 break-words text-sm text-muted-foreground">I can help with this page.</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close Nova Mentor</span>
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {context.label}
                </Badge>
                {context.courseId ? <Badge variant="outline">Journey attached</Badge> : null}
                {context.lessonId ? <Badge variant="outline">Mission attached</Badge> : null}
                {context.cardId ? <Badge variant="outline">Card attached</Badge> : null}
                {context.mistakeId ? <Badge variant="outline">Mistake attached</Badge> : null}
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
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between gap-3 rounded-2xl border bg-background/80 p-3 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-medium leading-5">{action.label}</span>
                        <span className="text-xs capitalize text-muted-foreground">{action.mode.replace('_', ' ')}</span>
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                  </Link>
                ))}
              </div>

              <Button asChild className="w-full justify-between rounded-2xl">
                <Link href={fullChatHref} onClick={() => setOpen(false)}>
                  Open full Nova Chat
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
