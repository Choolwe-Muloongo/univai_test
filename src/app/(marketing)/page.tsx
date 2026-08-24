'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';

import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getAdmissionsSettings, getCourses, getPrograms } from '@/lib/api';
import type { Course, Program } from '@/lib/api/types';

type HomeData = { programs: Program[]; courses: Course[] };
type LecturerApplicationNotice = { open: boolean; message: string };

export default function HomePage() {
  const [data, setData] = useState<HomeData>({ programs: [], courses: [] });
  const [lecturerApplications, setLecturerApplications] = useState<LecturerApplicationNotice>({ open: false, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHome() {
      setLoading(true);
      setError(null);

      const [programsResult, coursesResult, settingsResult] = await Promise.allSettled([
        getPrograms(),
        getCourses(),
        getAdmissionsSettings(),
      ]);

      if (!mounted) return;

      const programs = programsResult.status === 'fulfilled' ? programsResult.value : [];
      const courses = coursesResult.status === 'fulfilled' ? coursesResult.value : [];

      setData({ programs, courses });

      if (settingsResult.status === 'fulfilled') {
        setLecturerApplications({
          open: Boolean(settingsResult.value.lecturerApplicationsOpen),
          message:
            typeof settingsResult.value.lecturerApplicationsMessage === 'string'
              ? settingsResult.value.lecturerApplicationsMessage
              : '',
        });
      }

      if (programsResult.status === 'rejected' || coursesResult.status === 'rejected') {
        let cause: unknown;

        if (programsResult.status === 'rejected') {
          cause = programsResult.reason;
        } else if (coursesResult.status === 'rejected') {
          cause = coursesResult.reason;
        }

        setError(cause instanceof Error ? cause.message : 'Unable to load content.');
      }

      setLoading(false);
    }

    loadHome();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredPrograms = useMemo(() => data.programs.slice(0, 3), [data.programs]);
  const featuredCourses = useMemo(() => data.courses.slice(0, 3), [data.courses]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-16 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border bg-card p-8 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Home</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Advance your career with trusted programs and practical short courses.</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Learn from expert instructors, follow clear outcomes, and earn credentials that support your next move.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/programs">Explore Programs</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/short-courses">Browse Short Courses</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/for-instructors">For Instructors</Link></Button>
          </div>
        </section>

        {lecturerApplications.open ? (
          <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">Lecturer recruitment is open</p>
                  <h2 className="mt-1 text-2xl font-bold">Apply to teach with UnivAI</h2>
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    {lecturerApplications.message || 'UnivAI is accepting lecturer applications. Submit your teaching profile for academic review.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button asChild>
                  <Link href="/lecturer/applications">Apply as Lecturer <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login/lecturer">Lecturer Login</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? <PageLoading message="Loading current offerings..." /> : null}
        {error ? <PageError message={error} /> : null}
        <section className="space-y-6" id="programs">
          <SectionHeader title="Programs" description="Structured degree pathways with clear admissions criteria and graduation requirements." href="/programs" cta="View all programs" />
          <div className="grid gap-4 md:grid-cols-3">{featuredPrograms.map((program) => <PreviewCard key={program.id} title={program.title} description={program.description || 'Program details available on the program page.'} href={`/programmes/${program.id}`} />)}</div>
        </section>
        <section className="space-y-6" id="short-courses">
          <SectionHeader title="Short Courses" description="Focused, career-oriented courses you can complete on your schedule." href="/short-courses" cta="See all short courses" />
          <div className="grid gap-4 md:grid-cols-3">{featuredCourses.map((course) => <PreviewCard key={course.id} title={course.title} description={course.description || 'Course overview and pricing available on the detail page.'} href={`/courses/${course.id}`} />)}</div>
        </section>
        <section id="platform" className="space-y-4 rounded-2xl border bg-muted/30 p-6">
          <h2 className="text-2xl font-semibold">Platform details</h2>
          <p className="text-muted-foreground">Advanced delivery, content protection, and AI-supported study workflows are available inside learning spaces after enrollment.</p>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {['Protected class spaces', 'Flexible delivery modes', 'Instructor authoring tools', 'Progress and assessment tracking'].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</li>)}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SectionHeader({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-3xl font-bold">{title}</h2><p className="mt-2 max-w-2xl text-muted-foreground">{description}</p></div><Button variant="ghost" asChild><Link href={href}>{cta} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div>;
}

function PreviewCard({ title, description, href }: { title: string; description: string; href: string }) {
  return <Card className="h-full"><CardHeader><CardTitle className="text-xl">{title}</CardTitle><CardDescription className="line-clamp-3">{description}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={href}>Learn more</Link></Button></CardContent></Card>;
}
