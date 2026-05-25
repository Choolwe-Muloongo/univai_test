'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAiContext } from '@/lib/ai-context';
import { useSession } from '@/components/providers/session-provider';
import { getAiAccessPolicy } from '@/lib/ai-access';
import { recordLearningEvent } from '@/lib/api/student-gamification';
import { getShortCourseProgress, type ShortCourseProgress } from '@/lib/api/short-courses';
import { NovaChatShell } from '@/components/ai/nova-chat-shell';
import { getNovaModeInstruction, type NovaMode } from '@/components/ai/nova-mode-selector';
import type { NovaChatMessage } from '@/components/ai/nova-message';
import { getNovaIntentPrompt, isValidNovaMode } from '@/lib/nova-context';

type AiResponse = { text?: string; message?: string; error?: string; quota?: { hourlyLimit?: number; dailyLimit?: number; hourlyUsed?: number; dailyUsed?: number } };

function storageKey(courseId?: string | null, lessonId?: string | null) {
  if (courseId && lessonId) return `univai_ai_chat:${courseId}:${lessonId}`;
  if (courseId) return `univai_ai_chat:${courseId}`;
  return 'univai_ai_chat:general';
}

async function requestAiResponse(prompt: string, context: string, accessTier: string, mode: NovaMode, courseId?: string | null, lessonId?: string | null, extra?: Record<string, string | null>) {
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
      cardId: extra?.cardId ?? undefined,
      questionId: extra?.questionId ?? undefined,
      attemptId: extra?.attemptId ?? undefined,
      mistakeId: extra?.mistakeId ?? undefined,
    }),
  });
  if (data.error) throw new Error(data.error);
  return { text: data.text || data.message || 'No response returned.', quota: data.quota };
}

