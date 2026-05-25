'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  Lock,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { CourseMissionMap, type MissionStageGroup } from '@/components/student/course-mission-map';
import { getLessonsByCourse } from '@/lib/api';
import type { Lesson } from '@/lib/api/types';
import { getShortCourseAccessPlans, purchaseShortCourseAccessPlan, type ShortCourseAccessPlan } from '@/lib/api/short-course-access';
import {
  enrollShortCourse,
  formatMoney,
  getPublicShortCourse,
  getShortCourseCertificateUrl,
  getShortCourseProgress,
  payShortCourseCertificate,
  paymentUrl,
  verifyStudentInvoicePayment,
  type PublicShortCourse,
  type ShortCourseProgress,
} from '@/lib/api/short-courses';
import { accessLabel, formatExpiryDate, isExpiringSoon, planLabel as shortCoursePlanLabel, timeRemainingLabel } from '@/lib/short-course-ui';

type LessonChildNode = { id: string; title: string; summary?: string | null };

type LessonNode = {
  id: string;
  title: string;
  summary?: string | null;
  moduleTitle?: string | null;
  moduleIndex?: number;
  lessonIndex?: number;
  isSubLesson?: boolean;
  parentLessonTitle?: string | null;
  parentLessonIndex?: number | null;
  subLessons: LessonChildNode[];
};

export default function CourseHubPage() {
  return (
    <Suspense fallback={<PageLoading message="Opening Mission Control..." />}>
      <CourseHubPageInner />
    </Suspense>
  );
}

function CourseHubPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const paymentStatus = searchParams.get('payment');
  const invoiceId = searchParams.get('invoice');
  const [course, setCourse] = useState<PublicShortCourse | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ShortCourseProgress | null>(null);
  const [plans, setPlans] = useState<ShortCourseAccessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (paymentStatus === 'success' && invoiceId) {
      const verification = await verifyStudentInvoicePayment(invoiceId).catch(() => null);
      if (verification?.status === 'paid') {
        setNotice(verification.message ?? 'Payment confirmed and access activated.');
      } else {
        setNotice('Payment is being confirmed. If access does not update immediately, refresh this page in a moment.');
      }
    }

    const [courseData, lessonData, progressData, planData] = await Promise.all([
      getPublicShortCourse(courseId),
      getLessonsByCourse(courseId).catch(() => []),
      getShortCourseProgress(courseId).catch(() => null),
      getShortCourseAccessPlans(courseId).catch(() => []),
    ]);

    setCourse(courseData);
    setLessons(lessonData);
    setProgress(progressData);
    setPlans(planData);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load this Journey.');
      })
      .finally(() => {
        if (mounted) {
          if (paymentStatus === 'success' && !invoiceId) {
            setNotice('Payment completed. Your Journey access is being refreshed.');
          }
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [courseId, paymentStatus, invoiceId]);

  const lessonNodes = useMemo(() => lessons.map(toLessonNode), [lessons]);
  const groupedLessonNodes = useMemo(() => groupParentAndSubLessons(lessonNodes), [lessonNodes]);
  const moduleGroups = useMemo(() => groupLessonsIntoStages(groupedLessonNodes), [groupedLessonNodes]);
  const completedLessonIds = useMemo(() => new Set(progress?.completedLessons?.map(String) ?? []), [progress?.completedLessons]);
  const totalLessons = lessonNodes.length;
  const completedLessons = lessonNodes.filter((lesson) => completedLessonIds.has(String(lesson.id))).length;
  const nextLesson = lessonNodes.find((lesson) => !completedLessonIds.has(String(lesson.id))) ?? lessonNodes[0];
  const reviewLesson = lessonNodes[0] ?? null;
  const allLessonsComplete = totalLessons > 0 && completedLessons >= totalLessons;
  const courseCompleted = Boolean(progress?.completedAt) || allLessonsComplete;
  const access = accessState(progress);
  const hasActiveAccess = access === 'Active';
  const certificate = certificateState(progress);
  const accessPlan = shortCoursePlanLabel(progress?.accessPlan ?? (progress?.entryFeePaid ? 'starter_access' : null));
  const accessExpiry = progress?.accessExpiresAt ? formatExpiryDate(progress.accessExpiresAt) : 'No expiry set';
  const accessTimeLeft = timeRemainingLabel(progress?.accessExpiresAt);
  const aiExpiry = progress?.aiAccessExpiresAt ? formatExpiryDate(progress.aiAccessExpiresAt) : 'No AI expiry';
  const aiTimeLeft = timeRemainingLabel(progress?.aiAccessExpiresAt);
  const accessWarning = isExpiringSoon(progress?.accessExpiresAt, 5);

  async function startEntryAccess() {
    setBusy('entry');
    setNotice(null);
    setError(null);
    try {
      const response = await enrollShortCourse(courseId);
      const checkout = paymentUrl(response);
      if (checkout) {
        window.location.href = checkout;
        return;
      }
      setNotice(response.testMode ? 'Testing mode: Journey access is active.' : 'Journey access is active.');
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusy(null);
    }
  }

  async function activatePlan(planCode: string) {
    setBusy(planCode);
    setNotice(null);
    setError(null);
    try {
      const response = await purchaseShortCourseAccessPlan(courseId, planCode);
      const checkout = paymentUrl(response);
      if (checkout) {
        window.location.href = checkout;
        return;
      }
      setNotice(response.testMode ? 'Testing mode: access plan activated.' : 'Access plan activated.');
      await refresh();
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusy(null);
    }
  }

  async function openCertificate() {
    setBusy('certificate');
    setError(null);
    try {
      if (certificate === 'Payment Required') {
        const response = await payShortCourseCertificate(courseId);
        const checkout = paymentUrl(response);
        if (checkout) {
          window.location.href = checkout;
          return;
        }
      }
      window.location.href = getShortCourseCertificateUrl(courseId);
    } catch (cause) {
      setError(studentFriendlyError(cause));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PageLoading message="Opening Mission Control..." />;
  if (error) return <PageError message={error} actionHref="/student/courses" actionLabel="Back to Journeys" />;
  if (!course) return <PageError title="Journey not found" message="This Journey is unavailable." actionHref="/student/courses" actionLabel="Back to Journeys" />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mission Control</p>
            <h1 className="break-words text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{course.description}</p>
          </div>
          <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
            <div className="flex justify-between text-sm"><span>Journey progress</span><strong>{progress?.progress ?? 0}%</strong></div>
            <Progress value={progress?.progress ?? 0} className="h-3" />
            <div className="grid gap-2 text-xs text-muted-foreground">
              <Info label="Access" value={access} />
              <Info label="Plan" value={accessPlan} />
              <Info label="Time left" value={accessTimeLeft} />
            </div>
            {nextLesson && hasActiveAccess ? (
              <Button asChild className="w-full">
                <Link href={courseCompleted && reviewLesson ? `/student/courses/${course.id}/lessons/${reviewLesson.id}` : `/student/courses/${course.id}/lessons/${nextLesson.id}`}>{courseCompleted ? 'Replay Journey' : 'Continue Journey'} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button onClick={startEntryAccess} disabled={busy === 'entry' || !nextLesson} className="min-h-11 w-full">
                {busy === 'entry' ? 'Opening payment...' : nextLesson ? Number(course.price ?? 0) <= 0 ? 'Enroll Free' : 'Pay Entry / Activate Access' : 'No missions yet'}
              </Button>
            )}
            {courseCompleted ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/courses">Choose a new Journey</Link>
              </Button>
            ) : null}
          </div>
        </div>
        {notice ? <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <CourseMissionMap
            courseId={course.id}
            moduleGroups={moduleGroups}
            completedLessonIds={completedLessonIds}
            hasActiveAccess={hasActiveAccess}
            nextLessonId={nextLesson?.id ?? null}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ActionPanel
              icon={Sparkles}
              title="Training Arena"
              description="Train with Easy, Medium, Hard, or Mixed practice. The Arena opens after enrollment."
              actions={hasActiveAccess ? <Button asChild className="w-full"><Link href={`/student/courses/${course.id}/practice`}>Enter Training Arena</Link></Button> : <Button onClick={startEntryAccess} disabled={busy === 'entry'} className="min-h-11 w-full">{busy === 'entry' ? 'Opening payment...' : 'Pay Entry First'}</Button>}
            />
            <ActionPanel
              icon={FileCheck2}
              title="Project Forge"
              description="Apply what you learned by building something inside UnivAI."
              note="No required project mission is configured yet."
              actions={<Button disabled variant="outline" className="w-full">Project mission locked</Button>}
            />
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Final Boss Exam</CardTitle>
              <CardDescription>Clear the required missions first, then challenge the final assessment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!allLessonsComplete ? (
                <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Lock className="mb-2 h-5 w-5" />
                  Clear all required missions before entering the Final Boss Exam.
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <CheckCircle2 className="mb-2 h-5 w-5 text-primary" />
                  Final Boss Exam Ready
                </div>
              )}
              {allLessonsComplete && hasActiveAccess ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/student/courses/${course.id}/exam`}>{courseCompleted ? 'Replay Final Boss' : 'Start Final Boss'}</Link>
                </Button>
              ) : !hasActiveAccess ? (
                <Button onClick={startEntryAccess} disabled={busy === 'entry'} className="min-h-11 w-full sm:w-auto">{busy === 'entry' ? 'Opening payment...' : 'Pay Entry First'}</Button>
              ) : (
                <Button disabled className="w-full sm:w-auto">Start Final Boss</Button>
              )}
              {courseCompleted ? <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/student/courses">Choose New Journey</Link></Button> : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-3xl border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Your Access</CardTitle>
              <CardDescription>Journey access, AI access, and certificate inclusion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Status" value={accessLabel(progress)} />
              <Info label="Plan" value={accessPlan} />
              <Info label="Access expiry" value={`${accessExpiry} · ${accessTimeLeft}`} />
              <Info label="AI access expiry" value={`${aiExpiry} · ${aiTimeLeft}`} />
              <Info label="AI quota" value={`${progress?.hourlyAiQuota ?? 0}/hr, ${progress?.dailyAiQuota ?? 0}/day`} />
              <Info label="Certificate included" value={progress?.certificateIncluded ? 'Yes' : 'No'} />
              {accessWarning ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">This access is close to expiry. Renew it before the Journey locks.</div> : null}
              <Button onClick={startEntryAccess} disabled={busy === 'entry'} className="min-h-11 w-full">
                {busy === 'entry' ? 'Opening payment...' : progress?.entryFeePaid ? 'Renew / Refresh Access' : Number(course.price ?? 0) <= 0 ? 'Enroll Free' : 'Pay Entry / Activate Access'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Certificate</CardTitle>
              <CardDescription>Certificates unlock after the required Journey path and exam.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border p-4">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{certificate}</p>
                  <p className="text-sm text-muted-foreground">{certificateHelp(certificate)}</p>
                </div>
              </div>
              <Button onClick={openCertificate} disabled={!['Payment Required', 'Ready', 'Issued'].includes(certificate) || busy === 'certificate'} className="w-full">
                {certificate === 'Payment Required' ? 'Pay Certificate Fee' : certificate === 'Issued' ? 'Download Certificate' : 'Open Certificate'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Single-Journey plans</CardTitle>
              <CardDescription>Choose one plan for this Journey. Bundles are available in the Bundles tab on your Journeys page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plans.length ? plans.map((plan) => (
                <div key={plan.code} className="rounded-2xl border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{planLabel(plan.code)}</p>
                      <p className="break-words text-sm text-muted-foreground">{plan.name}</p>
                    </div>
                    <p className="shrink-0 font-bold sm:text-right">{formatMoney(plan.amount, plan.currency)}</p>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <span>Access: {Math.round(plan.accessHours / 24)} days</span>
                    <span>AI: {plan.aiHours ? `${Math.round(plan.aiHours / 24)} days` : 'Not included'}</span>
                    <span>AI quota: {plan.hourlyAiQuota}/hr, {plan.dailyAiQuota}/day</span>
                    <span>{plan.certificateIncluded ? 'Certificate included' : 'Certificate fee separate'}</span>
                    <span>{planPurpose(plan.code)}</span>
                  </div>
                  <Button className="mt-3 w-full" variant={progress?.accessPlan === plan.code ? 'secondary' : 'outline'} onClick={() => activatePlan(plan.code)} disabled={busy === plan.code}>
                    {busy === plan.code ? 'Working...' : progress?.accessPlan === plan.code ? 'Active Plan' : 'Choose Plan'}
                  </Button>
                </div>
              )) : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No access plans are available yet.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function groupLessonsIntoStages(lessons: LessonNode[]): MissionStageGroup[] {
  const grouped = new Map<string, MissionStageGroup>();
  lessons.forEach((lesson, index) => {
    const title = lesson.moduleTitle?.trim() || 'Main Stage';
    const key = `${lesson.moduleIndex ?? 0}-${title}`;
    const existing = grouped.get(key);
    if (existing) existing.items.push(lesson);
    else grouped.set(key, { title, items: [lesson], index: lesson.moduleIndex ?? index });
  });
  return [...grouped.values()]
    .map((module) => ({ ...module, items: module.items.sort((a, b) => (a.lessonIndex ?? 0) - (b.lessonIndex ?? 0)) }))
    .sort((a, b) => a.index - b.index);
}

function groupParentAndSubLessons(lessons: LessonNode[]) {
  const parents = lessons.filter((lesson) => !lesson.isSubLesson);
  const children = lessons.filter((lesson) => lesson.isSubLesson);

  return parents.map((parent) => {
    const childRows = children
      .filter((child) => {
        if (child.parentLessonTitle && child.parentLessonTitle === parent.title) return true;
        if (child.parentLessonIndex !== null && child.parentLessonIndex !== undefined && child.parentLessonIndex === parent.lessonIndex) return true;
        return false;
      })
      .sort((a, b) => (a.lessonIndex ?? 0) - (b.lessonIndex ?? 0))
      .map((child) => ({ id: child.id, title: child.title, summary: child.summary }));

    const existingSubIds = new Set(parent.subLessons.map((sub) => String(sub.id)));
    return { ...parent, subLessons: [...parent.subLessons, ...childRows.filter((child) => !existingSubIds.has(String(child.id)))] };
  });
}

function toLessonNode(lesson: Lesson): LessonNode {
  const extracted = lesson.learningObjects?.flatMap((object) => {
    const payload = object.payload ?? parseMaybeJson(object.body);
    return extractSubLessons(payload);
  }) ?? [];
  const row = lesson as unknown as Record<string, unknown>;
  const firstPayload = lesson.learningObjects
    ?.map((object) => object.payload ?? parseMaybeJson(object.body))
    .find((payload) => payload && typeof payload === 'object') as Record<string, unknown> | undefined;
  return {
    id: lesson.id,
    title: lesson.title,
    summary: lessonSummary(lesson),
    moduleTitle: stringOrNull(row.moduleTitle ?? firstPayload?.moduleTitle),
    moduleIndex: numberOrUndefined(row.moduleIndex ?? firstPayload?.moduleIndex),
    lessonIndex: numberOrUndefined(row.lessonIndex ?? firstPayload?.lessonIndex),
    isSubLesson: booleanValue(row.isSubLesson ?? firstPayload?.isSubLesson),
    parentLessonTitle: stringOrNull(row.parentLessonTitle ?? firstPayload?.parentLessonTitle),
    parentLessonIndex: numberOrNull(row.parentLessonIndex ?? firstPayload?.parentLessonIndex),
    subLessons: extracted,
  };
}

function lessonSummary(lesson: Lesson): string | null {
  const fromObjects = lesson.learningObjects?.flatMap((object) => {
    const payload = object.payload ?? parseMaybeJson(object.body);
    return extractSummaryText(payload);
  }) ?? [];
  const firstObjectSummary = fromObjects.find((item) => item.trim().length > 0);
  if (firstObjectSummary) return firstObjectSummary.slice(0, 180);

  if (lesson.content) {
    const parsed = parseMaybeJson(lesson.content);
    if (parsed) {
      const parsedSummary = extractSummaryText(parsed).find((item) => item.trim().length > 0);
      if (parsedSummary) return parsedSummary.slice(0, 180);
    }

    const cleaned = stripHtml(lesson.content);
    if (cleaned && !cleaned.startsWith('{"blocks"') && !cleaned.startsWith('[{"')) return cleaned.slice(0, 180);
  }

  return null;
}

function extractSummaryText(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const blocks = [
    ...(Array.isArray(record.blocks) ? record.blocks : []),
    ...(Array.isArray(record.cards) ? record.cards : []),
    ...(Array.isArray(record.items) ? record.items : []),
  ] as Record<string, unknown>[];

  const textFromBlocks = blocks
    .flatMap((block) => [
      typeof block.body === 'string' ? block.body : null,
      typeof block.text === 'string' ? block.text : null,
      typeof block.summary === 'string' ? block.summary : null,
      typeof block.prompt === 'string' ? block.prompt : null,
    ])
    .filter((item): item is string => Boolean(item))
    .map((item) => stripHtml(item).trim())
    .filter(Boolean);

  if (textFromBlocks.length) return textFromBlocks;

  if (typeof record.summary === 'string') return [stripHtml(record.summary)];
  if (typeof record.description === 'string') return [stripHtml(record.description)];
  return [];
}

function extractSubLessons(value: unknown): LessonNode['subLessons'] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const groups = [record.subLessons, record.sub_lessons, record.sections, record.topics, record.lessons]
    .filter(Array.isArray)
    .flat() as Record<string, unknown>[];
  if (groups.length) {
    return groups.map((item, index) => ({
      id: String(item.id ?? `sub-${index + 1}`),
      title: String(item.title ?? item.name ?? `Sub-lesson ${index + 1}`),
      summary: typeof item.summary === 'string' ? item.summary : typeof item.description === 'string' ? item.description : null,
    }));
  }
  return [];
}

function stringOrNull(value: unknown) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  return text || null;
}

function numberOrUndefined(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined;
  return Number.isFinite(number) ? number : undefined;
}

function numberOrNull(value: unknown) {
  const number = numberOrUndefined(value);
  return number === undefined ? null : number;
}

function booleanValue(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return Boolean(value);
}

function ActionPanel({ icon: Icon, title, description, note, actions }: { icon: LucideIcon; title: string; description: string; note?: string; actions: ReactNode }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {note ? <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{note}</p> : null}
        {actions}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><span className="text-muted-foreground">{label}</span><strong className="break-words sm:text-right">{value}</strong></div>;
}

function accessState(progress?: ShortCourseProgress | null) {
  if (!progress?.entryFeePaid) return 'Pending Payment';
  if (progress.accessExpiresAt && new Date(progress.accessExpiresAt).getTime() < Date.now()) return 'Expired';
  return 'Active';
}

function certificateState(progress?: ShortCourseProgress | null) {
  if (!progress?.entryFeePaid) return 'Locked';
  if (!progress.completedAt && Number(progress.examScore ?? 0) < 50) return progress.progress >= 100 ? 'Exam Required' : 'Lessons Required';
  if (!progress.certificateFeePaid && !progress.certificateIncluded) return 'Payment Required';
  if (progress.certificateIssuedAt) return 'Issued';
  return 'Ready';
}

function certificateHelp(state: string) {
  switch (state) {
    case 'Lessons Required': return 'Clear all required missions first.';
    case 'Exam Required': return 'Pass the Final Boss Exam to unlock the certificate.';
    case 'Payment Required': return 'Pay the certificate fee or choose a certificate-inclusive access plan.';
    case 'Ready': return 'Your certificate is ready to download.';
    case 'Issued': return 'Your certificate has already been issued.';
    default: return 'Finish the required Journey path to unlock this certificate.';
  }
}

function planLabel(plan?: string | null) {
  const labels: Record<string, string> = {
    free_access: 'Free Journey Access',
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

function planPurpose(plan?: string | null) {
  const notes: Record<string, string> = {
    starter_access: 'Starter plan: two weeks of Journey access, no certificate.',
    monthly_access: 'Best low-cost access plan for learners who do not need AI.',
    ai_lite: 'Affordable AI study help with short/medium answers.',
    ai_plus: 'Daily AI support for serious learning and practice.',
    ai_scholar: 'Advanced AI study support without certificate inclusion.',
    certified_premium: 'Certificate included after passing, with strong AI support.',
    certified_elite: 'Maximum AI support, certificate inclusion, and project support.',
  };
  return plan ? notes[plan] ?? 'Per-Journey access plan.' : 'Per-Journey access plan.';
}

function parseMaybeJson(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to complete this action.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to complete this action.';
}
