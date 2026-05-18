'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpen, CreditCard, Sparkles, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getShortCourseBundlePlans, purchaseShortCourseBundle, type ShortCourseAccessPlan } from '@/lib/api/short-course-access';
import {
  enrollShortCourse,
  formatMoney,
  getMyShortCourses,
  getPublicShortCourses,
  paymentUrl,
  verifyStudentInvoicePayment,
  type PublicShortCourse,
  type ShortCourseEnrollmentSummary,
} from '@/lib/api/short-courses';

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const [enrollments, setEnrollments] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [courses, setCourses] = useState<PublicShortCourse[]>([]);
  const [bundles, setBundles] = useState<ShortCourseAccessPlan[]>([]);
  const [selectedBundle, setSelectedBundle] = useState('starter_3_bundle');
  const [selectedBundleCourses, setSelectedBundleCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const invoice = searchParams.get('invoice');
    if (searchParams.get('payment') === 'success' && invoice) {
      const verification = await verifyStudentInvoicePayment(invoice).catch(() => null);
      if (verification?.status === 'paid') {
        setNotice(verification.message ?? 'Payment confirmed and access activated.');
      } else {
        setNotice('Payment is being confirmed. If access does not update immediately, refresh this page in a moment.');
      }
    }
    const [mine, publicCourses] = await Promise.all([
      getMyShortCourses().catch(() => []),
      getPublicShortCourses(),
    ]);
    setEnrollments(mine);
    setCourses(publicCourses);
    setBundles(await getShortCourseBundlePlans().catch(() => []));
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short courses.'); })
      .finally(() => {
        if (mounted) {
          if (searchParams.get('payment') === 'success' && !searchParams.get('invoice')) setNotice('Payment completed. Your short-course access is being refreshed.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [searchParams]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.course?.id).filter(Boolean)), [enrollments]);
  const browseCourses = courses.filter((course) => !enrolledIds.has(course.id));

  async function enroll(course: PublicShortCourse) {
    setBusyId(course.id);
    setNotice(null);
    setError(null);
    try {
      const response = await enrollShortCourse(course.id);
      const checkout = paymentUrl(response);
      if (checkout) {
        window.location.href = checkout;
        return;
      }
      setNotice(response.testMode ? 'Testing mode: you are enrolled and access is active.' : 'You are enrolled.');
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function buyBundle() {
    const bundle = bundles.find((item) => item.code === selectedBundle);
    if (!bundle) return;
    setBusyId(selectedBundle);
    setNotice(null);
    setError(null);
    try {
      const response = await purchaseShortCourseBundle(selectedBundle, selectedBundleCourses);
      const checkout = paymentUrl(response);
      if (checkout) {
        window.location.href = checkout;
        return;
      }
      setNotice(response.testMode ? 'Testing mode: bundle access is active.' : 'Bundle access is active.');
      setSelectedBundleCourses([]);
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoading message="Loading short courses..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Browse public catalogue" />;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Student learning</p>
            <h1 className="text-3xl font-bold tracking-tight">My Short Courses</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Continue lessons, practice by difficulty, take exams, and unlock certificates from one place.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto"><Link href="/short-courses">Browse public catalogue</Link></Button>
        </div>
        {notice ? <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Continue Learning</h2>
            <p className="text-sm text-muted-foreground">Courses you have joined appear here.</p>
          </div>
        </div>

        {enrollments.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((item) => item.course ? <EnrolledCourseCard key={item.id} item={item} /> : null)}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="space-y-4 p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-primary" />
              <div>
                <CardTitle>You have not joined any short course yet.</CardTitle>
                <CardDescription className="mt-2">Choose a course below to start learning.</CardDescription>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Browse More Short Courses</h2>
          <p className="text-sm text-muted-foreground">Free courses enroll immediately. Paid courses open checkout or testing access depending on backend settings.</p>
        </div>

        {browseCourses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {browseCourses.map((course) => (
              <Card key={course.id} className="flex h-full flex-col rounded-2xl">
                <CardHeader>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
                    <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0} hours</span>
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <Info icon={CreditCard} label={formatMoney(course.price, course.currency || 'ZMW') === 'Free' ? 'Free to learn' : 'Starter Access from ZMW 30 for 14 days'} />
                  <Info icon={BadgeCheck} label={Number(course.certificateFee ?? 0) > 0 ? `Certificate fee applies: ${formatMoney(course.certificateFee, course.certificateCurrency || course.currency || 'ZMW')}` : 'Certificate included when eligible'} />
                  <Info icon={Sparkles} label="Interactive lessons, practice, exam, and certificate path" />
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" className="w-full"><Link href={`/short-courses/${course.id}`}>View Course</Link></Button>
                  <Button className="w-full" onClick={() => enroll(course)} disabled={busyId === course.id}>
                    {busyId === course.id ? 'Working...' : Number(course.price ?? 0) <= 0 ? 'Enroll Free' : 'Enroll / Pay'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">No additional published short courses are available right now.</CardContent></Card>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Course Bundles</h2>
          <p className="text-sm text-muted-foreground">Bundles are cheaper than buying courses one by one. AI limits are shared across the bundle.</p>
        </div>
        {bundles.length ? (
          <Card className="rounded-3xl">
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[320px_1fr]">
              <div className="space-y-3">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Bundle plan</span>
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedBundle} onChange={(event) => { setSelectedBundle(event.target.value); setSelectedBundleCourses([]); }}>
                    {bundles.map((bundle) => <option key={bundle.code} value={bundle.code}>{bundle.name} - {formatMoney(bundle.amount, bundle.currency)}</option>)}
                  </select>
                </label>
                <BundleSummary bundle={bundles.find((bundle) => bundle.code === selectedBundle)} selectedCount={selectedBundleCourses.length} />
                <Button className="w-full" onClick={buyBundle} disabled={busyId === selectedBundle || selectedBundleCourses.length !== (bundles.find((bundle) => bundle.code === selectedBundle)?.courseCount ?? 0)}>
                  {busyId === selectedBundle ? 'Working...' : 'Buy selected bundle'}
                </Button>
              </div>
              <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
                {courses.map((course) => {
                  const checked = selectedBundleCourses.includes(course.id);
                  return (
                    <button key={course.id} type="button" onClick={() => setSelectedBundleCourses((current) => checked ? current.filter((id) => id !== course.id) : [...current, course.id])} className={`rounded-2xl border p-3 text-left text-sm ${checked ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                      <p className="font-semibold">{course.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{course.level ?? 'beginner'} - {course.durationHours ?? 0} hours</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">Bundle plans are not available right now.</CardContent></Card>
        )}
      </section>
    </div>
  );
}

function BundleSummary({ bundle, selectedCount }: { bundle?: ShortCourseAccessPlan; selectedCount: number }) {
  if (!bundle) return null;
  const required = bundle.courseCount ?? 0;
  return (
    <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
      <p className="font-semibold">{bundle.name}</p>
      <p className="mt-1 text-muted-foreground">{formatMoney(bundle.amount, bundle.currency)} - {Math.round(bundle.accessHours / 24)} days - select {required} courses</p>
      <p className="mt-1 text-muted-foreground">AI: {bundle.aiHours ? `${bundle.dailyAiQuota}/day shared` : 'not included'} - Certificate: {bundle.certificateIncluded ? 'included' : 'not included'}</p>
      <p className={selectedCount === required ? 'mt-2 text-primary' : 'mt-2 text-muted-foreground'}>{selectedCount} of {required} courses selected</p>
    </div>
  );
}

function EnrolledCourseCard({ item }: { item: ShortCourseEnrollmentSummary }) {
  const course = item.course!;
  const certificate = item.certificateIssuedAt ? 'Issued' : Number(item.examScore ?? 0) >= 50 ? 'Ready / payment check' : 'Not earned';
  return (
    <Card className="flex h-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Progress</span><strong>{item.progress}%</strong></div>
          <Progress value={item.progress} className="h-2" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1">Status: {item.status}</span>
          <span className="rounded-full bg-muted px-2 py-1">Access: {item.entryFeePaid ? 'Active' : 'Pending payment'}</span>
          {item.accessPlan ? <span className="rounded-full bg-muted px-2 py-1">Plan: {planLabel(item.accessPlan)}</span> : null}
          <span className="rounded-full bg-muted px-2 py-1">Certificate: {certificate}</span>
          {item.accessExpiresAt ? <span className="rounded-full bg-muted px-2 py-1">Expires: {formatDate(item.accessExpiresAt)}</span> : null}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/student/courses/${course.id}`}>Open Course <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Info({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <div className="flex items-start gap-2 text-muted-foreground"><Icon className="mt-0.5 h-4 w-4 text-primary" /><span>{label}</span></div>;
}

function planLabel(plan?: string | null) {
  const labels: Record<string, string> = {
    free_access: 'Free Course Access',
    entry: 'Starter Access',
    starter_access: 'Starter Access',
    access_only: 'Monthly Access',
    monthly_access: 'Monthly Access',
    access_ai: 'AI Plus',
    ai_lite: 'AI Lite',
    ai_plus: 'AI Plus',
    ai_scholar: 'AI Scholar',
    premium_certificate: 'Certified Premium',
    certified_premium: 'Certified Premium',
    elite_certificate: 'Certified Elite',
    certified_elite: 'Certified Elite',
  };
  return plan ? labels[plan] ?? plan.replace(/_/g, ' ') : 'Not active';
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to enroll right now.';
  if (message.includes('402')) return 'Active course access is required. Please enroll or renew access.';
  return message || 'Unable to enroll right now.';
}
