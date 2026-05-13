'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLessonById, getLessonDocuments } from '@/lib/api';
import type { LessonWithCourseId } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';
import { LessonCompanionClient } from '../lesson-companion-client';

export default function LessonCompanionPage() {
  const params = useParams();
  const lessonId = readRouteParam(params, 'lessonId');
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
  const [supplementalText, setSupplementalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLesson() {
      if (!lessonId) {
        setLoading(false);
        setError('Lesson route is missing an id.');
        return;
      }

      try {
        const nextLesson = await getLessonById(lessonId);
        if (!isMounted) return;
        setLesson(nextLesson);
        setError(null);

        try {
          const docs = await getLessonDocuments(lessonId);
          if (!isMounted) return;
          setSupplementalText(
            docs
              .map((doc) => doc.extractedText)
              .filter(Boolean)
              .join('\n')
          );
        } catch (docError) {
          console.warn('Lesson supplemental documents unavailable for student companion', docError);
          if (isMounted) {
            setSupplementalText('');
          }
        }
      } catch (err) {
        console.error('Failed to load lesson companion', err);
        if (isMounted) {
          setLesson(null);
          setSupplementalText('');
          setError('Lesson companion data is unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLesson();

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  if (loading) {
    return <PageLoading message="Loading lesson companion..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/ai/lesson-companion" actionLabel="Back to Lessons" />;
  }

  if (!lesson) {
    return (
      <PageError
        title="Lesson not found"
        message="This lesson companion is unavailable or has not been published yet."
        actionHref="/student/ai/lesson-companion"
        actionLabel="Back to Lessons"
      />
    );
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
