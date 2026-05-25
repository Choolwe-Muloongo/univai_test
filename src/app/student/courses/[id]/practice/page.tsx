'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';

import { NovaInlineActions } from '@/components/ai/nova-inline-actions';
import { QuestionVisualRenderer } from '@/components/learning/question-visual-renderer';
import { CourseHelperBox } from '@/components/student/course-helper-box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError } from '@/components/ui/page-feedback';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { recordLearningEvent } from '@/lib/api/student-gamification';
import {
  getShortCoursePractice,
  submitShortCoursePractice,
  type PracticeAnswer,
  type PracticeResult,
  type ShortCoursePracticePayload,
  type ShortCourseQuestion,
} from '@/lib/api/short-courses';

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
type PracticeQuestionType = 'all' | 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'matching';

type ArenaQuestion = ShortCourseQuestion & { sectionTitle?: string };

const difficultyOptions: Array<{ key: Difficulty; label: string; description: string }> = [
  { key: 'easy', label: 'Quick Battle', description: 'Build confidence with lighter checks.' },
  { key: 'medium', label: 'XP Battle', description: 'Apply ideas with normal challenge.' },
  { key: 'hard', label: 'Boss Prep', description: 'Prepare for exam-level thinking.' },
  { key: 'mixed', label: 'Rescue Battle', description: 'Combine easy, medium, and hard questions.' },
];

const questionTypeOptions: Array<{ key: PracticeQuestionType; label: string; description: string }> = [
  { key: 'all', label: 'All types', description: 'Use every question extracted from this Journey.' },
  { key: 'mcq', label: 'Multiple choice', description: 'Fast objective questions.' },
  { key: 'true_false', label: 'True / false', description: 'Quick judgement checks.' },
  { key: 'fill_blank', label: 'Fill blank', description: 'Recall key terms or numbers.' },
  { key: 'short_answer', label: 'Short answer', description: 'Explain in your own words.' },
  { key: 'matching', label: 'Matching / sorting', description: 'Good for lists, accounts, and categories.' },
];

