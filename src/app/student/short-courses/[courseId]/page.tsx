'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { enrollShortCourse, getCourseById, getLessonsByCourse, getShortCourseProgress } from '@/lib/api';
import type { Course, Lesson } from '@/lib/api/types';

export default function ShortCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<any>(null);
  useEffect(() => { Promise.all([getCourseById(courseId), getLessonsByCourse(courseId), getShortCourseProgress(courseId).catch(() => null)]).then(([c, l, p]) => { setCourse(c); setLessons(l); setProgress(p); }); }, [courseId]);
  const start = async () => { const result = await enrollShortCourse(courseId); const url = result.checkout_url ?? result.checkoutUrl; if (url) window.location.href = url; else setProgress(await getShortCourseProgress(courseId)); };
  if (!course) return <p>Loading course...</p>;
  return <div className="space-y-6"><Card className="border-[#00694E]/20"><CardHeader><CardTitle className="text-3xl">{course.title}</CardTitle><CardDescription>{course.description}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-muted-foreground">Entry</p><p className="font-bold">{course.currency} {course.price}</p></div><div className="rounded-lg border p-4"><p className="text-muted-foreground">Certificate</p><p className="font-bold">{course.certificateCurrency} {course.certificateFee}</p></div><div className="rounded-lg border p-4"><p className="text-muted-foreground">Duration</p><p className="font-bold">{course.durationHours ?? 0} hours</p></div></div><Progress value={progress?.progress ?? 0} /><div className="flex gap-3"><Button onClick={start} className="bg-[#00694E] hover:bg-[#00563f]">{progress?.entryFeePaid ? 'Continue course' : 'Pay entry fee / Start'}</Button><Button variant="outline" asChild><Link href={`/student/short-courses/${courseId}/exam`}>Take exam</Link></Button></div></CardContent></Card><Card><CardHeader><CardTitle>Lessons</CardTitle></CardHeader><CardContent className="space-y-2">{lessons.map((lesson) => <Link key={lesson.id} className="block rounded-lg border p-4 hover:border-[#00694E]" href={`/student/short-courses/${courseId}/lesson/${lesson.id}`}>{lesson.title}</Link>)}</CardContent></Card></div>;
}
