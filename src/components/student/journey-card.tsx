'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { ArrowRight, BadgeCheck, Clock, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import { accessLabel, formatExpiryDate, planLabel, timeRemainingLabel } from '@/lib/short-course-ui';

export function JourneyCard({ item }: { item: ShortCourseEnrollmentSummary }) {
  const course = item.course;
  if (!course) return null;
  const progress = Number(item.progress ?? 0);
  const state = journeyState(item);
  const primary = primaryAction(item, course.id);
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="min-w-0 space-y-2 p-4 sm:space-y-3 sm:p-5">
        <div className="flex min-w-0 flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="max-w-full rounded-full bg-primary/10 px-2 py-1 text-primary">{state}</span>
          <span className="max-w-full rounded-full bg-muted px-2 py-1">Stage: {course.level ?? 'Foundation'}</span>
          <span className="max-w-full rounded-full bg-muted px-2 py-1">{planLabel(item.accessPlan ?? (item.entryFeePaid ? 'starter_access' : null))}</span>
        </div>
        <div className="min-w-0">
          <CardTitle className="break-words text-lg sm:text-xl">{course.title}</CardTitle>
          <CardDescription className="mt-1 line-clamp-2 break-words sm:mt-2 sm:line-clamp-3">{course.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 flex-1 space-y-3 px-4 pb-4 sm:space-y-4 sm:px-5">
        <div className="space-y-2">
          <div className="flex justify-between gap-3 text-sm"><span>Mission Progress</span><strong>{progress}%</strong></div>
          <Progress value={progress} className="h-2.5 sm:h-3" />
        </div>
        <div className="grid gap-2 text-sm">
          <Meta icon={Clock} label="Access" value={`${accessLabel(item)} · ${timeRemainingLabel(item.accessExpiresAt)}`} />
          <Meta icon={BadgeCheck} label="Skill Proof" value={skillProofState(item)} />
          <Meta icon={Sparkles} label="Nova Status" value={progress >= 100 ? 'Final Boss path ready' : progress >= 50 ? 'Weak area scan recommended' : 'Learning path prepared'} />
        </div>
        <div className="rounded-xl bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
          Recommended by Nova: {progress >= 75 ? 'Finish your Final Boss prep and secure the Skill Proof.' : 'Continue the next mission because it unlocks stronger practice battles.'}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 p-4 pt-0 sm:px-5 sm:pb-5">
        <Button asChild className="min-h-11 w-full">
          <Link href={primary.href}>{primary.label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <div className="grid w-full grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="min-h-10 w-full">
            <Link href={`/student/courses/${course.id}#mission-map`}><Map className="mr-2 h-4 w-4" /> Map</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-10 w-full">
            <Link href={`/student/courses/${course.id}/practice`}>Arena</Link>
          </Button>
        </div>
      </CardFooter>
      <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-5 sm:py-3">Expires: {formatExpiryDate(item.accessExpiresAt)}</div>
    </Card>
  );
}

function Meta({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 break-words"><span className="text-muted-foreground">{label}: </span><strong>{value}</strong></span></div>;
}

function primaryAction(item: ShortCourseEnrollmentSummary, courseId: string) {
  if (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt) return { label: 'Renew Access', href: `/student/courses/${courseId}` };
  if (item.certificateIssuedAt) return { label: 'View Skill Proof', href: `/student/courses/${courseId}` };
  if (Number(item.examScore ?? 0) >= 50) return { label: 'Open Skill Proof', href: `/student/courses/${courseId}` };
  if (Number(item.progress ?? 0) >= 100) return { label: 'Final Boss', href: `/student/courses/${courseId}/exam` };
  if (!item.entryFeePaid) return { label: 'Activate Access', href: `/student/courses/${courseId}` };
  return { label: 'Continue Mission', href: `/student/courses/${courseId}` };
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