export default function CoursePracticePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [questionType, setQuestionType] = useState<PracticeQuestionType>('all');
  const [count, setCount] = useState(10);
  const [payload, setPayload] = useState<ShortCoursePracticePayload | null>(null);
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [checked, setChecked] = useState<Record<string | number, boolean>>({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo<ArenaQuestion[]>(() => payload?.sections.flatMap((section) => section.questions.map((question) => ({ ...question, sectionTitle: section.title }))) ?? [], [payload]);
  const question = questions[index];
  const resultById = useMemo(() => new Map(result?.results.map((row) => [String(row.questionId), row]) ?? []), [result]);
  const selectedType = questionType === 'all' ? undefined : questionType;

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
            { title: 'Easy rescue', difficulty: 'easy', questionType: selectedType, count: Math.ceil(count / 3), timeMinutes: 10 },
            { title: 'Medium rescue', difficulty: 'medium', questionType: selectedType, count: Math.ceil(count / 3), timeMinutes: 15 },
            { title: 'Hard rescue', difficulty: 'hard', questionType: selectedType, count: Math.max(1, count - Math.ceil(count / 3) * 2), timeMinutes: 20 },
          ],
        })
        : await getShortCoursePractice(courseId, { difficulty: nextDifficulty, count, questionType: selectedType });
      setPayload(next);
      await recordLearningEvent({ type: 'practice_started', courseId, metadata: { difficulty: nextDifficulty, count, questionType } }).catch((error) => console.warn('Gamification event failed', error));
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
      const nextResult = await submitShortCoursePractice(courseId, rows);
      setResult(nextResult);
      await recordLearningEvent({
        type: nextResult.score >= 50 ? 'practice_passed' : 'practice_failed',
        courseId,
        metadata: { score: nextResult.score, correct: nextResult.correct, total: nextResult.total, difficulty, questionType },
      }).catch((error) => console.warn('Gamification event failed', error));
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setLoading(false);
    }
  }

  if (error) return <PageError message={error} actionHref={`/student/courses/${courseId}`} actionLabel="Back to Mission Control" />;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 overflow-hidden px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
      <Button variant="ghost" asChild className="min-h-10 gap-2 px-2">
        <Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Mission Control</Link>
      </Button>

      <section className="overflow-hidden rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">Training Arena</p>
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Battle your weak areas before the Final Trial</h1>
        <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">Choose a battle mode, question type, and size. Uploaded course questions can now feed this Arena.</p>
      </section>

      <CourseHelperBox courseId={courseId} lessonTitle={result ? `Practice review: ${result.score}%` : 'Training Arena'} />

      {!payload ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <Card className="overflow-hidden rounded-3xl">
              <CardHeader className="p-4 sm:p-5">
                <CardTitle>Choose battle mode</CardTitle>
                <CardDescription>Start light or choose a rescue battle.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2 sm:px-5 sm:pb-5">
                {difficultyOptions.map((option) => (
                  <button key={option.key} type="button" onClick={() => setDifficulty(option.key)} className={`min-w-0 rounded-2xl border p-4 text-left transition ${difficulty === option.key ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                    <p className="break-words font-semibold">{option.label}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl">
              <CardHeader className="p-4 sm:p-5">
                <CardTitle>Question type</CardTitle>
                <CardDescription>Use all uploaded questions, or focus on one style.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2 sm:px-5 sm:pb-5">
                {questionTypeOptions.map((option) => (
                  <button key={option.key} type="button" onClick={() => setQuestionType(option.key)} className={`min-w-0 rounded-2xl border p-4 text-left transition ${questionType === option.key ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                    <p className="break-words font-semibold">{option.label}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit rounded-3xl">
            <CardHeader>
              <CardTitle>Battle setup</CardTitle>
              <CardDescription>Keep it focused on mobile or increase for Final Trial prep.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/20 p-3 text-sm">
                <p className="font-medium">Selected setup</p>
                <p className="mt-1 text-muted-foreground">{difficultyOptions.find((item) => item.key === difficulty)?.label} · {questionTypeOptions.find((item) => item.key === questionType)?.label}</p>
              </div>
              <Label className="space-y-2">
                <span>Number of questions</span>
                <Input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} />
              </Label>
              <Button className="min-h-11 w-full" onClick={() => startPractice()} disabled={loading}>{loading ? 'Preparing...' : 'Enter Arena'}</Button>
            </CardContent>
          </Card>
        </div>
      ) : !questions.length ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <p className="font-semibold">No questions match this setup yet.</p>
            <p className="text-sm text-muted-foreground">Try All types, another difficulty, or ask the admin to add more question cards to this Journey.</p>
            <Button variant="outline" onClick={() => setPayload(null)}>Choose another battle setup</Button>
          </CardContent>
        </Card>
      ) : result ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{result.score >= 50 ? 'Battle Won!' : 'Battle Lost — useful data'}</CardTitle>
            <CardDescription>{result.correct} correct out of {result.total} questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border bg-primary/5 p-5">
              <p className="text-4xl font-bold">{result.score}%</p>
              <p className="text-sm text-muted-foreground">{result.score >= 50 ? '+60 XP and reward progress recorded.' : 'Weak area detected. Start a rescue battle after review.'}</p>
            </div>
            <NovaInlineActions title="Nova Analysis" description="Turn this Arena result into a rescue plan, extra practice, or mistake explanation." courseId={courseId} attemptId={`practice-${Date.now()}`} actions={[{ label: 'Explain my score', mode: 'explain', intent: 'explain_practice_score' }, { label: 'Create rescue drill', mode: 'quiz', intent: 'create_rescue_drill' }, { label: 'Give similar questions', mode: 'quiz', intent: 'similar_questions' }, { label: 'Explain mistakes', mode: 'explain', intent: 'explain_practice_mistakes' }]} />
            <div className="space-y-3">
              {questions.map((item, itemIndex) => {
                const row = resultById.get(String(item.id));
                return (
                  <div key={item.id} className="space-y-3 rounded-2xl border p-4">
                    <p className="break-words font-medium">{itemIndex + 1}. {item.question}</p>
                    <QuestionVisualRenderer question={item} />
                    <p className={`mt-2 text-sm ${row?.correct ? 'text-primary' : 'text-destructive'}`}>{row?.correct ? 'Correct' : `Correct answer: ${row?.answer ?? 'Not available'}`}</p>
                    {row?.explanation ? <p className="mt-2 break-words text-sm text-muted-foreground">{row.explanation}</p> : null}
                    <NovaInlineActions title="Ask Nova about this question" description="Get targeted help for this Arena question." courseId={courseId} questionId={String(item.id)} compact actions={[{ label: row?.correct ? 'Explain why correct' : 'Why was I wrong?', mode: 'explain', intent: row?.correct ? 'explain_correct_answer' : 'explain_wrong_answer' }, { label: 'Give similar question', mode: 'quiz', intent: 'similar_questions' }]} />
                  </div>
                );
              })}
            </div>
            <div className="grid gap-3 sm:flex sm:flex-row">
              <Button onClick={() => setPayload(null)} className="min-h-11 gap-2"><RotateCcw className="h-4 w-4" /> Battle Again</Button>
              <Button asChild variant="outline" className="min-h-11"><Link href={`/student/courses/${courseId}`}>Back to Mission Control</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Question {index + 1} of {questions.length}</CardTitle>
              <CardDescription>{question.sectionTitle} · {question.difficulty ?? difficulty} · {question.questionType ?? 'question'}</CardDescription>
            </div>
            <div className="text-sm font-medium">{Math.round(((index + 1) / questions.length) * 100)}%</div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
              <p className="break-words text-lg font-semibold">{question.question}</p>
              <QuestionVisualRenderer question={question} />
              {question.options?.length ? (
                <RadioGroup value={answers[question.id] ?? ''} onValueChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} className="mt-4">
                  {question.options.map((option) => (
                    <div key={option} className="flex min-w-0 items-center gap-2 rounded-xl border p-3">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="min-w-0 flex-1 cursor-pointer break-words">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Input className="mt-4 min-h-11" value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Type your answer" />
              )}
            </div>

            <NovaInlineActions title="Need a nudge?" description="Ask Nova for a hint or explanation before you move on." courseId={courseId} questionId={String(question.id)} compact actions={[{ label: 'Give me a hint', mode: 'tutor', intent: 'hint_current_question' }, { label: 'Explain this question', mode: 'explain', intent: 'explain_current_card' }]} />

            {checked[question.id] ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm"><div className="mb-1 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" /> Answer saved</div><p className="text-muted-foreground">The full explanation appears after you submit this Arena battle.</p></div> : null}

            <div className="grid gap-3 sm:flex sm:flex-row">
              <Button className="min-h-11" onClick={() => setChecked((current) => ({ ...current, [question.id]: true }))} disabled={!answers[question.id]}>Save Answer</Button>
              {index < questions.length - 1 ? <Button className="min-h-11" variant="outline" onClick={() => setIndex((value) => value + 1)} disabled={!checked[question.id]}>Next Question</Button> : <Button className="min-h-11" variant="outline" onClick={submit} disabled={loading || !checked[question.id]}>{loading ? 'Submitting...' : 'Finish Battle'}</Button>}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to load Training Arena.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to load Training Arena.';
}
