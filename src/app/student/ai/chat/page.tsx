'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAiContext } from '@/lib/ai-context';
import { useSession } from '@/components/providers/session-provider';
import { getAiAccessPolicy } from '@/lib/ai-access';
import { recordLearningEvent } from '@/lib/api/student-gamification';
import { NovaChatShell } from '@/components/ai/nova-chat-shell';
import { getNovaModeInstruction, type NovaMode } from '@/components/ai/nova-mode-selector';
import type { NovaChatMessage } from '@/components/ai/nova-message';

type AiResponse = { text?: string; message?: string; error?: string };

const STORAGE_KEY = 'univai_ai_chat';

async function requestAiResponse(prompt: string, context: string, accessTier: string, mode: NovaMode, courseId?: string | null, lessonId?: string | null) {
  const isShortCourse = Boolean(courseId);
  const endpoint = isShortCourse ? `/students/me/short-courses/${courseId}/ai` : '/ai/generate';
  const data = await apiFetch<AiResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      mode,
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
  const [messages, setMessages] = useState<NovaChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<NovaMode>('tutor');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setMessages(JSON.parse(stored) as NovaChatMessage[]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const historyPrompt = useMemo(
    () => messages.slice(-6).map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`).join('\n'),
    [messages]
  );

  const fullContext = useMemo(
    () => [
      context,
      `Nova mode: ${mode}`,
      `Nova instruction: ${getNovaModeInstruction(mode)}`,
      courseId ? `Current Journey ID: ${courseId}` : '',
      lessonId ? `Current lesson ID: ${lessonId}` : '',
    ].filter(Boolean).join('\n'),
    [context, courseId, lessonId, mode]
  );

  function selectPrompt(prompt: string) {
    setInput(prompt);
  }

  async function handleSend() {
    if (!input.trim() || loading || !policy.features.chat) return;
    const userMessage: NovaChatMessage = { role: 'user', content: input.trim().slice(0, policy.maxPromptCharacters), createdAt: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setLastError(null);

    try {
      const prompt = `${historyPrompt}\nUser: ${userMessage.content}\nAssistant:`;
      const reply = await requestAiResponse(prompt, fullContext, policy.tier, mode, courseId, lessonId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.trim() || 'No response returned.', createdAt: Date.now() }]);
      await recordLearningEvent({
        type: 'ai_help_used',
        courseId: courseId ?? undefined,
        lessonId: lessonId ?? undefined,
        metadata: { source: courseId ? 'short_course_ai_chat' : 'ai_chat', promptLength: userMessage.content.length, mode },
      }).catch((error) => console.warn('Gamification event failed', error));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI service is unavailable right now.';
      setLastError(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Nova could not respond: ${message}`, createdAt: Date.now() }]);
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
    <NovaChatShell
      messages={messages}
      input={input}
      mode={mode}
      loading={loading}
      lastError={lastError}
      policyLabel={policy.label}
      policyTier={policy.tier}
      dailyPromptLimit={policy.dailyPromptLimit}
      maxPromptCharacters={policy.maxPromptCharacters}
      courseId={courseId}
      lessonId={lessonId}
      chatEnabled={policy.features.chat}
      listRef={listRef}
      onModeChange={setMode}
      onInputChange={setInput}
      onSend={handleSend}
      onClear={handleClear}
      onPromptSelect={selectPrompt}
    />
  );
}