export default function AiChatPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');
  const cardId = searchParams.get('cardId');
  const questionId = searchParams.get('questionId');
  const attemptId = searchParams.get('attemptId');
  const mistakeId = searchParams.get('mistakeId');
  const intent = searchParams.get('intent');
  const modeParam = searchParams.get('mode');
  const initialMode = isValidNovaMode(modeParam) ? modeParam : 'tutor';
  const context = useAiContext();
  const { session } = useSession();
  const policy = getAiAccessPolicy(session?.user?.role);
  const [messages, setMessages] = useState<NovaChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<NovaMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ShortCourseProgress | null>(null);
  const [quotaSummary, setQuotaSummary] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const currentStorageKey = useMemo(() => storageKey(courseId, lessonId), [courseId, lessonId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(currentStorageKey);
    if (!stored) {
      setMessages([]);
      return;
    }
    try {
      setMessages(JSON.parse(stored) as NovaChatMessage[]);
    } catch {
      localStorage.removeItem(currentStorageKey);
      setMessages([]);
    }
  }, [currentStorageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(currentStorageKey, JSON.stringify(messages));
  }, [messages, currentStorageKey]);

  useEffect(() => {
    if (isValidNovaMode(modeParam)) {
      setMode(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    const prompt = getNovaIntentPrompt(intent);
    if (prompt) {
      setInput((current) => current || prompt);
    }
  }, [intent]);

  useEffect(() => {
    if (!courseId) {
      setProgress(null);
      return;
    }
    let mounted = true;
    getShortCourseProgress(courseId).then((data) => {
      if (mounted) setProgress(data);
    }).catch(() => {
      if (mounted) setProgress(null);
    });
    return () => { mounted = false; };
  }, [courseId]);

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
      intent ? `Nova intent: ${intent}` : '',
      `Nova instruction: ${getNovaModeInstruction(mode)}`,
      courseId ? `Current Journey ID: ${courseId}` : '',
      lessonId ? `Current lesson ID: ${lessonId}` : '',
      cardId ? `Current card ID: ${cardId}` : '',
      questionId ? `Current question ID: ${questionId}` : '',
      attemptId ? `Current attempt ID: ${attemptId}` : '',
      mistakeId ? `Current mistake ID: ${mistakeId}` : '',
      progress ? `Short-course progress: ${progress.progress}%` : '',
      progress ? `Short-course access plan: ${progress.accessPlan ?? 'none'}` : '',
      progress ? `Short-course AI plan: ${progress.aiPlan ?? 'none'}` : '',
      progress ? `Short-course AI quota: ${progress.hourlyAiQuota ?? 0}/hour, ${progress.dailyAiQuota ?? 0}/day` : '',
      progress?.aiAccessExpiresAt ? `Short-course AI expires at: ${progress.aiAccessExpiresAt}` : '',
    ].filter(Boolean).join('\n'),
    [context, courseId, lessonId, cardId, questionId, attemptId, mistakeId, progress, mode, intent]
  );

  const policyLabel = courseId
    ? progress?.aiPlan ? `Short-course AI · ${progress.aiPlan.replace(/_/g, ' ')}` : 'Short-course AI'
    : policy.label;
  const dailyLimit = courseId ? progress?.dailyAiQuota ?? policy.dailyPromptLimit : policy.dailyPromptLimit;
  const maxPromptCharacters = courseId ? Math.min(6000, Math.max(1200, policy.maxPromptCharacters)) : policy.maxPromptCharacters;
  const chatEnabled = courseId ? Boolean((progress?.dailyAiQuota ?? 0) > 0 && (progress?.hourlyAiQuota ?? 0) > 0) : policy.features.chat;

  function selectPrompt(prompt: string) {
    setInput(prompt);
  }

  async function handleSend() {
    if (!input.trim() || loading || !chatEnabled) return;
    const userMessage: NovaChatMessage = { role: 'user', content: input.trim().slice(0, maxPromptCharacters), createdAt: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setLastError(null);

    try {
      const prompt = `${historyPrompt}\nUser: ${userMessage.content}\nAssistant:`;
      const reply = await requestAiResponse(prompt, fullContext, policy.tier, mode, courseId, lessonId, { cardId, questionId, attemptId, mistakeId });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.text.trim() || 'No response returned.', createdAt: Date.now() }]);
      if (reply.quota?.dailyLimit) {
        setQuotaSummary(`${reply.quota.dailyUsed ?? 0}/${reply.quota.dailyLimit} daily prompts used`);
      }
      await recordLearningEvent({
        type: 'ai_help_used',
        courseId: courseId ?? undefined,
        lessonId: lessonId ?? undefined,
        metadata: { source: courseId ? 'short_course_ai_chat' : 'ai_chat', promptLength: userMessage.content.length, mode, intent: intent ?? undefined, cardId: cardId ?? undefined, questionId: questionId ?? undefined },
      }).catch((error) => console.warn('Gamification event failed', error));
    } catch (error) {
      const message = friendlyAiError(error);
      setLastError(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: message, createdAt: Date.now() }]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([]);
    setLastError(null);
    if (typeof window !== 'undefined') localStorage.removeItem(currentStorageKey);
  }

  return (
    <NovaChatShell
      messages={messages}
      input={input}
      mode={mode}
      loading={loading}
      lastError={lastError}
      policyLabel={quotaSummary ? `${policyLabel} · ${quotaSummary}` : policyLabel}
      policyTier={courseId ? 'short-course' : policy.tier}
      dailyPromptLimit={dailyLimit}
      maxPromptCharacters={maxPromptCharacters}
      courseId={courseId}
      lessonId={lessonId}
      chatEnabled={chatEnabled}
      listRef={listRef}
      onModeChange={setMode}
      onInputChange={setInput}
      onSend={handleSend}
      onClear={handleClear}
      onPromptSelect={selectPrompt}
    />
  );
}

function friendlyAiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/hourly AI study limit|available again/i.test(message)) return 'Nova is resting for a short cooldown. Try again in about 30 minutes, or continue with the next lesson while your limit refreshes.';
  if (/daily AI limit|not included/i.test(message)) return 'Your current course plan does not include more Nova prompts right now. Upgrade or renew AI access from the course access panel.';
  if (/unsupported AI mode/i.test(message)) return 'Nova could not open that mode. I switched the request into a supported learning mode; try sending it again.';
  if (/not configured|provider|ApiFree|temporarily unavailable/i.test(message)) return 'Nova is temporarily unavailable. Please try again shortly.';
  if (/Prompt exceeds/i.test(message)) return 'That message is too long for Nova. Shorten it a little and send again.';
  return message || 'Nova could not respond right now. Please try again shortly.';
}
