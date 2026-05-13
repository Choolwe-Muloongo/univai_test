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

export default function AiLessonCompanionPage() {
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
        console.error('Failed to load lesson companion options', err);
        if (isMounted) {
          setFlattenedLessons([]);
          setError('Lesson companion options are unavailable. Please refresh and try again.');
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
        <h1 className="text-3xl font-bold tracking-tight">Lesson Companion</h1>
        <p className="text-muted-foreground">
          AI explanations, summaries, and practice prompts by lesson.
        </p>
      </div>

      {loading ? <PageLoading message="Loading AI lesson companion..." /> : null}
      {error ? <PageError message={error} actionHref="/student/ai" actionLabel="Back to AI Tutor" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Recommended Lessons</CardTitle>
          <CardDescription>Pick a lesson to open AI companion tools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !error && flattenedLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Lessons will appear once they are published.</p>
          ) : (
            flattenedLessons.slice(0, 6).map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Lesson ID: {lesson.id} - Course: {lesson.courseId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">AI Ready</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/student/ai/lesson-companion/${lesson.id}`}>Open</Link>
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
