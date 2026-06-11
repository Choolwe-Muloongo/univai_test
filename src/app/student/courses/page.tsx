'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, CreditCard, Gift, Search, Sparkles, Target, Trophy, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Progress } from '@/components/ui/progress';
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

type CourseTab = 'journeys' | 'choose' | 'bundles';

const tabs: Array<{ key: CourseTab; label: string; description: string }> = [
  { key: 'journeys', label: 'My Journeys', description: 'Continue missions' },
  { key: 'choose', label: 'Discover', description: 'Find a course' },
  { key: 'bundles', label: 'Packs', description: 'Save with bundles' },
];

export default function CoursesPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading your Journeys..." />}>
      <CoursesPageInner />
    </Suspense>
  );
}

function CoursesPageInner() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const invoiceId = searchParams.get('invoice');
  const [enrollments, setEnrollments] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [courses, setCourses] = useState<PublicShortCourse[]>([]);
  const [bundles, setBundles] = useState<ShortCourseAccessPlan[]>([]);
  const [activeTab, setActiveTab] = useState<CourseTab>('journeys');
  const [courseQuery, setCourseQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedBundle, setSelectedBundle] = useState('starter_3_bundle');
  const [selectedBundleCourses, setSelectedBundleCourses] = useState<string[]>([]);
  const [bundleQuery, setBundleQuery] = useState('');
  const [gamification, setGamification] = useState<GamificationState>(fallbackGamification());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (paymentStatus === 'success' && invoiceId) {
      const verification = await verifyStudentInvoicePayment(invoiceId).catch(() => null);
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
          if (paymentStatus === 'success' && !invoiceId) setNotice('Payment completed. Your Journey access is being refreshed.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [paymentStatus, invoiceId]);

  useEffect(() => {
    if (!enrollments.length) setActiveTab('choose');
  }, [enrollments.length]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.course?.id).filter(Boolean)), [enrollments]);
  const browseCourses = useMemo(() => courses.filter((course) => !enrolledIds.has(course.id)), [courses, enrolledIds]);
  const levels = useMemo(() => ['all', ...Array.from(new Set(browseCourses.map((course) => course.level ?? 'beginner')))], [browseCourses]);
  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    return browseCourses.filter((course) => {
      const matchesQuery = !query || `${course.title} ${course.description ?? ''} ${course.level ?? ''} ${(course.outcomes ?? []).join(' ')}`.toLowerCase().includes(query);
      const matchesLevel = levelFilter === 'all' || (course.level ?? 'beginner') === levelFilter;
      return matchesQuery && matchesLevel;
    });
  }, [browseCourses, courseQuery, levelFilter]);
  const bundleCourses = useMemo(() => {
    const query = bundleQuery.trim().toLowerCase();
    return browseCourses.filter((course) => !query || `${course.title} ${course.description ?? ''} ${course.level ?? ''}`.toLowerCase().includes(query));
  }, [browseCourses, bundleQuery]);
  const selectedBundlePlan = bundles.find((bundle) => bundle.code === selectedBundle);
  const requiredBundleCourses = selectedBundlePlan?.courseCount ?? 0;
  const canBuyBundle = requiredBundleCourses > 0 && selectedBundleCourses.length === requiredBundleCourses;
  const activeJourney = enrollments.find((item) => item.course && Number(item.progress ?? 0) < 100) ?? enrollments.find((item) => item.course) ?? null;
  const averageProgress = enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + Number(item.progress ?? 0), 0) / enrollments.length) : 0;

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
      setActiveTab('journeys');
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function buyBundle() {
    const bundle = selectedBundlePlan;
    if (!bundle) return;
    if (!canBuyBundle) {
      setError(`Select exactly ${requiredBundleCourses} Journey${requiredBundleCourses === 1 ? '' : 's'} before buying this pack.`);
      return;
    }
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
      setNotice(response.testMode ? 'Testing mode: pack Journey access is active.' : 'Pack Journey access is active.');
      setSelectedBundleCourses([]);
      setActiveTab('journeys');
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusyId(null);
    }
  }

  function toggleBundleCourse(courseId: string) {
    setSelectedBundleCourses((current) => {
      if (current.includes(courseId)) return current.filter((id) => id !== courseId);
      if (requiredBundleCourses && current.length >= requiredBundleCourses) return current;
      return [...current, courseId];
    });
  }

  if (loading) return <PageLoading message="Loading your Journeys..." />;
  if (error) return <PageError message={error} actionHref="/student" actionLabel="Back to student home" />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-5 lg:px-6">
      <TodayHero
        activeJourney={activeJourney}
        averageProgress={averageProgress}
        totalJourneys={enrollments.length}
        xp={gamification.xp}
        streakDays={gamification.streakDays}
        setActiveTab={setActiveTab}
      />

      {notice ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}

      <nav className="grid gap-2 rounded-3xl border bg-card p-2 shadow-sm sm:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`min-h-16 rounded-2xl px-3 py-3 text-left transition ${activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className={`mt-1 block text-xs ${activeTab === tab.key ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{tab.description}</span>
          </button>
        ))}
      </nav>

      {activeTab === 'journeys' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold sm:text-2xl">My Journeys</h2>
                  <p className="break-words text-sm text-muted-foreground">Continue missions, view maps, and train weak areas.</p>
                </div>
                <Button onClick={() => setActiveTab('choose')} className="min-h-11 w-full sm:w-auto">Discover New</Button>
              </div>
              {enrollments.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {enrollments.map((item) => <JourneyCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptyState title="No Journeys yet." description="Choose a Journey to start earning XP, rewards, and Skill Proof progress." action={<Button onClick={() => setActiveTab('choose')}>Discover Journeys</Button>} />
              )}
            </section>
            <DailyQuests quests={gamification.quests} />
          </div>
          <aside className="min-w-0 space-y-5">
            <XpBar xp={gamification.xp} level={gamification.level} levelTitle={gamification.levelTitle} nextLevelXp={gamification.nextLevelXp} />
            <StreakFlame days={gamification.streakDays} protectedToday={gamification.streakProtected} />
            <NovaCard message={gamification.novaMessage} activeJourney={activeJourney} />
          </aside>
        </div>
      ) : null}

      {activeTab === 'choose' ? (
        <section className="space-y-4">
          <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Discover Journeys</p>
                <h2 className="break-words text-xl font-semibold sm:text-2xl">Pick the course. Plans come after.</h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">{filteredCourses.length} of {browseCourses.length} available Journey{browseCourses.length === 1 ? '' : 's'} shown.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[560px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input className="min-h-11 w-full rounded-2xl border bg-background pl-9 pr-3 text-sm" placeholder="Search by title, skill, or topic..." value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} />
                </label>
                <select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm capitalize" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                  {levels.map((level) => <option key={level} value={level}>{level === 'all' ? 'All levels' : level}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredCourses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseDiscoveryCard key={course.id} course={course} busy={busyId === course.id} onEnroll={() => enroll(course)} />
              ))}
            </div>
          ) : (
            <EmptyState title="No matching Journeys found." description="Try another search term or level filter." action={<Button variant="outline" onClick={() => { setCourseQuery(''); setLevelFilter('all'); }}>Clear filters</Button>} />
          )}
        </section>
      ) : null}

      {activeTab === 'bundles' ? (
        <section className="space-y-4">
          <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Save with Packs</p>
            <h2 className="break-words text-xl font-semibold sm:text-2xl">Buy several Journeys together</h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">Packs are optional. Use them when you want multiple short courses at once.</p>
          </div>
          {bundles.length ? (
            <Card className="overflow-hidden rounded-3xl">
              <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="min-w-0 space-y-3">
                  <label className="block space-y-2 text-sm font-medium"><span>Pack plan</span><select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm" value={selectedBundle} onChange={(event) => { setSelectedBundle(event.target.value); setSelectedBundleCourses([]); }}>{bundles.map((bundle) => <option key={bundle.code} value={bundle.code}>{bundle.name} - {formatMoney(bundle.amount, bundle.currency)}</option>)}</select></label>
                  <BundleSummary bundle={selectedBundlePlan} selectedCount={selectedBundleCourses.length} />
                  <div className="rounded-2xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                    Review selected Journeys before paying. If mobile money deducts funds but access does not activate, do not pay again immediately.
                  </div>
                  <Button className="min-h-11 w-full" onClick={buyBundle} disabled={busyId === selectedBundle || !canBuyBundle}>{busyId === selectedBundle ? 'Working...' : canBuyBundle ? 'Buy selected pack' : `Select ${requiredBundleCourses || 0} Journey${requiredBundleCourses === 1 ? '' : 's'}`}</Button>
                </div>
                <div className="min-w-0 space-y-3">
                  <input className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm" placeholder="Search pack courses..." value={bundleQuery} onChange={(event) => setBundleQuery(event.target.value)} />
                  <div className="grid max-h-[70svh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {bundleCourses.map((course) => {
                      const checked = selectedBundleCourses.includes(course.id);
                      const atLimit = Boolean(requiredBundleCourses && selectedBundleCourses.length >= requiredBundleCourses && !checked);
                      return <button key={course.id} type="button" disabled={atLimit} onClick={() => toggleBundleCourse(course.id)} className={`rounded-2xl border p-3 text-left text-sm transition ${checked ? 'border-primary bg-primary/5' : atLimit ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50'}`}><p className="break-words font-semibold">{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.level ?? 'beginner'} · {course.durationHours ?? 0} hours</p><p className="mt-2 text-xs font-medium text-primary">{checked ? 'Selected' : atLimit ? 'Pack full' : 'Tap to select'}</p></button>;
                    })}
                    {!bundleCourses.length ? <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground sm:col-span-2">No eligible Journeys match this search.</div> : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : <EmptyState title="Pack plans are not available right now." description="Students can still choose single Journeys from Discover." />}
        </section>
      ) : null}
    </div>
  );
}

