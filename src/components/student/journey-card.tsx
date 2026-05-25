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
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-2 p-4 sm:space-y-3 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{state}</span>
          <span className="rounded-full bg-muted px-2 py-1">Level: {course.level ?? 'Foundation'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{planLabel(item.accessPlan ?? (item.entryFeePaid ? 'starter_access' : null))}</span>
        </div>
        <div>
          <CardTitle className="text-lg sm:text-xl">{course.title}</CardTitle>
          <CardDescription className="mt-1 line-clamp-2 sm:mt-2 sm:line-clamp-3">{course.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 px-4 pb-4 sm:space-y-4 sm:px-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Learning progress</span><strong>{progress}%</strong></div>
          <Progress value={progress} className="h-2.5 sm:h-3" />
        </div>
        <div className="grid gap-2 text-sm">
          <Meta icon={Clock} label="Access" value={`${accessLabel(item)} · ${timeRemainingLabel(item.accessExpiresAt)}`} />
          <Meta icon={BadgeCheck} label="Certificate" value={skillProofState(item)} />
          <Meta icon={Sparkles} label="Nova" value={progress >= 100 ? 'Final assessment path ready' : progress >= 50 ? 'Practice review recommended' : 'Learning path prepared'} />
        </div>
        <div className="rounded-xl bg-primary/5 p-3 text-sm text-muted-foreground">
          Recommended: {progress >= 75 ? 'Finish final assessment prep and secure your certificate.' : 'Continue the next lesson before jumping into practice.'}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 p-4 pt-0 sm:px-5 sm:pb-5">
        <Button asChild className="w-full">
          <Link href={primary.href}>{primary.label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <div className="grid w-full grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/student/courses/${course.id}#mission-map`}><Map className="mr-2 h-4 w-4" /> Path</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/student/courses/${course.id}/practice`}>Practice</Link>
          </Button>
        </div>
      </CardFooter>
      <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-5 sm:py-3">Expires: {formatExpiryDate(item.accessExpiresAt)}</div>
    </Card>
  );
}

function Meta({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0"><span className="text-muted-foreground">{label}: </span><strong className="break-words">{value}</strong></span></div>;
}

function primaryAction(item: ShortCourseEnrollmentSummary, courseId: string) {
  if (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt) return { label: 'Renew Access', href: `/student/courses/${courseId}` };
  if (item.certificateIssuedAt) return { label: 'View Certificate', href: `/student/courses/${courseId}` };
  if (Number(item.examScore ?? 0) >= 50) return { label: 'Open Certificate', href: `/student/courses/${courseId}` };
  if (Number(item.progress ?? 0) >= 100) return { label: 'Final Assessment', href: `/student/courses/${courseId}/exam` };
  if (!item.entryFeePaid) return { label: 'Activate Access', href: `/student/courses/${courseId}` };
  return { label: 'Continue Learning', href: `/student/courses/${courseId}` };
}

function journeyState(item: ShortCourseEnrollmentSummary) {
  if (!item.entryFeePaid) return 'Access pending';
  if (isExpired(item.accessExpiresAt) && !item.certificateIssuedAt) return 'Expired';
  if (item.certificateIssuedAt) return 'Certificate ready';
  if (Number(item.examScore ?? 0) >= 50) return 'Certificate step';
  if (Number(item.progress ?? 0) >= 100) return 'Final assessment unlocked';
  if (Number(item.progress ?? 0) >= 75) return 'Almost complete';
  if (Number(item.progress ?? 0) > 0) return 'Active';
  return 'Not started';
}

function skillProofState(item: ShortCourseEnrollmentSummary) {
  if (item.certificateIssuedAt) return 'Issued';
  if (Number(item.examScore ?? 0) >= 50) return item.certificateIncluded || item.certificateFeePaid ? 'Ready' : 'Fee required';
  if (Number(item.progress ?? 0) >= 100) return 'Final assessment required';
  return 'Locked';
}

function isExpired(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}
