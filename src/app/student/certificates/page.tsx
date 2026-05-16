'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getMyShortCourses, getShortCourseCertificateUrl, payShortCourseCertificate, paymentUrl, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';

export default function StudentCertificatesPage() {
  const [items, setItems] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMyShortCourses()
      .then((data) => { if (mounted) setItems(data); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load certificates.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function openCertificate(courseId: string) {
    setWorkingId(courseId);
    setError(null);
    try {
      const response = await payShortCourseCertificate(courseId);
      const url = paymentUrl(response);
      window.location.href = url || getShortCourseCertificateUrl(courseId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open certificate.');
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) return <PageLoading message="Loading certificates..." />;
  if (error) return <PageError message={error} actionHref="/student/short-courses" actionLabel="Back to short courses" />;

  const completed = items.filter((item) => item.completedAt && item.course);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Certificates</p>
        <h1 className="text-3xl font-bold">Your completed short courses</h1>
        <p className="text-sm text-muted-foreground">Open certificates after passing the final assessment and completing any required access step.</p>
      </section>

      {completed.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {completed.map((item) => item.course ? (
            <Card key={item.id} className="rounded-2xl">
              <CardHeader><CardTitle>{item.course.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">Score: {item.examScore ?? '—'}</span>
                  <span className="rounded-full bg-muted px-2 py-1">{item.certificateIssuedAt ? 'Issued' : 'Ready'}</span>
                </div>
                <Button onClick={() => openCertificate(item.course!.id)} disabled={workingId === item.course.id}>
                  {workingId === item.course.id ? 'Opening...' : 'Open certificate'}
                </Button>
              </CardContent>
            </Card>
          ) : null)}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-muted-foreground">No completed short-course certificates yet.</p>
            <Button asChild><Link href="/student/short-courses">Continue learning</Link></Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