function TodayHero({ activeJourney, averageProgress, totalJourneys, xp, streakDays, setActiveTab }: { activeJourney: ShortCourseEnrollmentSummary | null; averageProgress: number; totalJourneys: number; xp: number; streakDays: number; setActiveTab: (tab: CourseTab) => void }) {
  const course = activeJourney?.course;
  const progress = Math.round(Number(activeJourney?.progress ?? averageProgress ?? 0));
  return (
    <section className="overflow-hidden rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">Today on UnivAI</p>
            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{course ? 'Continue your Journey' : 'Start your first Journey'}</h1>
            <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{course ? 'Your next mission is ready. Open the Journey, continue learning, then train weak areas in the Arena.' : 'Pick one short course and UnivAI will turn it into missions, practice, XP, and Skill Proof progress.'}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <MiniStat label="Journeys" value={String(totalJourneys)} />
            <MiniStat label="Avg progress" value={`${progress}%`} />
            <MiniStat label="Streak" value={`${streakDays}d`} />
          </div>
        </div>
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
          {course ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next mission</p>
                <h2 className="mt-1 break-words text-xl font-bold">{course.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{progress >= 100 ? 'Final Boss is ready.' : progress > 0 ? 'Continue where you stopped.' : 'Start Mission 1.'}</p>
              </div>
              <Progress value={progress} className="h-3" />
              <Button asChild className="min-h-12 w-full rounded-2xl text-base font-semibold">
                <Link href={`/student/courses/${course.id}`}>{progress >= 100 ? 'Open Final Boss Path' : 'Continue Learning'} <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Target className="size-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold">No active Journey yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">Discover a course and start Mission 1 today.</p>
              </div>
              <Button className="min-h-12 w-full rounded-2xl text-base font-semibold" onClick={() => setActiveTab('choose')}>Discover Journeys</Button>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">XP: {xp}</p>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><p className="text-lg font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function CourseDiscoveryCard({ course, busy, onEnroll }: { course: PublicShortCourse; busy: boolean; onEnroll: () => void }) {
  const isFree = Number(course.price ?? 0) <= 0;
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0} hours</span>
          <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">{formatMoney(course.price, course.currency || 'ZMW')}</span>
        </div>
        <CardTitle className="break-words text-lg sm:text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3 break-words">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 flex-1 space-y-3 px-4 pb-4 text-sm sm:px-5">
        <Info icon={CreditCard} label={isFree ? 'Free Journey access' : 'Pay entry from inside your student dashboard'} />
        <Info icon={Gift} label="XP, badges, rewards, and Skill Proof path" />
        <Info icon={Sparkles} label="Nova-guided missions and Training Arena" />
      </CardContent>
      <CardFooter className="grid gap-2 p-4 pt-0 sm:px-5 sm:pb-5">
        <Button className="min-h-11 w-full font-semibold" onClick={onEnroll} disabled={busy}>{busy ? 'Opening payment...' : isFree ? 'Start Free Journey' : 'Pay Entry / Start Journey'}</Button>
        <Button asChild variant="outline" className="min-h-11 w-full"><Link href={`/student/courses/${course.id}`}>Preview Mission Control</Link></Button>
      </CardFooter>
    </Card>
  );
}

function NovaCard({ message, activeJourney }: { message: string; activeJourney: ShortCourseEnrollmentSummary | null }) {
  return (
    <Card className="rounded-3xl border-primary/20 bg-primary/5">
      <CardHeader><CardTitle>Nova Mentor</CardTitle><CardDescription>Your AI learning coach follows the Journey.</CardDescription></CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="break-words">{message}</p>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {activeJourney?.course ? <Button asChild size="sm" className="min-h-10"><Link href={`/student/courses/${activeJourney.course.id}`}>Start Mission</Link></Button> : null}
          {activeJourney?.course ? <Button asChild size="sm" variant="outline" className="min-h-10"><Link href={`/student/courses/${activeJourney.course.id}/practice`}>Training Arena</Link></Button> : null}
          <Button asChild size="sm" variant="outline" className="min-h-10"><Link href="/student/ai">Ask Nova</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BundleSummary({ bundle, selectedCount }: { bundle?: ShortCourseAccessPlan; selectedCount: number }) {
  if (!bundle) return null;
  const required = bundle.courseCount ?? 0;
  return <div className="rounded-2xl border bg-muted/30 p-3 text-sm"><p className="break-words font-semibold">{bundle.name}</p><p className="mt-1 break-words text-muted-foreground">{formatMoney(bundle.amount, bundle.currency)} · {Math.round(bundle.accessHours / 24)} days · select {required} Journeys</p><p className="mt-1 break-words text-muted-foreground">AI: {bundle.aiHours ? `${bundle.dailyAiQuota}/day shared` : 'not included'} · Skill Proof: {bundle.certificateIncluded ? 'included' : 'not included'}</p><p className={selectedCount === required ? 'mt-2 text-primary' : 'mt-2 text-muted-foreground'}>{selectedCount} of {required} Journeys selected</p></div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="rounded-3xl border-dashed">
      <CardContent className="space-y-4 p-6 text-center sm:p-8">
        <BookOpen className="mx-auto size-9 text-primary" />
        <div>
          <CardTitle className="break-words">{title}</CardTitle>
          <CardDescription className="mt-2 break-words">{description}</CardDescription>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

function Info({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><span className="min-w-0 break-words">{label}</span></div>;
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to enroll right now.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to enroll right now.';
}
