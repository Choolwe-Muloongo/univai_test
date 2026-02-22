import { notFound } from 'next/navigation';
import { getLessonById, getLessonDocuments } from '@/lib/api';
import { LessonCompanionClient } from '../lesson-companion-client';

export default async function LessonCompanionPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    notFound();
  }
  let supplementalText = '';
  try {
    const docs = await getLessonDocuments(lessonId);
    supplementalText = docs
      .map((doc) => doc.extractedText)
      .filter(Boolean)
      .join('\n');
  } catch (error) {
    supplementalText = '';
    void error;
  }
  return (
    <LessonCompanionClient
      lessonId={lessonId}
      lessonTitle={lesson.title}
      lessonContent={lesson.content}
      courseId={lesson.courseId}
      supplementalText={supplementalText}
    />
  );
}
