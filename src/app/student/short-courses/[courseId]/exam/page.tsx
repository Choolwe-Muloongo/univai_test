'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getShortCourseCertificateUrl, getShortCourseExam, payShortCourseCertificate, paymentUrl, submitShortCourseExam, type ShortCourseExamPayload } from '@/lib/api/short-courses';

export default function ShortCourseExamPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [exam, setExam] = useState<ShortCourseExamPayload | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getShortCourseExam(courseId)
      .then((data) => { if (mounted) setExam(data); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load assessment.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [courseId]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      setResult(await submitShortCourseExam(courseId, answers));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function certificate() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await payShortCourseCertificate(courseId);
      const url = paymentUrl(response);
      window.location.href = url || getShortCourseCertificateUrl(courseId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open certificate.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading message="Loading final assessment..." />;
  if (error) return <PageError message={error} actionHref={`/student/short-courses/${courseId}`} actionLabel="Back to course" />;
  if (!exam) return <PageError title="Assessment unavailable" message="This assessment is not available yet." actionHref={`/student/short-courses/${courseId}`} actionLabel="Back to course" />;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-3xl">Final assessment</CardTitle>
          <p className="text-sm text-muted-foreground">Required questions: {exam.requiredQuestions}. Available questions: {exam.availableQuestions}.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!exam.ready ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              This course needs at least {exam.requiredQuestions} assessment questions before the final assessment can be taken.
            </div>
          ) : null}

          {exam.questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border p-4">
              <p className="font-medium">{index + 1}. {question.question}</p>
              <RadioGroup value={answers[index]} onValueChange={(value) => setAnswers((previous) => { const next = [...previous]; next[index] = value; return next; })}>
                {question.options.map((option) => (
                  <div key={option} className="mt-3 flex items-center gap-2 rounded-lg border p-3">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          <Button onClick={submit} disabled={!exam.ready || submitting || answers.filter(Boolean).length < exam.questions.length}>
            {submitting ? 'Submitting...' : 'Submit assessment'}
          </Button>

          {result ? (
            <div className="rounded-2xl border p-5">
              <p className="text-xl font-bold">Score: {result.score}%</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.passed ? 'You passed. You can now open your certificate.' : 'You did not pass yet. Review the lessons and try again.'}</p>
              {result.passed ? <Button onClick={certificate} disabled={submitting} className="mt-4">Open certificate</Button> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Button variant="outline" asChild><Link href={`/student/short-courses/${courseId}`}>Back to course</Link></Button>
    </main>
  );
}
