'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAiContext } from '@/lib/ai-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { getAiAccessPolicy } from '@/lib/ai-access';
import { recordLearningEvent } from '@/lib/api/student-gamification';

type ChatMessage = { role: 'user' | 'assistant'; content: string; createdAt: number };
type AiResponse = { text?: string; message?: string; error?: string };

const STORAGE_KEY = 'univai_ai_chat';
const suggestions = [
  'Explain this lesson in simple words.',
  'Create a 5-step catch-up plan.',
  'Summarize what I should revise today.',
  'Give me 3 practice questions.',
];

async function requestAiResponse(prompt: string, context: string, accessTier: string, courseId?: string | null, lessonId?: string | null) {
  const isShortCourse = Boolean(courseId);
  const endpoint = isShortCourse ? `/students/me/short-courses/${courseId}/ai` : '/ai/generate';
  const data = await apiFetch<AiResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      mode: 'tutor',
      context,
      accessTier: isShortCourse ? 'short-course' : accessTier,
      feature: isShortCourse ? 'short_course_ai' : 'chat',
      courseId: courseId ?? undefined,
      shortCourseId: courseId ?? undefined,
      lessonId: lessonId ?? undefined,
    }),
  });
  return data.text || data.message || data.error || 'No response returned.';
}

export default function AiChatPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');
  const context = useAiContext();
  const { session } = useSession();
  const policy = getAiAccessPolicy(session?.user?.role);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try { setMessages(JSON.parse(stored) as ChatMessage[]); } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const historyPrompt = useMemo(() => messages.slice(-6).map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`).join('\n'), [messages]);
  const fullContext = useMemo(() => [context, courseId ? `Current Journey ID: ${courseId}` : '', lessonId ? `Current lesson ID: ${lessonId}` : ''].filter(Boolean).join('\n'), [context, courseId, lessonId]);

  async function handleSend() {
    if (!input.trim() || loading || !policy.features.chat) return;
    const userMessage: ChatMessage = { role: 'user', content: input.trim().slice(0, policy.maxPromptCharacters), createdAt: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setLastError(null);

    try {
      const prompt = `${historyPrompt}\nUser: ${userMessage.content}\nAssistant:`;
      const reply = await requestAiResponse(prompt, fullContext, policy.tier, courseId, lessonId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.trim() || 'No response returned.', createdAt: Date.now() }]);
      await recordLearningEvent({ type: 'ai_help_used', courseId: courseId ?? undefined, lessonId: lessonId ?? undefined, metadata: { source: courseId ? 'short_course_ai_chat' : 'ai_chat', promptLength: userMessage.content.length } }).catch((error) => console.warn('Gamification event failed', error));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI service is unavailable right now.';
      setLastError(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: `AI could not respond: ${message}`, createdAt: Date.now() }]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([]);
    setLastError(null);
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-muted-foreground">Ask questions, get explanations, and plan your next study steps.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{courseId ? 'Short-course AI' : policy.label}: {policy.dailyPromptLimit} prompts/day</Badge>
          {courseId ? <Badge variant="outline">Journey context active</Badge> : null}
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> UnivAI Assistant</CardTitle>
              <CardDescription>Responses follow your current AI limits.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear}>Clear chat</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => <Badge key={suggestion} variant="secondary" className="cursor-pointer" onClick={() => setInput(suggestion)}>{suggestion}</Badge>)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastError ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{lastError}</div> : null}
          <div ref={listRef} className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-4">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Start by asking a question about your course, lesson, or study plan.</p>}
            {messages.map((message) => <div key={`${message.createdAt}-${message.role}`} className={`whitespace-pre-wrap rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}>{message.content}</div>)}
            {loading && <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground"><Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />Thinking...</div>}
          </div>
          <div className="space-y-2">
            <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Ask about your courses, assignments, or study plan (${policy.maxPromptCharacters} characters max)...`} className="min-h-24" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{input.length}/{policy.maxPromptCharacters}</p>
              <Button onClick={handleSend} disabled={loading || !input.trim() || !policy.features.chat}>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
