'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getShortCoursePractice, submitShortCoursePractice, type PracticeAnswer, type PracticeResult, type ShortCoursePracticePayload } from '@/lib/api/short-courses';

type Mode = 'level' | 'custom';

const levels = [
  { key: 'easy', label: 'Easy', count: 50, timeMinutes: 35 },
  { key: 'medium', label: 'Medium', count: 50, timeMinutes: 50 },
  { key: 'hard', label: 'Hard', count: 50, timeMinutes: 75 },
  { key: 'very_hard', label: 'Very hard', count: 50, timeMinutes: 100 },
];

export default function ShortCoursePracticePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [mode, setMode] = useState<Mode>('level');
  const [difficulty, setDifficulty] = useState('easy');
  const [questionType, setQuestionType] = useState('mcq');
  const [count, setCount] = useState(50);
  const [timeMinutes, setTimeMinutes] = useState(40);
  const [payload, setPayload] = useState<ShortCoursePracticePayload | null>(null);
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => payload?.sections.flatMap((section) => section.questions.map((question) => ({ ...question, sectionTitle: section.title }))) ?? [], [payload]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || result) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [result, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && payload && !result) {
      void submit();
    }
  }, [secondsLeft, payload, result]);

  async function startPractice(nextDifficulty = difficulty) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    try {
      const next = mode === 'level'
        ? await getShortCoursePractice(courseId, { difficulty: nextDifficulty, count: 50, questionType: 'mcq' })
        : await getShortCoursePractice(courseId, { sections: [{ title: 'Custom practice', difficulty: nextDifficulty, questionType, count, timeMinutes }] });
      setPayload(next);
      setSecondsLeft((next.totalTimeMinutes || timeMinutes || 30) * 60);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start practice.');
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!payload) return;
    setLoading(true);
    setError(null);
    try {
      const rows: PracticeAnswer[] = questions.map((question) => ({ questionId: question.id, answer: answers[question.id] }));
      setResult(await submitShortCoursePractice(courseId, rows));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit practice.');
    } finally {
      setLoading(false);
    }
  }

  function prettyTime(seconds: number | null) {
    if (seconds === null) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, '0')}`;
  }

  if (loading && !payload) return <PageLoading message="Preparing practice questions..." />;
  if (error) return <PageError message={error} actionHref={`/student/short-courses/${courseId}`} actionLabel="Back to course" />;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Practice arena</p>
        <h1 className="text-3xl font-bold">Quiz levels and timed practice</h1>
        <p className="mt-2 text-sm text-muted-foreground">Practise with questions from the course quiz bank. Pick a level or create your own timed set.</p>
      </section>

      {!payload ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader><CardTitle>Level practice</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {levels.map((level) => (
                <button key={level.key} type="button" onClick={() => { setMode('level'); setDifficulty(level.key); void startPractice(level.key); }} className="rounded-2xl border p-5 text-left transition hover:border-primary hover:bg-primary/5">
                  <p className="font-semibold">{level.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Up to {level.count} questions - timed challenge</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Custom practice</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Difficulty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{levels.map((level) => <option key={level.key} value={level.key}>{level.label}</option>)}</select></Field>
              <Field label="Question type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={questionType} onChange={(event) => setQuestionType(event.target.value)}><option value="mcq">MCQ</option><option value="true_false">True/False</option><option value="fill_blank">Fill blank</option><option value="short_answer">Short answer</option></select></Field>
              <Field label="Questions"><input className="h-10 w-full rounded-md border bg-background px-3 text-sm" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} /></Field>
              <Field label="Time in minutes"><input className="h-10 w-full rounded-md border bg-background px-3 text-sm" type="number" min={1} max={240} value={timeMinutes} onChange={(event) => setTimeMinutes(Number(event.target.value))} /></Field>
              <Button className="w-full" onClick={() => { setMode('custom'); void startPractice(difficulty); }}>Start custom practice</Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Timed practice</CardTitle>
              <p className="text-sm text-muted-foreground">{questions.length} questions - {payload.totalTimeMinutes} minutes</p>
            </div>
            <div className="rounded-2xl border px-4 py-2 text-xl font-bold">{prettyTime(secondsLeft)}</div>
          </CardHeader>
          <CardContent className="space-y-5">
            {questions.length ? questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border p-4">
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">{question.sectionTitle}</span>
                  <span className="rounded-full bg-muted px-2 py-1">{question.difficulty ?? 'easy'}</span>
                </div>
                <p className="font-medium">{index + 1}. {question.question}</p>
                {question.options?.length ? (
                  <RadioGroup value={answers[question.id]} onValueChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}>
                    {question.options.map((option) => (
                      <div key={option} className="mt-3 flex items-center gap-2 rounded-lg border p-3">
                        <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                        <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <input className="mt-3 h-10 w-full rounded-md border bg-background px-3 text-sm" value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Type your answer" />
                )}
              </div>
            )) : <p className="text-sm text-muted-foreground">No questions were found for this selection. Ask an admin to generate more questions in the question bank.</p>}

            <div className="flex flex-wrap gap-3">
              <Button onClick={submit} disabled={loading || !questions.length}>{loading ? 'Submitting...' : 'Submit practice'}</Button>
              <Button variant="outline" onClick={() => { setPayload(null); setResult(null); setSecondsLeft(null); }}>Choose another level</Button>
              <Button variant="ghost" asChild><Link href={`/student/short-courses/${courseId}`}>Back to course</Link></Button>
            </div>

            {result ? (
              <div className="rounded-2xl border bg-muted/20 p-5">
                <p className="text-2xl font-bold">Score: {result.score}%</p>
                <p className="text-sm text-muted-foreground">{result.correct} correct out of {result.total} questions.</p>
                <div className="mt-4 space-y-2 text-sm">
                  {result.results.slice(0, 10).map((row) => <p key={row.questionId}>{row.correct ? 'Correct' : 'Review'} question {row.questionId}: {row.correct ? 'Correct' : `Answer: ${row.answer ?? 'Not set'}`}</p>)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>;
}
