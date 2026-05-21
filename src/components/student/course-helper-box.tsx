'use client';

import { useState } from 'react';
import { askShortCourseAi } from '@/lib/api/short-course-ai';

export function CourseHelperBox({ courseId, courseTitle, lessonId, lessonTitle }: { courseId: string; courseTitle?: string | null; lessonId?: string | null; lessonTitle?: string | null }) {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(text?: string) {
    const message = (text ?? prompt).trim();
    if (!message || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await askShortCourseAi({ prompt: message, courseId, courseTitle, lessonId, lessonTitle });
      setAnswer(response.text || 'No response returned.');
      setPrompt('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Service unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold text-primary">Journey Helper</p>
        <p className="text-sm text-muted-foreground">Get guidance based on this course and lesson.</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {['Explain this simply', 'Give an example', 'Quiz me', 'What should I revise?'].map((item) => (
          <button key={item} type="button" onClick={() => submit(item)} className="rounded-full border px-3 py-1 text-xs hover:border-primary" disabled={busy}>{item}</button>
        ))}
      </div>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-24 w-full rounded-2xl border bg-background p-3 text-sm" placeholder="Ask about this course..." />
      <button type="button" onClick={() => submit()} disabled={busy || !prompt.trim()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{busy ? 'Working...' : 'Ask'}</button>
      {error ? <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
      {answer ? <div className="mt-3 whitespace-pre-wrap rounded-2xl border bg-muted/20 p-3 text-sm leading-6">{answer}</div> : null}
    </section>
  );
}
