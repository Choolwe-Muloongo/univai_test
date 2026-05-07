'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCourses } from '@/lib/api';
import type { Course } from '@/lib/api/types';

export default function ShortCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => { getCourses().then(setCourses).catch(() => setCourses([])); }, []);
  return <div className="space-y-8">
    <div className="rounded-3xl bg-[#00694E] p-8 text-white shadow-lg"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">UnivAI Short Courses</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Career-ready certificates, priced clearly.</h1><p className="mt-3 max-w-2xl text-white/80">Pay the entry fee to start lessons, complete the exam, then optionally pay the certificate fee to unlock your verified certificate.</p></div>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <Card key={course.id} className="flex h-full flex-col"><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant="secondary">{course.level ?? 'Beginner'}</Badge><span className="text-sm text-muted-foreground">★ 4.8</span></div><CardTitle>{course.title}</CardTitle><CardDescription>{course.description}</CardDescription></CardHeader><CardContent className="flex-1 space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg border p-3"><p className="text-muted-foreground">Entry fee</p><p className="font-bold">{course.currency ?? 'ZMW'} {course.price ?? 50}</p></div><div className="rounded-lg border p-3"><p className="text-muted-foreground">Certificate</p><p className="font-bold">{course.certificateCurrency ?? 'USD'} {course.certificateFee ?? 15}</p></div></div><Progress value={course.progress ?? 0} className="h-2" /></CardContent><CardFooter><Button asChild className="w-full bg-[#00694E] hover:bg-[#00563f]"><Link href={`/student/short-courses/${course.id}`}>View course</Link></Button></CardFooter></Card>)}</div>
  </div>;
}
