'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Lock, Timer } from 'lucide-react';

import { NovaInlineActions } from '@/components/ai/nova-inline-actions';
import { QuestionVisualRenderer } from '@/components/learning/question-visual-renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getLessonsByCourse } from '@/lib/api';
import { recordLearningEvent } from '@/lib/api/student-gamification';
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
    if (!window.confirm('Submit Final Trial now? You should only submit when you are ready for grading.')) return;
    setSubmitting(true);
    setError(null);
    try {
      const rows: ExamAnswer[] = exam.questions.map((question, index) => ({ questionId: question.id, answer: answers[index] }));
      const nextResult = await submitShortCourseExam(courseId, rows);
      setResult(nextResult);
      if (nextResult.passed) {
        await recordLearningEvent({ type: 'final_trial_passed', courseId, metadata: { score: nextResult.score } }).catch((error) => console.warn('Gamification event failed', error));
      }
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

  if (loading) return <PageLoading message="Loading Final Trial..." />;
  if (error) return <PageError message={error} actionHref={`/student/courses/${courseId}`} actionLabel="Back to Mission Control" />;
  if (!exam) return <PageError title="Final Trial unavailable" message="This Final Trial is not available yet." actionHref={`/student/courses/${courseId}`} actionLabel="Back to Mission Control" />;

  if (locked) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="gap-2 px-2"><Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Mission Control</Link></Button>
        <Card className="rounded-3xl border-dashed">
          <CardContent className="space-y-4 p-8 text-center">
            <Lock className="mx-auto h-10 w-10 text-primary" />
            <div>
              <CardTitle>Final Trial Locked</CardTitle>
              <CardDescription className="mt-2">Complete all required missions first.</CardDescription>
            </div>
            <Button asChild><Link href={`/student/courses/${courseId}`}>Back to Mission Control</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!exam.ready) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="gap-2 px-2"><Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Mission Control</Link></Button>
        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-8 text-center">
            <Timer className="mx-auto h-10 w-10 text-primary" />
            <div>
              <CardTitle>This Final Trial needs more questions before it can be taken.</CardTitle>
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
            <CardTitle>{result.passed ? 'Final Trial Passed' : 'Final Trial Submitted'}</CardTitle>
            <CardDescription>{result.passed ? '+500 XP recorded. You can move to the Skill Proof step.' : 'Practice again, review missions, and retake when ready.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border bg-muted/20 p-6">
              <p className="text-4xl font-bold">{result.score}%</p>
              <p className="text-sm text-muted-foreground">Pass mark: 50%</p>
            </div>
            <NovaInlineActions
              title="Nova Exam Review"
              description="Use Nova to understand the result and turn this attempt into a stronger next plan."
              courseId={courseId}
              attemptId={`exam-${Date.now()}`}
              actions={[
                { label: 'Explain my result', mode: 'explain', intent: 'explain_exam_result' },
                { label: 'What should I revise?', mode: 'explain', intent: 'explain_weak_topics' },
                { label: 'Create improvement plan', mode: 'study_plan', intent: 'exam_improvement_plan' },
              ]}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              {result.passed ? (
                <Button onClick={openCertificate} disabled={submitting} className="gap-2"><BadgeCheck className="h-4 w-4" /> Skill Proof Next Step</Button>
              ) : (
                <>
                  <Button asChild><Link href={`/student/courses/${courseId}/practice`}>Enter Training Arena</Link></Button>
                  <Button variant="outline" onClick={() => { setResult(null); setAnswers([]); setCurrent(0); }}>Retake Final Trial</Button>
                </>
              )}
              <Button asChild variant="outline"><Link href={`/student/courses/${courseId}`}>Back to Mission Control</Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Button variant="ghost" asChild className="gap-2 px-2"><Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /> Back to Mission Control</Link></Button>
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Final Trial Ready</p>
        <h1 className="text-3xl font-bold tracking-tight">Final Trial</h1>
        <p className="mt-2 text-sm text-muted-foreground">{exam.questions.length} questions. Pass mark is 50%. Save each answer before submitting.</p>
      </section>

      <NovaInlineActions
        title="Nova Final Prep"
        description="Prepare before you submit. Nova opens with Final Trial context but does not spend tokens until you send."
        courseId={courseId}
        actions={[
          { label: 'Am I ready?', mode: 'exam_prep', intent: 'readiness_check' },
          { label: 'Final revision plan', mode: 'exam_prep', intent: 'final_revision_plan' },
          { label: 'Quiz me before exam', mode: 'quiz', intent: 'pre_exam_quiz' },
          { label: 'Explain weak topics', mode: 'explain', intent: 'explain_weak_topics' },
        ]}
      />

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
            {question ? <QuestionVisualRenderer question={question} /> : null}
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
            {question ? (
              <NovaInlineActions
                title="Need exam help?"
                description="Ask for a hint or explanation for this question without auto-sending to Nova."
                courseId={courseId}
                questionId={String(question.id)}
                compact
                actions={[
                  { label: 'Give me a hint', mode: 'tutor', intent: 'hint_current_question' },
                  { label: 'Explain this question', mode: 'explain', intent: 'explain_current_card' },
                ]}
              />
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}>Previous</Button>
                <Button variant="outline" onClick={() => setCurrent((value) => Math.min(exam.questions.length - 1, value + 1))} disabled={current === exam.questions.length - 1}>Next</Button>
              </div>
              <Button onClick={submit} disabled={submitting || answeredCount < exam.questions.length}>{submitting ? 'Submitting...' : 'Submit Final Trial'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to load Final Trial.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to load Final Trial.';
}
