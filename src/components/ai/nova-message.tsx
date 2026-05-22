'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpenCheck, ClipboardList, FileText, Lightbulb, ListChecks, MessageCircle, Sparkles } from 'lucide-react';

export type NovaChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

type NovaMessageProps = {
  message: NovaChatMessage;
  onAction?: (prompt: string) => void;
};

const assistantActions = [
  { label: 'Explain simpler', prompt: 'Explain this in simpler words.', icon: Lightbulb },
  { label: 'Give example', prompt: 'Give a practical example.', icon: BookOpenCheck },
  { label: 'Quiz me', prompt: 'Quiz me on this, one question at a time.', icon: ListChecks },
  { label: 'Summarize', prompt: 'Summarize this into short revision notes.', icon: FileText },
  { label: 'Create practice', prompt: 'Create practice questions on this topic.', icon: ClipboardList },
  { label: 'Study notes', prompt: 'Convert this into clean study notes.', icon: MessageCircle },
];

export function NovaAvatar() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_18px_45px_-30px_hsl(var(--primary))]">
      <Sparkles className="h-5 w-5" />
    </div>
  );
}

export function NovaMessage({ message, onAction }: NovaMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? <NovaAvatar /> : null}
      <div className="max-w-[92%] space-y-2 sm:max-w-[78%]">
        <div
          className={cn(
            'whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm',
            isUser
              ? 'rounded-br-md bg-primary text-primary-foreground shadow-[0_18px_42px_-28px_hsl(var(--primary))]'
              : 'rounded-bl-md border bg-background/95 text-foreground'
          )}
        >
          {message.content}
        </div>
        {!isUser && onAction ? (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {assistantActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => onAction(action.prompt)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
