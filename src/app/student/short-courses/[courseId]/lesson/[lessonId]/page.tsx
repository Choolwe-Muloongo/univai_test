'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { completeShortCourseLesson, getCourseById, getLessonById } from '@/lib/api';
import { getShortCourseProgress } from '@/lib/api/short-courses';
import type { Course, LessonWithCourseId } from '@/lib/api/types';

export default function ShortCourseLessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [nextLesson, nextCourse, nextProgress] = await Promise.all([
          getLessonById(lessonId),
          getCourseById(courseId).catch(() => null),
          getShortCourseProgress(courseId),
        ]);
        if (!mounted) return;
        if (!nextProgress.entryFeePaid || isExpired(nextProgress.accessExpiresAt)) {
          setError('Active course access is required before starting lessons.');
          return;
        }
        if (nextLesson?.courseId && String(nextLesson.courseId) !== String(courseId)) {
          setError('This lesson does not belong to the selected short course.');
          return;
        }
        setLesson(nextLesson);
        setCourse(nextCourse);
        setError(null);
      } catch (cause) {
        console.error('Failed to load short-course lesson', cause);
        if (mounted) setError('This lesson is unavailable. Please refresh and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [courseId, lessonId]);

  async function markDone() {
    await completeShortCourseLesson(courseId, lessonId);
    setComplete(true);
  }

  if (loading) return <PageLoading message="Loading interactive lesson..." />;
  if (error) return <PageError message={error} actionHref={`/student/short-courses/${courseId}`} actionLabel="Back to course" />;
  if (!lesson) {
    return (
      <PageError
        title="Lesson not found"
        message="This lesson has not been published yet."
        actionHref={`/student/short-courses/${courseId}`}
        actionLabel="Back to course"
      />
    );
  }

  return (
    <LessonPlayer
      lesson={lesson}
      courseTitle={course?.title ?? 'Short course'}
      backHref={`/student/short-courses/${courseId}`}
      onComplete={markDone}
      completed={complete}
      completeLabel="Complete lesson"
    />
  );
}

function isExpired(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}
