'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CreditCard, Gift, Sparkles, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { JourneyCard } from '@/components/student/journey-card';
import { DailyQuests } from '@/components/gamification/daily-quests';
import { XpBar } from '@/components/gamification/xp-bar';
import { StreakFlame } from '@/components/gamification/streak-flame';
import { fallbackGamification, getStudentGamification, type GamificationState } from '@/lib/api/student-gamification';
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
  const [gamification, setGamification] = useState<GamificationState>(fallbackGamification());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const invoice = searchParams.get('invoice');
    if (searchParams.get('payment') === 'success' && invoice) {
      const verification = await verifyStudentInvoicePayment(invoice).catch(() => null);
      setNotice(verification?.status === 'paid' ? verification.message ?? 'Payment confirmed and access activated.' : 'Payment is being confirmed. If access does not update immediately, refresh this page in a moment.');
    }
    const [mine, publicCourses, bundlePlans] = await Promise.all([
      getMyShortCourses().catch(() => []),
      getPublicShortCourses(),
      getShortCourseBundlePlans().catch(() => []),
    ]);
    setEnrollments(mine);
    setCourses(publicCourses);
    setBundles(bundlePlans);
    const avgProgress = mine.length ? Math.round(mine.reduce((sum, item) => sum + Number(item.progress ?? 0), 0) / mine.length) : 0;
    setGamification(await getStudentGamification().catch(() => fallbackGamification(avgProgress)));
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load Journeys.'); })
      .finally(() => {
        if (mounted) {
          if (searchParams.get('payment') === 'success' && !searchParams.get('invoice')) setNotice('Payment completed. Your Journey access is being refreshed.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [searchParams]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.course?.id).filter(Boolean)), [enrollments]);
  const browseCourses = courses.filter((course) => !enrolledIds.has(course.id));
  const activeJourney = enrollments.find((item) => item.course && Number(item.progress ?? 0) < 100) ?? enrollments.find((item) => item.course) ?? null;

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
      setNotice(response.testMode ? 'Testing mode: your Journey access is active.' : 'You are enrolled. Your Journey is now active.');
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
      setNotice(response.testMode ? 'Testing mode: bundle Journey access is active.' : 'Bundle Journey access is active.');
      setSelectedBundleCourses([]);
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoading message="Loading your Journeys..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Browse public catalogue" />;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">My Journeys</p>
            <h1 className="text-3xl font-bold tracking-tight">Choose your next mission path</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Short courses now behave like Journeys: missions, stages, Training Arena practice, Boss Battles, Final Trials, rewards, and Skill Proofs.</p>
          </div>
          <Button asChild className="w-full sm:w-auto"><Link href="/short-courses">Browse public catalogue</Link></Button>
        </div>
        {notice ? <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Active Journeys</h2>
                <p className="text-sm text-muted-foreground">Continue Missions, view Mission Maps, and train weak areas from each Journey card.</p>
              </div>
            </div>
            {enrollments.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {enrollments.map((item) => <JourneyCard key={item.id} item={item} />)}
              </div>
            ) : (
              <Card className="rounded-3xl border-dashed">
                <CardContent className="space-y-4 p-8 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-primary" />
                  <div>
                    <CardTitle>You have not joined any Journey yet.</CardTitle>
                    <CardDescription className="mt-2">Choose a Journey below to start earning XP, rewards, and Skill Proof progress.</CardDescription>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
          <DailyQuests quests={gamification.quests} />
        </div>
        <aside className="space-y-5">
          <XpBar xp={gamification.xp} level={gamification.level} levelTitle={gamification.levelTitle} nextLevelXp={gamification.nextLevelXp} />
          <StreakFlame days={gamification.streakDays} protectedToday={gamification.streakProtected} />
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader><CardTitle>Nova Mentor</CardTitle><CardDescription>Your AI learning coach follows the Journey, not just the chat page.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{gamification.novaMessage}</p>
              <div className="flex flex-wrap gap-2">
                {activeJourney?.course ? <Button asChild size="sm"><Link href={`/student/courses/${activeJourney.course.id}`}>Start Mission</Link></Button> : null}
                {activeJourney?.course ? <Button asChild size="sm" variant="outline"><Link href={`/student/courses/${activeJourney.course.id}/practice`}>Training Arena</Link></Button> : null}
                <Button asChild size="sm" variant="outline"><Link href="/student/ai">Ask Nova</Link></Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Discover New Journeys</h2>
          <p className="text-sm text-muted-foreground">Every Journey can unlock missions, Training Arena battles, Final Trials, and Skill Proofs.</p>
        </div>
        {browseCourses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {browseCourses.map((course) => (
              <Card key={course.id} className="flex h-full flex-col rounded-3xl">
                <CardHeader>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
                    <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0} hours</span>
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <Info icon={CreditCard} label={formatMoney(course.price, course.currency || 'ZMW') === 'Free' ? 'Free Journey access' : 'Starter Access from ZMW 30 for 14 days'} />
                  <Info icon={Gift} label="Rewards, XP, badges, and Skill Proof path" />
                  <Info icon={Sparkles} label="Nova-guided missions and practice" />
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" className="w-full"><Link href={`/student/courses/${course.id}`}>View Mission Control</Link></Button>
                  <Button className="w-full" onClick={() => enroll(course)} disabled={busyId === course.id}>{busyId === course.id ? 'Working...' : Number(course.price ?? 0) <= 0 ? 'Start Free' : 'Enroll / Pay'}</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : <Card className="rounded-3xl border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">No additional published Journeys are available right now.</CardContent></Card>}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Optional Journey bundles</h2>
          <p className="text-sm text-muted-foreground">Bundles are for learners who want several Journeys at once.</p>
        </div>
        {bundles.length ? (
          <Card className="rounded-3xl">
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[320px_1fr]">
              <div className="space-y-3">
                <label className="block space-y-2 text-sm font-medium"><span>Bundle plan</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedBundle} onChange={(event) => { setSelectedBundle(event.target.value); setSelectedBundleCourses([]); }}>{bundles.map((bundle) => <option key={bundle.code} value={bundle.code}>{bundle.name} - {formatMoney(bundle.amount, bundle.currency)}</option>)}</select></label>
                <BundleSummary bundle={bundles.find((bundle) => bundle.code === selectedBundle)} selectedCount={selectedBundleCourses.length} />
                <Button className="w-full" onClick={buyBundle} disabled={busyId === selectedBundle || selectedBundleCourses.length !== (bundles.find((bundle) => bundle.code === selectedBundle)?.courseCount ?? 0)}>{busyId === selectedBundle ? 'Working...' : 'Buy selected bundle'}</Button>
              </div>
              <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
                {courses.map((course) => {
                  const checked = selectedBundleCourses.includes(course.id);
                  return <button key={course.id} type="button" onClick={() => setSelectedBundleCourses((current) => checked ? current.filter((id) => id !== course.id) : [...current, course.id])} className={`rounded-2xl border p-3 text-left text-sm ${checked ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}><p className="font-semibold">{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.level ?? 'beginner'} - {course.durationHours ?? 0} hours</p></button>;
                })}
              </div>
            </CardContent>
          </Card>
        ) : <Card className="rounded-3xl border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">Bundle plans are not available right now.</CardContent></Card>}
      </section>
    </div>
  );
}

function BundleSummary({ bundle, selectedCount }: { bundle?: ShortCourseAccessPlan; selectedCount: number }) {
  if (!bundle) return null;
  const required = bundle.courseCount ?? 0;
  return <div className="rounded-2xl border bg-muted/30 p-3 text-sm"><p className="font-semibold">{bundle.name}</p><p className="mt-1 text-muted-foreground">{formatMoney(bundle.amount, bundle.currency)} - {Math.round(bundle.accessHours / 24)} days - select {required} Journeys</p><p className="mt-1 text-muted-foreground">AI: {bundle.aiHours ? `${bundle.dailyAiQuota}/day shared` : 'not included'} - Skill Proof: {bundle.certificateIncluded ? 'included' : 'not included'}</p><p className={selectedCount === required ? 'mt-2 text-primary' : 'mt-2 text-muted-foreground'}>{selectedCount} of {required} Journeys selected</p></div>;
}

function Info({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <div className="flex items-start gap-2 text-sm text-muted-foreground"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 break-words">{label}</span></div>;
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to enroll right now.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to enroll right now.';
}
