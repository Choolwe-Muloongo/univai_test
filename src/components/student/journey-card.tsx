'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { ArrowRight, BadgeCheck, Clock, Flame, Map, Sparkles, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import { accessLabel, formatExpiryDate, planLabel, timeRemainingLabel } from '@/lib/short-course-ui';

export function JourneyCard({ item }: { item: ShortCourseEnrollmentSummary }) {
  const course = item.course;
  if (!course) return null;

  const progress = Math.max(0, Math.min(100, Number(item.progress ?? 0)));
  const state = journeyState(item);
  const primary = primaryAction(item, course.id);
  const isLocked = !item.entryFeePaid || (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt);
  const nextMissionLabel = nextMissionText(item);

  return (
    <Card className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border-primary/10 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <CardHeader className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
              <span className={`rounded-full px-2.5 py-1 ${isLocked ? 'bg-amber-100 text-amber-900' : 'bg-primary/10 text-primary'}`}>{state}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{course.level ?? 'Foundation'}</span>
            </div>
            <CardTitle className="break-words text-xl leading-tight sm:text-2xl">{course.title}</CardTitle>
          </div>
          <div className="grid size-16 shrink-0 place-items-center rounded-full border bg-background text-center shadow-sm">
            <span className="text-lg font-black text-primary">{progress}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between gap-3 text-sm text-muted-foreground">
            <span>Journey progress</span>
            <strong className="text-foreground">{progress}%</strong>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="min-w-0 flex-1 space-y-4 px-4 pb-4 sm:px-5">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next mission</p>
              <p className="mt-1 break-words text-sm font-semibold">{nextMissionLabel}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{isLocked ? 'Activate access to continue this Journey.' : 'Continue from Mission Control and keep your progress moving.'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <Meta icon={Clock} label="Access" value={`${accessLabel(item)} · ${timeRemainingLabel(item.accessExpiresAt)}`} />
          <Meta icon={BadgeCheck} label="Skill Proof" value={skillProofState(item)} />
          <Meta icon={Flame} label="Plan" value={planLabel(item.accessPlan ?? (item.entryFeePaid ? 'starter_access' : null))} />
          <Meta icon={Sparkles} label="Nova" value={novaHint(progress)} />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-4 pt-0 sm:px-5 sm:pb-5">
        <Button asChild className="min-h-12 w-full rounded-2xl text-base font-semibold">
          <Link href={primary.href}>{primary.label} <ArrowRight className="ml-2 size-4" /></Link>
        </Button>
        <div className="grid w-full grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="min-h-11 w-full rounded-2xl">
            <Link href={`/student/courses/${course.id}#mission-map`}><Map className="mr-2 size-4" /> Map</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11 w-full rounded-2xl">
            <Link href={`/student/courses/${course.id}/practice`}>Arena</Link>
          </Button>
        </div>
      </CardFooter>

      <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-5 sm:py-3">
        Expires: {formatExpiryDate(item.accessExpiresAt)}
      </div>
    </Card>
  );
}

function Meta({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-2xl border bg-background/60 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="min-w-0 break-words">
        <span className="text-muted-foreground">{label}: </span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

function primaryAction(item: ShortCourseEnrollmentSummary, courseId: string) {
  if (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt) return { label: 'Renew Access', href: `/student/courses/${courseId}` };
  if (item.certificateIssuedAt) return { label: 'View Skill Proof', href: `/student/courses/${courseId}` };
  if (Number(item.examScore ?? 0) >= 50) return { label: 'Open Skill Proof', href: `/student/courses/${courseId}` };
  if (Number(item.progress ?? 0) >= 100) return { label: 'Final Boss', href: `/student/courses/${courseId}/exam` };
  if (!item.entryFeePaid) return { label: 'Activate Access', href: `/student/courses/${courseId}` };
  return { label: 'Continue Journey', href: `/student/courses/${courseId}` };
}

function journeyState(item: ShortCourseEnrollmentSummary) {
  if (!item.entryFeePaid) return 'Access pending';
  if (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt) return 'Expired';
  if (item.certificateIssuedAt) return 'Skill Proof ready';
  if (Number(item.examScore ?? 0) >= 50) return 'Skill Proof step';
  if (Number(item.progress ?? 0) >= 100) return 'Final Boss unlocked';
  if (Number(item.progress ?? 0) >= 75) return 'Almost complete';
  if (Number(item.progress ?? 0) > 0) return 'Active';
  return 'Not started';
}

function nextMissionText(item: ShortCourseEnrollmentSummary) {
  const progress = Number(item.progress ?? 0);
  if (!item.entryFeePaid) return 'Activate access to unlock Mission 1';
  if (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt) return 'Renew access to continue';
  if (item.certificateIssuedAt) return 'Skill Proof is ready';
  if (Number(item.examScore ?? 0) >= 50) return 'Open your Skill Proof';
  if (progress >= 100) return 'Challenge the Final Boss Exam';
  if (progress >= 75) return 'Finish the last missions';
  if (progress >= 50) return 'Continue the next mission and train weak areas';
  if (progress > 0) return 'Continue your current mission';
  return 'Start Mission 1';
}

function novaHint(progress: number) {
  if (progress >= 100) return 'Final Boss path ready';
  if (progress >= 75) return 'Almost there';
  if (progress >= 50) return 'Practice scan recommended';
  if (progress > 0) return 'Keep your streak alive';
  return 'Learning path prepared';
}

function skillProofState(item: ShortCourseEnrollmentSummary) {
  if (item.certificateIssuedAt) return 'Issued';
  if (Number(item.examScore ?? 0) >= 50) return item.certificateIncluded || item.certificateFeePaid ? 'Ready' : 'Fee required';
  if (Number(item.progress ?? 0) >= 100) return 'Final Boss required';
  return 'Locked';
}

function isExpired(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}
