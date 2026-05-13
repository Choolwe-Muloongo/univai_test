'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFlattenedLessons } from '@/lib/api';
import type { LessonWithCourseId } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function LessonsPage() {
  const [flattenedLessons, setFlattenedLessons] = useState<LessonWithCourseId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLessons() {
      try {
        const nextLessons = await getFlattenedLessons();
        if (!isMounted) return;
        setFlattenedLessons(nextLessons);
        setError(null);
      } catch (err) {
        console.error('Failed to load lessons', err);
        if (isMounted) {
          setFlattenedLessons([]);
          setError('Lessons are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
        <p className="text-muted-foreground">Browse your available lessons.</p>
      </div>

      {loading ? <PageLoading message="Loading lessons..." /> : null}
      {error ? <PageError message={error} actionHref="/student/program" actionLabel="Back to Program" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Lesson Library</CardTitle>
          <CardDescription>Resume lessons or start a new topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !error && flattenedLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lessons will appear once they are published.</p>
          ) : (
            flattenedLessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="text-sm text-muted-foreground">Course: {lesson.courseId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Lesson</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/student/lessons/${lesson.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
