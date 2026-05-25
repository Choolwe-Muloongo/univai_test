'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CreditCard, Gift, Search, Sparkles, type LucideIcon } from 'lucide-react';

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

type CourseTab = 'journeys' | 'choose' | 'bundles';

const tabs: Array<{ key: CourseTab; label: string; description: string }> = [
  { key: 'journeys', label: 'My Journeys', description: 'Continue missions' },
  { key: 'choose', label: 'Choose New', description: 'Find a course' },
  { key: 'bundles', label: 'Bundles', description: 'Buy multiple' },
];

export default function CoursesPage() {
  const searchParams = useSearchParams();
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

  useEffect(() => {
    if (!enrollments.length) setActiveTab('choose');
  }, [enrollments.length]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.course?.id).filter(Boolean)), [enrollments]);
  const browseCourses = useMemo(() => courses.filter((course) => !enrolledIds.has(course.id)), [courses, enrolledIds]);
  const levels = useMemo(() => ['all', ...Array.from(new Set(browseCourses.map((course) => course.level ?? 'beginner')))], [browseCourses]);
  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    return browseCourses.filter((course) => {
      const matchesQuery = !query || `${course.title} ${course.description ?? ''} ${course.level ?? ''}`.toLowerCase().includes(query);
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
      setError(`Select exactly ${requiredBundleCourses} Journey${requiredBundleCourses === 1 ? '' : 's'} before buying this bundle.`);
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
      setNotice(response.testMode ? 'Testing mode: bundle Journey access is active.' : 'Bundle Journey access is active.');
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
    <div className="mx-auto w-full max-w-7xl space-y-5 overflow-hidden px-3 py-4 sm:px-5 lg:px-6">
      <section className="overflow-hidden rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">Journey Command</p>
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Choose your next mission path</h1>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground">Continue your active Journeys, choose a new short course, or buy a bundle without leaving the student dashboard.</p>
        </div>
        {notice ? <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

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
                  <h2 className="text-xl font-semibold sm:text-2xl">Active Journeys</h2>
                  <p className="break-words text-sm text-muted-foreground">Continue Missions, view Mission Maps, and train weak areas.</p>
                </div>
                <Button onClick={() => setActiveTab('choose')} className="min-h-11 w-full sm:w-auto">Choose New</Button>
              </div>
              {enrollments.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {enrollments.map((item) => <JourneyCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptyState title="You have not joined any Journey yet." description="Choose a new Journey to start earning XP, rewards, and Skill Proof progress." action={<Button onClick={() => setActiveTab('choose')}>Choose New Journey</Button>} />
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
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Choose New Journey</p>
                <h2 className="break-words text-xl font-semibold sm:text-2xl">Pick one course first. Plans come after.</h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">This keeps the flow simple: choose course → open Mission Control → choose access → start.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[560px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input className="min-h-11 w-full rounded-2xl border bg-background pl-9 pr-3 text-sm" placeholder="Search courses..." value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} />
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
            <EmptyState title="No matching Journeys found." description="Try another search term or level filter." />
          )}
        </section>
      ) : null}

      {activeTab === 'bundles' ? (
        <section className="space-y-4">
          <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Optional bundles</p>
            <h2 className="break-words text-xl font-semibold sm:text-2xl">Buy several Journeys together</h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">Bundles are optional. Use this only when a student wants multiple courses at once.</p>
          </div>
          {bundles.length ? (
            <Card className="overflow-hidden rounded-3xl">
              <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="min-w-0 space-y-3">
                  <label className="block space-y-2 text-sm font-medium"><span>Bundle plan</span><select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm" value={selectedBundle} onChange={(event) => { setSelectedBundle(event.target.value); setSelectedBundleCourses([]); }}>{bundles.map((bundle) => <option key={bundle.code} value={bundle.code}>{bundle.name} - {formatMoney(bundle.amount, bundle.currency)}</option>)}</select></label>
                  <BundleSummary bundle={selectedBundlePlan} selectedCount={selectedBundleCourses.length} />
                  <div className="rounded-2xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                    Review selected Journeys before paying. If mobile money deducts funds but access does not activate, do not pay again immediately.
                  </div>
                  <Button className="min-h-11 w-full" onClick={buyBundle} disabled={busyId === selectedBundle || !canBuyBundle}>{busyId === selectedBundle ? 'Working...' : canBuyBundle ? 'Buy selected bundle' : `Select ${requiredBundleCourses || 0} Journey${requiredBundleCourses === 1 ? '' : 's'}`}</Button>
                </div>
                <div className="min-w-0 space-y-3">
                  <input className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm" placeholder="Search bundle courses..." value={bundleQuery} onChange={(event) => setBundleQuery(event.target.value)} />
                  <div className="grid max-h-[70svh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {bundleCourses.map((course) => {
                      const checked = selectedBundleCourses.includes(course.id);
                      const atLimit = Boolean(requiredBundleCourses && selectedBundleCourses.length >= requiredBundleCourses && !checked);
                      return <button key={course.id} type="button" disabled={atLimit} onClick={() => toggleBundleCourse(course.id)} className={`rounded-2xl border p-3 text-left text-sm transition ${checked ? 'border-primary bg-primary/5' : atLimit ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50'}`}><p className="break-words font-semibold">{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.level ?? 'beginner'} · {course.durationHours ?? 0} hours</p><p className="mt-2 text-xs font-medium text-primary">{checked ? 'Selected' : atLimit ? 'Bundle full' : 'Tap to select'}</p></button>;
                    })}
                    {!bundleCourses.length ? <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground sm:col-span-2">No eligible Journeys match this search.</div> : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : <EmptyState title="Bundle plans are not available right now." description="Students can still choose single Journeys from the Choose New tab." />}
        </section>
      ) : null}
    </div>
  );
}

function CourseDiscoveryCard({ course, busy, onEnroll }: { course: PublicShortCourse; busy: boolean; onEnroll: () => void }) {
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0} hours</span>
        </div>
        <CardTitle className="break-words text-lg sm:text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3 break-words">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 flex-1 space-y-3 px-4 pb-4 text-sm sm:px-5">
        <Info icon={CreditCard} label={formatMoney(course.price, course.currency || 'ZMW') === 'Free' ? 'Free Journey access' : 'Starter Access from ZMW 30 for 14 days'} />
        <Info icon={Gift} label="Rewards, XP, badges, and Skill Proof path" />
        <Info icon={Sparkles} label="Nova-guided missions and practice" />
      </CardContent>
      <CardFooter className="grid gap-2 p-4 pt-0 sm:px-5 sm:pb-5">
        <Button asChild variant="outline" className="min-h-11 w-full"><Link href={`/student/courses/${course.id}`}>Preview Mission Control</Link></Button>
        <Button className="min-h-11 w-full" onClick={onEnroll} disabled={busy}>{busy ? 'Working...' : Number(course.price ?? 0) <= 0 ? 'Start Free Journey' : 'Enroll / Pay'}</Button>
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

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border-dashed">
      <CardContent className="space-y-4 p-6 text-center sm:p-8">
        <BookOpen className="mx-auto h-9 w-9 text-primary" />
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
  return <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 break-words">{label}</span></div>;
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to enroll right now.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to enroll right now.';
}
