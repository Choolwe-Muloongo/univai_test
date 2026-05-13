'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LessonFocusClient } from './lesson-focus-client';
import { getLessonById } from '@/lib/api';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function LessonFocusPage() {
  const params = useParams();
  const lessonId = readRouteParam(params, 'lessonId');
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);
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
        const lesson = await getLessonById(lessonId);
        if (!isMounted) return;
        setLessonTitle(lesson?.title ?? null);
        setError(null);
      } catch (err) {
        console.error('Failed to load lesson focus mode', err);
        if (isMounted) {
          setLessonTitle(null);
          setError('Lesson focus mode is unavailable. Please refresh and try again.');
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
    return <PageLoading message="Loading focus mode..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/lessons" actionLabel="Back to Lessons" />;
  }

  if (!lessonTitle) {
    return (
      <PageError
        title="Lesson not found"
        message="This lesson is unavailable or has not been published yet."
        actionHref="/student/lessons"
        actionLabel="Back to Lessons"
      />
    );
  }

  return <LessonFocusClient lessonId={lessonId} lessonTitle={lessonTitle} />;
}
