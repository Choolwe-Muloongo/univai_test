'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Clock, Sparkles } from 'lucide-react';
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
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{state}</span>
          <span className="rounded-full bg-muted px-2 py-1">Stage: {course.level ?? 'Foundation'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{planLabel(item.accessPlan ?? (item.entryFeePaid ? 'starter_access' : null))}</span>
        </div>
        <div>
          <CardTitle className="text-xl">{course.title}</CardTitle>
          <CardDescription className="mt-2 line-clamp-3">{course.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Mission Progress</span><strong>{progress}%</strong></div>
          <Progress value={progress} className="h-3" />
        </div>
        <div className="grid gap-2 text-sm">
          <Meta icon={Clock} label="Access" value={`${accessLabel(item)} · ${timeRemainingLabel(item.accessExpiresAt)}`} />
          <Meta icon={BadgeCheck} label="Skill Proof" value={skillProofState(item)} />
          <Meta icon={Sparkles} label="Nova Status" value={progress >= 100 ? 'Final Trial path ready' : progress >= 50 ? 'Weak area scan recommended' : 'Learning path prepared'} />
        </div>
        <div className="rounded-2xl bg-primary/5 p-3 text-sm text-muted-foreground">
          Recommended by Nova: {progress >= 75 ? 'Finish your Final Trial prep and secure the Skill Proof.' : 'Continue the next mission because it unlocks stronger practice battles.'}
        </div>
      </CardContent>
      <CardFooter className="grid gap-2 sm:grid-cols-3">
        <Button asChild className="sm:col-span-1"><Link href={`/student/courses/${course.id}`}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        <Button asChild variant="outline"><Link href={`/student/courses/${course.id}#mission-map`}>Mission Map</Link></Button>
        <Button asChild variant="outline"><Link href={`/student/courses/${course.id}/practice`}>Arena</Link></Button>
      </CardFooter>
      <div className="border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">Expires: {formatExpiryDate(item.accessExpiresAt)}</div>
    </Card>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><span className="text-muted-foreground">{label}: </span><strong>{value}</strong></span></div>;
}

function journeyState(item: ShortCourseEnrollmentSummary) {
  if (!item.entryFeePaid) return 'Access pending';
  if (item.certificateIssuedAt) return 'Skill Proof ready';
  if (Number(item.progress ?? 0) >= 100) return 'Final Trial unlocked';
  if (Number(item.progress ?? 0) >= 75) return 'Almost complete';
  if (Number(item.progress ?? 0) > 0) return 'Active';
  return 'Not started';
}

function skillProofState(item: ShortCourseEnrollmentSummary) {
  if (item.certificateIssuedAt) return 'Issued';
  if (Number(item.examScore ?? 0) >= 50) return item.certificateIncluded || item.certificateFeePaid ? 'Ready' : 'Fee required';
  if (Number(item.progress ?? 0) >= 100) return 'Final Trial required';
  return 'Locked';
}
