'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { completeShortCourseLesson, getLessonById } from '@/lib/api';
import type { LessonWithCourseId } from '@/lib/api/types';

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export default function ShortCourseLessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
  const [complete, setComplete] = useState(false);
  useEffect(() => { getLessonById(lessonId).then(setLesson); }, [lessonId]);
  const markDone = async () => { await completeShortCourseLesson(courseId, lessonId); setComplete(true); };
  if (!lesson) return <p>Loading lesson...</p>;
  return <div className="space-y-6"><Card><CardHeader><CardTitle>{lesson.title}</CardTitle></CardHeader><CardContent className="prose max-w-none dark:prose-invert"><div className="whitespace-pre-wrap">{stripHtml(lesson.content)}</div>{lesson.videoUrl ? <iframe className="mt-6 aspect-video w-full rounded-xl" src={lesson.videoUrl} title={lesson.title} /> : null}</CardContent></Card><div className="flex items-center justify-between"><Button variant="outline" asChild><Link href={`/student/short-courses/${courseId}`}>Back to course</Link></Button><Button onClick={markDone} className="bg-[#00694E] hover:bg-[#00563f]">{complete ? 'Lesson completed' : 'Mark complete'}</Button></div></div>;
}
