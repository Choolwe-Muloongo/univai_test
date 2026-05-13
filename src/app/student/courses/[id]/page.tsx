// src/app/(app)/courses/[id]/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Course, type Lesson } from '@/lib/api/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle, Code, FileText, Rocket, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourseById, getLessonsByCourse, getCourseMeeting } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';
import type { CourseMeeting } from '@/lib/api/types';

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
       <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
             <Skeleton className="h-6 w-3/4" />
             <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { session } = useSession();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<CourseMeeting | null>(null);

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

  if (loading) {
    return <CourseSkeleton />;
  }

  if (!course) {
    notFound();
  }

  const isFreemium = userRole === 'freemium-student';
  const introductoryLessonCount = 2;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card className="overflow-hidden">
          <CardContent>
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              <Image src={placeholder?.imageUrl || `https://picsum.photos/seed/${course.id}/1200/400`} alt={course.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
                <p className="text-lg text-white/90">Module Overview</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Module Content</h2>
          <div className="space-y-6">
            {courseLessons.map((lesson, index) => (
              <Card key={lesson.id} className={`overflow-hidden ${isFreemium && index >= introductoryLessonCount ? 'bg-muted/50 border-dashed' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className='text-primary font-bold mr-2'>0{index + 1}</span>
                      {lesson.title}
                    </span>
                    {isFreemium && index >= introductoryLessonCount && (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isFreemium && index >= introductoryLessonCount ? (
                     <div className="text-center p-8">
                        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Content Locked</h3>
                        <p className="text-muted-foreground mb-4">Upgrade to Premium to access this lesson and the full course.</p>
                        <Button asChild>
                            <Link href="/student/payments">Upgrade Now</Link>
                        </Button>
                    </div>
                  ) : (
                    <Tabs defaultValue="video" className="w-full">
                      <TabsList>
                        <TabsTrigger value="video"><PlayCircle className='mr-2' /> Video Lecture</TabsTrigger>
                        <TabsTrigger value="exercise"><Code className='mr-2' /> Coding Exercise</TabsTrigger>
                        <TabsTrigger value="quiz"><FileText className='mr-2' /> Quiz</TabsTrigger>
                      </TabsList>
                      <TabsContent value="video" className="pt-4">
                        {lesson.videoUrl ? (
                            <div className="aspect-video bg-black rounded-md overflow-hidden">
                                <video src={lesson.videoUrl} controls className="w-full h-full" />
                            </div>
                        ) : (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                <p className="text-muted-foreground">No video lecture available yet.</p>
                            </div>
                        )}
                      </TabsContent>
                      <TabsContent value="exercise" className='pt-4'>
                        {lesson.exercise ? (
                             <Card className='bg-muted/40 font-mono text-sm'>
                                <CardContent className='pt-6'>
                                    <div className='bg-black p-4 rounded-md text-green-400'>
                                    <pre><code>{lesson.exercise}</code></pre>
                                    </div>
                                    <Button className='mt-4'>Run Code</Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                <p className="text-muted-foreground">No exercise available yet.</p>
                            </div>
                        )}
                      </TabsContent>
                      <TabsContent value="quiz" className='pt-4 space-y-3'>
                         {lesson.quiz ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{lesson.quiz.title ?? 'Lesson Quiz'}</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    {(lesson.quiz.questions ?? []).length > 0 ? (
                                      (lesson.quiz.questions ?? []).map((q: any, index: number) => (
                                          <div key={index}>
                                              <p className='font-semibold'>{index + 1}. {q.question}</p>
                                              <ul className='list-disc pl-5 mt-2 space-y-1 text-muted-foreground'>
                                                  {(q.options ?? []).map((opt: string) => (
                                                      <li key={opt} className={opt === q.answer ? 'text-primary font-medium' : ''}>{opt}</li>
                                                  ))}
                                              </ul>
                                          </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Quiz questions will appear here once published.</p>
                                    )}
                                </CardContent>
                            </Card>
                         ) : (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                <p className="text-muted-foreground">No quiz available yet.</p>
                            </div>
                         )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><Rocket /> Get Started</CardTitle>
            <CardDescription>
              Ready to test your knowledge? Jump straight to the exam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full" asChild>
              <Link href={`/student/courses/${course.id}/exam`}>Start Final Exam</Link>
            </Button>
          </CardContent>
        </Card>
        {meeting?.meetingUrl && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Live Lesson</CardTitle>
              <CardDescription>
                Join the live session with your lecturer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-1">
                {meeting.meetingProvider && <p>Provider: {meeting.meetingProvider}</p>}
                {meeting.meetingSchedule && (
                  <p>
                    Schedule: {(meeting.meetingSchedule as { day?: string; time?: string }).day ?? ''}{' '}
                    {(meeting.meetingSchedule as { day?: string; time?: string }).time ?? ''}
                  </p>
                )}
                {meeting.meetingNotes && <p>{meeting.meetingNotes}</p>}
              </div>
              <Button className="w-full" asChild>
                <Link href={meeting.meetingUrl} target="_blank">Join Live Lesson</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

