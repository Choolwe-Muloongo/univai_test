'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, Lock, Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type Course, type Lesson } from '@/lib/api/types';
import { getCourseById, getCourseMeeting, getLessonsByCourse } from '@/lib/api';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useSession } from '@/components/providers/session-provider';
import type { CourseMeeting } from '@/lib/api/types';

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <Card><CardContent><Skeleton className="aspect-video w-full" /></CardContent></Card>
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
      <div className="lg:col-span-1"><Skeleton className="h-64 w-full rounded-3xl" /></div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { session } = useSession();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [meeting, setMeeting] = useState<CourseMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      setUserRole(session?.user?.role ?? null);
      if (!id) return;
      setLoading(true);
      const [foundCourse, foundLessons, meetingInfo] = await Promise.all([
        getCourseById(id),
        getLessonsByCourse(id),
        getCourseMeeting(id),
      ]);
      setCourse(foundCourse);
      setCourseLessons(foundLessons);
      setMeeting(meetingInfo);
      setLoading(false);
    };
    loadCourse();
  }, [id, session]);

  const placeholder = PlaceHolderImages.find((p) => p.id === course?.imageId);
  const isFreemium = userRole === 'freemium-student';
  const introductoryLessonCount = 2;
  const firstUnlockedLesson = courseLessons.find((_, index) => !(isFreemium && index >= introductoryLessonCount));

  if (loading) return <CourseSkeleton />;
  if (!course) notFound();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <Card className="overflow-hidden rounded-3xl border-primary/20 shadow-sm">
          <CardContent className="p-0">
            <div className="relative flex aspect-[16/7] items-center justify-center bg-muted">
              <Image src={placeholder?.imageUrl || `https://picsum.photos/seed/${course.id}/1200/500`} alt={course.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/5" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-semibold uppercase text-white/75">Short course</p>
                <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
                <p className="mt-1 max-w-2xl text-white/90">{course.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Course Lessons</h2>
            <p className="text-muted-foreground">Choose a lesson to open the focused learning room.</p>
          </div>

          <div className="space-y-3">
            {courseLessons.length ? courseLessons.map((lesson, index) => {
              const locked = isFreemium && index >= introductoryLessonCount;
              return (
                <Card key={lesson.id} className={`rounded-3xl transition ${locked ? 'border-dashed bg-muted/30' : 'hover:border-primary/50 hover:shadow-sm'}`}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">{String(index + 1).padStart(2, '0')}</div>
                      <div>
                        <h3 className="font-bold">{lesson.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{lesson.content ? 'Interactive cards, math visuals, and checkpoints.' : 'Card lesson prepared from the course builder.'}</p>
                      </div>
                    </div>
                    {locked ? (
                      <Button variant="outline" disabled className="gap-2"><Lock className="size-4" /> Locked</Button>
                    ) : (
                      <Button asChild className="gap-2"><Link href={`/student/courses/${course.id}/lessons/${lesson.id}`}><BookOpen className="size-4" /> Study lesson</Link></Button>
                    )}
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="rounded-3xl border p-10 text-center text-muted-foreground">No lessons have been published yet.</div>
            )}
          </div>
        </section>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24 rounded-3xl border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Rocket className="size-5" /> Course Actions</CardTitle>
            <CardDescription>Start learning or attempt the final assessment when ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {firstUnlockedLesson ? <Button size="lg" className="w-full" asChild><Link href={`/student/courses/${course.id}/lessons/${firstUnlockedLesson.id}`}>Start first lesson</Link></Button> : null}
            <Button size="lg" variant="outline" className="w-full" asChild><Link href={`/student/courses/${course.id}/exam`}>Start Final Exam</Link></Button>
            {meeting?.meetingUrl ? <Button variant="outline" className="w-full" asChild><Link href={meeting.meetingUrl} target="_blank">Join Live Lesson</Link></Button> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
