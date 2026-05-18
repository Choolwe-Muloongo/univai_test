'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Lock, Timer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getLessonsByCourse } from '@/lib/api';
import {
  getShortCourseCertificateUrl,
  getShortCourseExam,
  getShortCourseProgress,
  payShortCourseCertificate,
  paymentUrl,
  submitShortCourseExam,
  type ExamAnswer,
  type ShortCourseExamPayload,
  type ShortCourseProgress,
} from '@/lib/api/short-courses';

export default function CourseExamPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ShortCourseExamPayload | null>(null);
  const [progress, setProgress] = useState<ShortCourseProgress | null>(null);
  const [lessonCount, setLessonCount] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getShortCourseExam(courseId),
      getShortCourseProgress(courseId).catch(() => null),
      getLessonsByCourse(courseId).catch(() => []),
    ])
      .then(([examData, progressData, lessonData]) => {
        if (!mounted) return;
        setExam(examData);
        setProgress(progressData);
        setLessonCount(lessonData.length);
      })
      .catch((cause) => { if (mounted) setError(studentFriendlyError(cause)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [courseId]);

  const allLessonsComplete = lessonCount === 0 || (progress?.completedLessons?.length ?? 0) >= lessonCount;
  const locked = !allLessonsComplete;
  const question = exam?.questions[current];
  const answeredCount = useMemo(() => answers.filter(Boolean).length, [answers]);

  async function submit() {
    if (!exam) return;
    if (!window.confirm('Submit final exam now? You should only submit when you are ready for grading.')) return;
    setSubmitting(true);
    setError(null);
    try {
      const rows: ExamAnswer[] = exam.questions.map((question, index) => ({ questionId: question.id, answer: answers[index] }));
      setResult(await submitShortCourseExam(courseId, rows));
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function openCertificate() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await payShortCourseCertificate(courseId);
      const checkout = paymentUrl(response);
      window.location.href = checkout || getShortCourseCertificateUrl(courseId);
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading message="Loading final exam..." />;
  if (error) return <PageError message={error} actionHref={`/student/courses/${courseId}`} actionLabel="Back to course" />;
  if (!exam) return <PageError title="Exam unavailable" message="This exam is not available yet." actionHref={`/student/courses/${courseId}`} actionLabel="Back to course" />;

  if (locked) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="gap-2 px-2"><Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Course</Link></Button>
        <Card className="rounded-3xl border-dashed">
          <CardContent className="space-y-4 p-8 text-center">
            <Lock className="mx-auto h-10 w-10 text-primary" />
            <div>
              <CardTitle>Final Exam Locked</CardTitle>
              <CardDescription className="mt-2">Complete all required lessons/projects first.</CardDescription>
            </div>
            <Button asChild><Link href={`/student/courses/${courseId}`}>Back to Course Hub</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!exam.ready) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="gap-2 px-2"><Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Course</Link></Button>
        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-8 text-center">
            <Timer className="mx-auto h-10 w-10 text-primary" />
            <div>
              <CardTitle>This exam needs more questions before it can be taken.</CardTitle>
              <CardDescription className="mt-2">Required questions: {exam.requiredQuestions}. Available questions: {exam.availableQuestions}.</CardDescription>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (result) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{result.passed ? 'Exam Passed' : 'Exam Submitted'}</CardTitle>
            <CardDescription>{result.passed ? 'You can move to the certificate step.' : 'Practice again, review lessons, and retake when ready.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border bg-muted/20 p-6">
              <p className="text-4xl font-bold">{result.score}%</p>
              <p className="text-sm text-muted-foreground">Pass mark: 50%</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {result.passed ? (
                <Button onClick={openCertificate} disabled={submitting} className="gap-2"><BadgeCheck className="h-4 w-4" /> Certificate Next Step</Button>
              ) : (
                <>
                  <Button asChild><Link href={`/student/courses/${courseId}/practice`}>Practice Again</Link></Button>
                  <Button variant="outline" onClick={() => { setResult(null); setAnswers([]); setCurrent(0); }}>Retake Exam</Button>
                </>
              )}
              <Button asChild variant="outline"><Link href={`/student/courses/${courseId}`}>Back to Course</Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Button variant="ghost" asChild className="gap-2 px-2"><Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Course</Link></Button>
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Final Exam Ready</p>
        <h1 className="text-3xl font-bold tracking-tight">Final Exam</h1>
        <p className="mt-2 text-sm text-muted-foreground">{exam.questions.length} questions. Pass mark is 50%. Save each answer before submitting.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Questions</CardTitle>
            <CardDescription>{answeredCount} of {exam.questions.length} answered</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {exam.questions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(index)}
                className={`rounded-xl border p-2 text-sm font-medium ${current === index ? 'border-primary bg-primary/5' : answers[index] ? 'border-primary/30 bg-primary/5' : 'hover:border-primary/50'}`}
              >
                {index + 1}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Question {current + 1}</CardTitle>
            <CardDescription>{question?.difficulty ?? 'mixed'} · {question?.questionType ?? 'mcq'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-lg font-semibold">{question?.question}</p>
            {question ? (
              <RadioGroup value={answers[current] ?? ''} onValueChange={(value) => setAnswers((previous) => { const next = [...previous]; next[current] = value; return next; })}>
                {question.options.map((option) => (
                  <div key={option} className="flex items-center gap-2 rounded-xl border p-3">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}>Previous</Button>
                <Button variant="outline" onClick={() => setCurrent((value) => Math.min(exam.questions.length - 1, value + 1))} disabled={current === exam.questions.length - 1}>Next</Button>
              </div>
              <Button onClick={submit} disabled={submitting || answeredCount < exam.questions.length}>{submitting ? 'Submitting...' : 'Submit Exam'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to load final exam.';
  if (message.includes('402')) return 'Active course access is required. Please enroll or renew access.';
  return message || 'Unable to load final exam.';
}
