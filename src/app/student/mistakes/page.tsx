'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

import { NovaInlineActions } from '@/components/ai/nova-inline-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getStudentMistakes, markMistakeReviewed, type MistakeBankItem } from '@/lib/api/student-gamification';

export default function MistakeBankPage() {
  const [mistakes, setMistakes] = useState<MistakeBankItem[] | null>(null);
  const [busy, setBusy] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setMistakes(await getStudentMistakes());
  }

  useEffect(() => {
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load Mistake Bank.'));
  }, []);

  async function review(id: string | number) {
    setBusy(id);
    try {
      await markMistakeReviewed(id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update mistake.');
    } finally {
      setBusy(null);
    }
  }

  if (error) return <PageError message={error} actionHref="/student/courses" actionLabel="Back to Journeys" />;
  if (!mistakes) return <PageLoading message="Loading Mistake Bank..." />;

  const openMistakes = mistakes.filter((item) => !item.fixed);
  const fixedMistakes = mistakes.filter((item) => item.fixed);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mistake Bank</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Every wrong answer becomes useful data</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Nova uses mistakes to recommend rescue battles, explain weak areas, and help students fix problems before the Final Trial.</p>
      </section>

      <NovaInlineActions
        title="Nova Mistake Coach"
        description="Turn mistakes into practice. Nova opens with Mistake Bank context and waits for you to send."
        actions={[
          { label: 'Explain this mistake', mode: 'explain', intent: 'explain_mistake' },
          { label: 'Give similar practice', mode: 'quiz', intent: 'similar_mistake_practice' },
          { label: 'Help me fix weak area', mode: 'tutor', intent: 'fix_weak_area' },
        ]}
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Stat label="Mistakes to fix" value={openMistakes.length} />
        <Stat label="Fixed mistakes" value={fixedMistakes.length} />
        <Stat label="XP opportunity" value={`+${openMistakes.length * 30}`} />
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Fix today</h2>
        {openMistakes.length ? openMistakes.map((item) => (
          <Card key={item.id} className="rounded-3xl">
            <CardHeader>
              <CardTitle>{item.topic || 'Learning weakness'}</CardTitle>
              <CardDescription>{item.difficulty || 'mixed'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'recent'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Box label="Question" value={item.question} />
              <Box label="Your answer" value={item.studentAnswer || 'No answer recorded'} />
              <Box label="Expected answer" value={item.correctAnswer || 'Model answer not recorded'} />
              {item.explanation ? <Box label="Explanation" value={item.explanation} /> : null}
              <NovaInlineActions
                title="Ask Nova about this mistake"
                description="Open Nova with this mistake attached so the explanation starts in the right place."
                mistakeId={String(item.id)}
                compact
                actions={[
                  { label: 'Explain mistake', mode: 'explain', intent: 'explain_mistake' },
                  { label: 'Practice similar', mode: 'quiz', intent: 'similar_mistake_practice' },
                  { label: 'Fix weak area', mode: 'tutor', intent: 'fix_weak_area' },
                ]}
              />
              <Button onClick={() => review(item.id)} disabled={busy === item.id} className="w-full sm:w-auto"><RotateCcw className="mr-2 h-4 w-4" /> {busy === item.id ? 'Updating...' : 'Mark as fixed'}</Button>
            </CardContent>
          </Card>
        )) : <Card className="rounded-3xl border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">No open mistakes. Keep training to maintain that clean record.</CardContent></Card>}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <Card className="rounded-3xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></CardContent></Card>;
}

function Box({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> {label}</p><p className="leading-6">{value}</p></div>;
}
