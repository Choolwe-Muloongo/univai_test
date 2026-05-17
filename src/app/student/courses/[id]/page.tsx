'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock, Rocket } from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
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
        <Skeleton className="h-96 w-full rounded-3xl" />
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
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
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
  const activeLesson = courseLessons[activeLessonIndex] ?? courseLessons[0] ?? null;
  const isFreemium = userRole === 'freemium-student';
  const introductoryLessonCount = 2;
  const locked = isFreemium && activeLessonIndex >= introductoryLessonCount;

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
                <p className="mt-1 text-white/90">Interactive lessons powered by the same card player used in the builder preview.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Lesson Content</h2>
            <p className="text-muted-foreground">SoloLearn-style cards, questions, sub-lessons, math text, and math visuals from the builder.</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {courseLessons.map((lesson, index) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveLessonIndex(index)}
                className={`min-w-[210px] rounded-3xl border p-4 text-left transition ${index === activeLessonIndex ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'bg-card hover:border-primary/60'} ${isFreemium && index >= introductoryLessonCount ? 'border-dashed opacity-70' : ''}`}
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">Lesson {index + 1}</p>
                <p className="mt-1 font-bold">{lesson.title}</p>
                {isFreemium && index >= introductoryLessonCount ? <p className="mt-1 text-xs text-muted-foreground">Locked</p> : <p className="mt-1 text-xs text-muted-foreground">Tap to study</p>}
              </button>
            ))}
          </div>

          {locked ? (
            <LockedLesson />
          ) : activeLesson ? (
            <LessonPlayer
              lesson={activeLesson as any}
              courseTitle={course.title}
              backHref="/student/courses"
              completeLabel="Mark lesson complete"
            />
          ) : (
            <div className="rounded-3xl border p-10 text-center text-muted-foreground">No lessons have been published yet.</div>
          )}
        </section>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24 rounded-3xl border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Rocket className="size-5" /> Course Actions</CardTitle>
            <CardDescription>Finish the cards, then attempt the final assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button size="lg" className="w-full" asChild><Link href={`/student/courses/${course.id}/exam`}>Start Final Exam</Link></Button>
            {meeting?.meetingUrl ? <Button variant="outline" className="w-full" asChild><Link href={meeting.meetingUrl} target="_blank">Join Live Lesson</Link></Button> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LockedLesson() {
  return (
    <div className="rounded-3xl border border-dashed p-10 text-center">
      <Lock className="mx-auto mb-4 size-12 text-muted-foreground" />
      <h3 className="text-xl font-semibold">Content Locked</h3>
      <p className="mb-4 text-muted-foreground">Upgrade to access this lesson and the full course.</p>
      <Button asChild><Link href="/student/payments">Upgrade Now</Link></Button>
    </div>
  );
}
