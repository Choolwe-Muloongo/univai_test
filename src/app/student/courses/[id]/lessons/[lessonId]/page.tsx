'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getCourseById, getLessonById } from '@/lib/api';
import type { Course, LessonWithCourseId } from '@/lib/api/types';

export default function FocusedLessonPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getCourseById(params.id), getLessonById(params.lessonId)])
      .then(([courseData, lessonData]) => {
        if (!mounted) return;
        setCourse(courseData);
        setLesson(lessonData);
      })
      .catch((cause) => {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load lesson.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.id, params.lessonId]);

  if (loading) return <main className="min-h-screen bg-background px-4 py-6"><PageLoading message="Opening lesson..." /></main>;
  if (error) return <main className="min-h-screen bg-background px-4 py-6"><PageError message={error} actionHref={`/student/courses/${params.id}`} actionLabel="Back to course" /></main>;
  if (!course || !lesson) return <main className="min-h-screen bg-background px-4 py-6"><PageError title="Lesson unavailable" message="This lesson could not be opened." actionHref={`/student/courses/${params.id}`} actionLabel="Back to course" /></main>;

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href={`/student/courses/${params.id}`}>
              <ArrowLeft className="size-4" />
              Course overview
            </Link>
          </Button>
        </div>
        <LessonPlayer
          lesson={lesson as any}
          courseTitle={course.title}
          backHref={`/student/courses/${params.id}`}
          completeLabel="Mark lesson complete"
        />
      </div>
    </main>
  );
}
