'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError } from '@/components/ui/page-feedback';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  getShortCoursePractice,
  submitShortCoursePractice,
  type PracticeAnswer,
  type PracticeResult,
  type ShortCoursePracticePayload,
} from '@/lib/api/short-courses';

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

const difficultyOptions: Array<{ key: Difficulty; label: string; description: string }> = [
  { key: 'easy', label: 'Easy', description: 'Build confidence with lighter checks.' },
  { key: 'medium', label: 'Medium', description: 'Apply ideas with normal challenge.' },
  { key: 'hard', label: 'Hard', description: 'Prepare for exam-level thinking.' },
  { key: 'mixed', label: 'Mixed', description: 'Combine easy, medium, and hard questions.' },
];

export default function CoursePracticePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [count, setCount] = useState(10);
  const [payload, setPayload] = useState<ShortCoursePracticePayload | null>(null);
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [checked, setChecked] = useState<Record<string | number, boolean>>({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => payload?.sections.flatMap((section) => section.questions.map((question) => ({ ...question, sectionTitle: section.title }))) ?? [], [payload]);
  const question = questions[index];
  const resultById = useMemo(() => new Map(result?.results.map((row) => [String(row.questionId), row]) ?? []), [result]);

  async function startPractice(nextDifficulty = difficulty) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setChecked({});
    setIndex(0);
    try {
      const next = nextDifficulty === 'mixed'
        ? await getShortCoursePractice(courseId, {
          sections: [
            { title: 'Easy practice', difficulty: 'easy', questionType: 'mcq', count: Math.ceil(count / 3), timeMinutes: 10 },
            { title: 'Medium practice', difficulty: 'medium', questionType: 'mcq', count: Math.ceil(count / 3), timeMinutes: 15 },
            { title: 'Hard practice', difficulty: 'hard', questionType: 'mcq', count: Math.max(1, count - Math.ceil(count / 3) * 2), timeMinutes: 20 },
          ],
        })
        : await getShortCoursePractice(courseId, { difficulty: nextDifficulty, count, questionType: 'mcq' });
      setPayload(next);
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!payload) return;
    setLoading(true);
    setError(null);
    try {
      const rows: PracticeAnswer[] = questions.map((item) => ({ questionId: item.id, answer: answers[item.id] ?? '' }));
      setResult(await submitShortCoursePractice(courseId, rows));
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setLoading(false);
    }
  }

  if (error) return <PageError message={error} actionHref={`/student/courses/${courseId}`} actionLabel="Back to course" />;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Button variant="ghost" asChild className="gap-2 px-2">
        <Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Course</Link>
      </Button>

      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Practice Zone</p>
        <h1 className="text-3xl font-bold tracking-tight">Train before the exam</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a level and work question by question. Practice does not require full course completion.</p>
      </section>

      {!payload ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Choose difficulty</CardTitle>
              <CardDescription>Start with one level or choose mixed practice.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDifficulty(option.key)}
                  className={`rounded-2xl border p-4 text-left transition ${difficulty === option.key ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Question count</CardTitle>
              <CardDescription>Keep it focused on mobile or increase for exam prep.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label className="space-y-2">
                <span>Number of questions</span>
                <Input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} />
              </Label>
              <Button className="w-full" onClick={() => startPractice()} disabled={loading}>{loading ? 'Preparing...' : 'Start Practice'}</Button>
            </CardContent>
          </Card>
        </div>
      ) : !questions.length ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="space-y-4 p-8 text-center">
            <p className="font-semibold">Practice questions are not ready for this course yet.</p>
            <p className="text-sm text-muted-foreground">Ask an admin or instructor to add questions to the course question bank.</p>
            <Button variant="outline" onClick={() => setPayload(null)}>Choose another practice setup</Button>
          </CardContent>
        </Card>
      ) : result ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Practice complete</CardTitle>
            <CardDescription>{result.correct} correct out of {result.total} questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border bg-primary/5 p-5">
              <p className="text-4xl font-bold">{result.score}%</p>
              <p className="text-sm text-muted-foreground">Review the explanations, then practice again or return to the course hub.</p>
            </div>
            <div className="space-y-3">
              {questions.map((item, itemIndex) => {
                const row = resultById.get(String(item.id));
                return (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <p className="font-medium">{itemIndex + 1}. {item.question}</p>
                    <p className={`mt-2 text-sm ${row?.correct ? 'text-primary' : 'text-destructive'}`}>{row?.correct ? 'Correct' : `Correct answer: ${row?.answer ?? 'Not available'}`}</p>
                    {row?.explanation ? <p className="mt-2 text-sm text-muted-foreground">{row.explanation}</p> : null}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setPayload(null)} className="gap-2"><RotateCcw className="h-4 w-4" /> Practice Again</Button>
              <Button asChild variant="outline"><Link href={`/student/courses/${courseId}`}>Back to Course</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Question {index + 1} of {questions.length}</CardTitle>
              <CardDescription>{question.sectionTitle} · {question.difficulty ?? difficulty}</CardDescription>
            </div>
            <div className="text-sm font-medium">{Math.round(((index + 1) / questions.length) * 100)}%</div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border p-5">
              <p className="text-lg font-semibold">{question.question}</p>
              {question.options?.length ? (
                <RadioGroup value={answers[question.id] ?? ''} onValueChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} className="mt-4">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center gap-2 rounded-xl border p-3">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Input className="mt-4" value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Type your answer" />
              )}
            </div>

            {checked[question.id] ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                <div className="mb-1 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" /> Answer saved</div>
                <p className="text-muted-foreground">The full explanation appears after you submit this practice set.</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setChecked((current) => ({ ...current, [question.id]: true }))} disabled={!answers[question.id]}>Check Answer</Button>
              {index < questions.length - 1 ? (
                <Button variant="outline" onClick={() => setIndex((value) => value + 1)} disabled={!checked[question.id]}>Next Question</Button>
              ) : (
                <Button variant="outline" onClick={submit} disabled={loading || !checked[question.id]}>{loading ? 'Submitting...' : 'Finish Practice'}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to load practice.';
  if (message.includes('402')) return 'Active course access is required. Please enroll or renew access.';
  return message || 'Unable to load practice.';
}
