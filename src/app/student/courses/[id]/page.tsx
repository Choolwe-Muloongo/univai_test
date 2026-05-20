'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Lock,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
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

type LessonNode = {
  id: string;
  title: string;
  summary?: string | null;
  moduleTitle?: string | null;
  moduleIndex?: number;
  subLessons: Array<{ id: string; title: string; summary?: string | null }>;
};

export default function CourseHubPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const [course, setCourse] = useState<PublicShortCourse | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ShortCourseProgress | null>(null);
  const [plans, setPlans] = useState<ShortCourseAccessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
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
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load this course.'); })
      .finally(() => {
        if (mounted) {
          if (searchParams.get('payment') === 'success' && !searchParams.get('invoice')) setNotice('Payment completed. Your course access is being refreshed.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [courseId, searchParams]);

  const lessonNodes = useMemo(() => lessons.map(toLessonNode), [lessons]);
  const moduleGroups = useMemo(() => {
    const grouped = new Map<string, { title: string; items: LessonNode[]; index: number }>();
    lessonNodes.forEach((lesson, index) => {
      const title = lesson.moduleTitle?.trim() || 'Main module';
      const key = `${lesson.moduleIndex ?? 0}-${title}`;
      const existing = grouped.get(key);
      if (existing) existing.items.push(lesson);
      else grouped.set(key, { title, items: [lesson], index: lesson.moduleIndex ?? index });
    });
    return [...grouped.values()].sort((a, b) => a.index - b.index);
  }, [lessonNodes]);
  const completedLessonIds = new Set(progress?.completedLessons?.map(String) ?? []);
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
      setNotice(response.testMode ? 'Testing mode: course access is active.' : 'Course access is active.');
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

  if (loading) return <PageLoading message="Opening course hub..." />;
  if (error) return <PageError message={error} actionHref="/student/courses" actionLabel="Back to short courses" />;
  if (!course) return <PageError title="Course not found" message="This short course is unavailable." actionHref="/student/courses" actionLabel="Back to short courses" />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Course hub</p>
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{course.description}</p>
          </div>
          <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
            <div className="flex justify-between text-sm"><span>Overall progress</span><strong>{progress?.progress ?? 0}%</strong></div>
            <Progress value={progress?.progress ?? 0} className="h-3" />
            <div className="grid gap-2 text-xs text-muted-foreground">
              <Info label="Access" value={access} />
              <Info label="Plan" value={accessPlan} />
              <Info label="Time left" value={accessTimeLeft} />
            </div>
            {nextLesson && hasActiveAccess ? (
              <Button asChild className="w-full">
                <Link href={courseCompleted && reviewLesson ? `/student/courses/${course.id}/lessons/${reviewLesson.id}` : `/student/courses/${course.id}/lessons/${nextLesson.id}`}>{courseCompleted ? 'Review Course' : 'Continue Course'} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : <Button disabled className="w-full">{nextLesson ? 'Activate access to continue' : 'No lessons yet'}</Button>}
            {courseCompleted ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/short-courses">Start a new course</Link>
              </Button>
            ) : null}
          </div>
        </div>
        {notice ? <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Lessons and Sub-lessons</CardTitle>
              <CardDescription>The course map shows the path. Open a lesson to study in the focused classroom.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessonNodes.length ? moduleGroups.map((module, moduleIdx) => (<div key={`${module.title}-${moduleIdx}`} className="space-y-3 rounded-2xl border p-3"><p className="text-sm font-semibold text-primary">Module {moduleIdx + 1}: {module.title}</p>{module.items.map((lesson, index) => {
                const done = completedLessonIds.has(String(lesson.id));
                const subCount = Math.max(lesson.subLessons.length, 1);
                return (
                  <div key={lesson.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{index + 1}</div>
                        <div>
                          <h3 className="font-semibold">Lesson {index + 1}: {lesson.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{lesson.summary || `${subCount} sub-lesson/card${subCount === 1 ? '' : 's'}`}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-muted px-2 py-1">{subCount} sub-lessons/cards</span>
                            <span className="rounded-full bg-muted px-2 py-1">{done ? subCount : 0} of {subCount} completed</span>
                            <span className="rounded-full bg-muted px-2 py-1">{done ? 'Completed' : progress?.completedLessons?.length ? 'In progress' : 'Not started'}</span>
                          </div>
                        </div>
                      </div>
                      {hasActiveAccess ? (
                        <Button asChild variant={done ? 'outline' : 'default'} className="w-full sm:w-auto">
                          <Link href={`/student/courses/${course.id}/lessons/${lesson.id}`}>{done ? 'Review' : nextLesson?.id === lesson.id ? 'Continue' : 'Study'}</Link>
                        </Button>
                      ) : <Button disabled className="w-full sm:w-auto">Locked</Button>}
                    </div>
                    <div className="mt-4 space-y-2">
                      {(lesson.subLessons.length ? lesson.subLessons : [{ id: lesson.id, title: lesson.title, summary: lesson.summary }]).map((sub, subIndex) => (
                        <div key={`${lesson.id}-${sub.id}-${subIndex}`} className="flex flex-col gap-2 rounded-xl bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">{index + 1}.{subIndex + 1} {sub.title}</p>
                            {sub.summary ? <p className="mt-1 text-xs text-muted-foreground">{sub.summary}</p> : null}
                          </div>
                          <span className="text-xs text-muted-foreground">{done ? 'Completed' : 'Ready'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}</div>)) : <EmptyMessage icon={BookOpen} title="This course has no published lessons yet." />}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <ActionPanel
              icon={Sparkles}
              title="Practice Zone"
              description="Train with Easy, Medium, Hard, or Mixed practice. Practice is available after enrollment."
              actions={hasActiveAccess ? <Button asChild className="w-full"><Link href={`/student/courses/${course.id}/practice`}>Start Practice</Link></Button> : <Button disabled className="w-full">Activate access first</Button>}
            />
            <ActionPanel
              icon={FileCheck2}
              title="Project Builder"
              description="Apply what you learned by building something inside UnivAI."
              note="No required project is configured yet."
              actions={<Button disabled variant="outline" className="w-full">Project not required</Button>}
            />
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Final Exam</CardTitle>
              <CardDescription>Complete required learning first, then take the final assessment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!allLessonsComplete ? (
                <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Lock className="mb-2 h-5 w-5" />
                  Complete all required lessons before taking the final exam.
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <CheckCircle2 className="mb-2 h-5 w-5 text-primary" />
                  Final Exam Ready
                </div>
              )}
              {allLessonsComplete && hasActiveAccess ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/student/courses/${course.id}/exam`}>{courseCompleted ? 'Review Final Exam' : 'Start Final Exam'}</Link>
                </Button>
              ) : (
                <Button disabled className="w-full sm:w-auto">Start Final Exam</Button>
              )}
              {courseCompleted ? <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/short-courses">Start New Course</Link></Button> : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Your Access</CardTitle>
              <CardDescription>Course access, AI access, and certificate inclusion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Status" value={accessLabel(progress)} />
              <Info label="Plan" value={accessPlan} />
              <Info label="Access expiry" value={`${accessExpiry} · ${accessTimeLeft}`} />
              <Info label="AI access expiry" value={`${aiExpiry} · ${aiTimeLeft}`} />
              <Info label="AI quota" value={`${progress?.hourlyAiQuota ?? 0}/hr, ${progress?.dailyAiQuota ?? 0}/day`} />
              <Info label="Certificate included" value={progress?.certificateIncluded ? 'Yes' : 'No'} />
              {accessWarning ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">This access is close to expiry. Renew it before the course locks.</div> : null}
              <Button onClick={startEntryAccess} disabled={busy === 'entry'} className="w-full">
                {busy === 'entry' ? 'Working...' : progress?.entryFeePaid ? 'Renew / Refresh Access' : Number(course.price ?? 0) <= 0 ? 'Enroll Free' : 'Enroll / Pay'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Certificate</CardTitle>
              <CardDescription>Certificates unlock after the required learning path and exam.</CardDescription>
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
              <CardTitle>Single-course plans</CardTitle>
              <CardDescription>Choose one plan for this course. Bundles live on the catalogue page if you want multiple courses together.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plans.length ? plans.map((plan) => (
                <div key={plan.code} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{planLabel(plan.code)}</p>
                      <p className="text-sm text-muted-foreground">{plan.name}</p>
                    </div>
                    <p className="font-bold">{formatMoney(plan.amount, plan.currency)}</p>
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

function toLessonNode(lesson: Lesson): LessonNode {
  const extracted = lesson.learningObjects?.flatMap((object) => {
    const payload = object.payload ?? parseMaybeJson(object.body);
    return extractSubLessons(payload);
  }) ?? [];
  const row = lesson as unknown as Record<string, unknown>;
  return {
    id: lesson.id,
    title: lesson.title,
    summary: lessonSummary(lesson),
    subLessons: extracted.length ? extracted : [],
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
  const blocks = [...(Array.isArray(record.blocks) ? record.blocks : []), ...(Array.isArray(record.cards) ? record.cards : [])];
  return blocks.slice(0, 6).map((block, index) => {
    const row = block as Record<string, unknown>;
    return {
      id: String(row.id ?? `card-${index + 1}`),
      title: String(row.title ?? row.templateLabel ?? `Card ${index + 1}`),
      summary: typeof row.body === 'string' ? row.body.slice(0, 120) : null,
    };
  });
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

function EmptyMessage({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground"><Icon className="mx-auto mb-3 h-8 w-8 text-primary" />{title}</div>;
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
    case 'Lessons Required': return 'Complete all required lessons first.';
    case 'Exam Required': return 'Pass the final exam to unlock the certificate.';
    case 'Payment Required': return 'Pay the certificate fee or choose a certificate-inclusive access plan.';
    case 'Ready': return 'Your certificate is ready to download.';
    case 'Issued': return 'Your certificate has already been issued.';
    default: return 'Finish the required learning path to unlock this certificate.';
  }
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

function planPurpose(plan?: string | null) {
  const notes: Record<string, string> = {
    starter_access: 'K30 survival plan: two weeks of course access, no certificate.',
    monthly_access: 'Best low-cost access plan for learners who do not need AI.',
    ai_lite: 'Affordable AI study help with short/medium answers.',
    ai_plus: 'Daily AI support for serious learning and practice.',
    ai_scholar: 'Advanced AI study support without certificate inclusion.',
    certified_premium: 'Certificate included after passing, with strong AI support.',
    certified_elite: 'Maximum AI support, certificate inclusion, and project support.',
  };
  return plan ? notes[plan] ?? 'Per-course access plan.' : 'Per-course access plan.';
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
  if (message.includes('402')) return 'Active course access is required. Please enroll or renew access.';
  return message || 'Unable to complete this action.';
}
