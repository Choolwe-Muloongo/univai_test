'use client';

import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, SendHorizonal, Sparkles, Trash2 } from 'lucide-react';
import { NovaContextPanel } from './nova-context-panel';
import { NovaMessage, type NovaChatMessage } from './nova-message';
import { NovaModeSelector, type NovaMode } from './nova-mode-selector';
import { NovaSuggestionChips } from './nova-suggestion-chips';

type NovaChatShellProps = {
  messages: NovaChatMessage[];
  input: string;
  mode: NovaMode;
  loading: boolean;
  lastError?: string | null;
  policyLabel: string;
  policyTier: string;
  dailyPromptLimit: number;
  maxPromptCharacters: number;
  courseId?: string | null;
  lessonId?: string | null;
  chatEnabled: boolean;
  listRef?: RefObject<HTMLDivElement>;
  onModeChange: (mode: NovaMode) => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
  onPromptSelect: (prompt: string) => void;
};

export function NovaChatShell(props: NovaChatShellProps) {
  const {
    messages,
    input,
    mode,
    loading,
    lastError,
    policyLabel,
    policyTier,
    dailyPromptLimit,
    maxPromptCharacters,
    courseId,
    lessonId,
    chatEnabled,
    listRef,
    onModeChange,
    onInputChange,
    onSend,
    onClear,
    onPromptSelect,
  } = props;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 overflow-hidden px-3 py-3 sm:space-y-6 sm:px-5 sm:py-5">
      <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-background to-background p-4 shadow-[0_30px_90px_-60px_hsl(var(--primary))] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Nova Mentor
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-4xl">Nova Mentor</h1>
              <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-muted-foreground sm:text-base">Your AI learning coach for lessons, practice, revision, coding help, and study planning.</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2 lg:justify-end">
            <Badge variant="secondary" className="max-w-full px-3 py-1.5 text-[11px] sm:text-xs">{policyLabel}: {dailyPromptLimit} prompts/day</Badge>
            {courseId ? <Badge variant="outline" className="bg-background/70 px-3 py-1.5 text-[11px] sm:text-xs">Journey context active</Badge> : null}
            {lessonId ? <Badge variant="outline" className="bg-background/70 px-3 py-1.5 text-[11px] sm:text-xs">Mission context active</Badge> : null}
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5">
        <main className="min-w-0 space-y-4">
          <NovaModeSelector value={mode} onChange={onModeChange} disabled={loading} />
          <Card className="min-w-0 overflow-hidden border-primary/10 bg-background/95">
            <CardHeader className="border-b bg-muted/20 px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="flex min-w-0 items-center gap-2 break-words text-base font-semibold sm:text-lg"><Sparkles className="h-5 w-5 shrink-0 text-primary" /> Learning conversation</h2>
                  <p className="mt-1 break-words text-sm text-muted-foreground">Ask Nova with your current journey and mission context attached.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="min-h-10 w-full rounded-xl sm:w-fit" onClick={onClear}><Trash2 className="h-4 w-4" /> Clear chat</Button>
              </div>
              <div className="pt-3"><NovaSuggestionChips mode={mode} onSelect={onPromptSelect} disabled={loading} /></div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-5">
              {lastError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{lastError}</div> : null}
              <div ref={listRef} className="min-h-[48svh] max-h-[58svh] min-w-0 space-y-4 overflow-y-auto rounded-3xl border bg-muted/15 p-3 sm:min-h-[420px] sm:space-y-5 sm:p-4">
                {messages.length === 0 ? (
                  <div className="flex min-h-[42svh] items-center justify-center text-center sm:min-h-[340px]">
                    <div className="max-w-md space-y-3">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 text-primary"><Sparkles className="h-7 w-7" /></div>
                      <h3 className="text-lg font-semibold sm:text-xl">Ask Nova where to begin.</h3>
                      <p className="text-sm leading-6 text-muted-foreground">Choose a mode, tap a suggestion, or type your own question.</p>
                    </div>
                  </div>
                ) : messages.map((message) => <NovaMessage key={`${message.createdAt}-${message.role}`} message={message} onAction={onPromptSelect} />)}
                {loading ? <div className="rounded-3xl border bg-background px-4 py-3 text-sm text-muted-foreground"><Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" /> Nova is thinking...</div> : null}
              </div>
              <div className="rounded-3xl border bg-background p-3 shadow-sm">
                <Textarea value={input} onChange={(event) => onInputChange(event.target.value)} placeholder={`Ask Nova anything... (${maxPromptCharacters} characters max)`} className="min-h-24 resize-none border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 sm:min-h-28" />
                <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">{input.length}/{maxPromptCharacters}{!chatEnabled ? ' • AI chat is not available for this role or plan.' : ''}</div>
                  <Button type="button" className="min-h-11 w-full rounded-2xl sm:w-auto" onClick={onSend} disabled={loading || !input.trim() || !chatEnabled}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />} Send to Nova</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <NovaContextPanel accessLabel={courseId ? 'Short-course AI' : policyLabel} accessTier={courseId ? 'short-course' : policyTier} dailyPromptLimit={dailyPromptLimit} courseId={courseId} lessonId={lessonId} onPromptSelect={onPromptSelect} />
      </div>
    </div>
  );
}
