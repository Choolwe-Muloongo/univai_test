'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getLessonById } from '@/lib/api';
import type { LessonWithCourseId } from '@/lib/api/types';
import { readRouteParam } from '@/lib/route-params';

export default function LessonFocusPage() {
  const params = useParams();
  const lessonId = readRouteParam(params, 'lessonId');
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
  const [completed, setCompleted] = useState(false);
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
      } catch (err) {
        console.error('Failed to load lesson focus mode', err);
        if (isMounted) {
          setLesson(null);
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
    return <PageLoading message="Loading interactive lesson..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/lessons" actionLabel="Back to Lessons" />;
  }

  if (!lesson) {
    return (
      <PageError
        title="Lesson not found"
        message="This lesson is unavailable or has not been published yet."
        actionHref="/student/lessons"
        actionLabel="Back to Lessons"
      />
    );
  }

  return (
    <LessonPlayer
      lesson={lesson}
      courseTitle={lesson.courseId ? lesson.courseId.toUpperCase() : 'Programme lesson'}
      backHref={`/student/lessons/${lessonId}`}
      completed={completed}
      completeLabel="Finish lesson"
      onComplete={() => setCompleted(true)}
    />
  );
}
