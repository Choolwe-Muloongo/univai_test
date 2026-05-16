'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type ElementType } from 'react';
import { BadgeCheck, Clock, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { enrollShortCourse, getCourseById, getSession } from '@/lib/api';
import type { Course } from '@/lib/api/types';

export default function PublicShortCoursePage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getCourseById(params.courseId), getSession()])
      .then(([courseResult, sessionResult]) => {
        if (!mounted) return;
        if (courseResult.status === 'fulfilled') {
          setCourse(courseResult.value);
        } else {
          setError(courseResult.reason instanceof Error ? courseResult.reason.message : 'Short course is unavailable.');
        }
        if (sessionResult.status === 'fulfilled') {
          setIsLoggedIn(Boolean(sessionResult.value));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.courseId]);

  async function startEnrollment() {
    if (!course) return;

    if (!isLoggedIn) {
      const next = encodeURIComponent(`/courses/${course.id}`);
      router.push(`/register/short-courses?next=${next}`);
      return;
    }

    setPaying(true);
    setError(null);
    try {
      const payment = await enrollShortCourse(course.id);
      const checkoutUrl = payment.checkoutUrl || payment.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      window.location.href = `/student/short-courses/${course.id}`;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to start enrollment.';
      if (/unauthorized|401|forbidden|403/i.test(message)) {
        const next = encodeURIComponent(`/courses/${course.id}`);
        router.push(`/register/short-courses?next=${next}`);
        return;
      }
      setError(message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-8"><PageLoading message="Loading short course..." /></main>;
  if (error && !course) return <main className="mx-auto max-w-5xl px-4 py-8"><PageError message={error} actionHref="/" actionLabel="Back home" /></main>;
  if (!course) return <main className="mx-auto max-w-5xl px-4 py-8"><PageError title="Course not found" message="This short course is not currently available." actionHref="/" actionLabel="Back home" /></main>;
  const isDraftLike = (course.status ?? 'draft') !== 'published';

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">Short Course</p>
          <h1 className="text-4xl font-bold tracking-normal">{course.title}</h1>
          <p className="max-w-3xl text-primary-foreground/85">{course.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" onClick={startEnrollment} disabled={paying || isDraftLike}>
              {paying ? 'Starting enrollment...' : !isLoggedIn ? 'Register to enroll' : course.pricingType === 'free' ? 'Enroll now' : 'Pay and enroll'}
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/">Back to catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_0.8fr] lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>What this course includes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Protected lessons, progress tracking, quizzes, final assessment and certificate eligibility.</p>
            {!isLoggedIn ? <p className="font-medium text-primary">Create a short-course learner account first. No formal admission documents are required.</p> : null}
            {isDraftLike ? <p className="font-medium text-amber-600">This course is currently in draft/incomplete status and not yet open for learner enrollment.</p> : null}
            <p>AI-powered learning support can summarize concepts, generate practice questions and help with revision.</p>
            {error ? <PageError message={error} /> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <InfoCard icon={CreditCard} label="Entry fee" value={course.pricingType === 'free' ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`} />
          <InfoCard icon={BadgeCheck} label="Certificate fee" value={`${course.certificateCurrency || 'ZMW'} ${course.certificateFee ?? 0}`} />
          <InfoCard icon={Clock} label="Duration" value={`${course.durationHours || 0} hours`} />
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="size-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
