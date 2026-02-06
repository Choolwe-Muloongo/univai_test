import { notFound } from 'next/navigation';
import { LessonFocusClient } from './lesson-focus-client';
import { getLessonById } from '@/lib/api';

export default async function LessonFocusPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return <LessonFocusClient lessonId={lessonId} lessonTitle={lesson.title} />;
}
