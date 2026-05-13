'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { getLessonById } from '@/lib/api';
import type { LessonWithCourseId } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function LessonStartPage() {
  const params = useParams();
  const lessonId = readRouteParam(params, 'lessonId');
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
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
        console.error('Failed to load lesson', err);
        if (isMounted) {
          setLesson(null);
          setError('Lesson data is unavailable. Please refresh and try again.');
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

  const lessonStats = useMemo(() => {
    const wordCount = lesson?.content ? lesson.content.trim().split(/\s+/).filter(Boolean).length : 0;
    const minutes = Math.max(5, Math.ceil(wordCount / 180));
    const difficulty =
      wordCount > 900 ? 'Advanced' : wordCount > 450 ? 'Intermediate' : 'Foundational';
    const summary = lesson?.content
      ? `${lesson.content.slice(0, 220)}${lesson.content.length > 220 ? '...' : ''}`
      : null;

    return { difficulty, minutes, summary };
  }, [lesson]);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageLoading message="Loading lesson overview..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageError message={error} actionHref="/student/lessons" actionLabel="Back to Lessons" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-8">
        <PageError
          title="Lesson not found"
          message="This lesson is unavailable or has not been published yet."
          actionHref="/student/lessons"
          actionLabel="Back to Lessons"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="text-muted-foreground">
          Lesson overview, outcomes, and readiness check.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimated Time</CardTitle>
            <CardDescription>Typical completion</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Clock className="h-5 w-5 text-primary" />
            {lessonStats.minutes} min
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty</CardTitle>
            <CardDescription>Recommended level</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{lessonStats.difficulty}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course</CardTitle>
            <CardDescription>Program context</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-primary" />
            {lesson.courseId.toUpperCase()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What you'll learn</CardTitle>
          <CardDescription>Key outcomes for this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lessonStats.summary ? (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <BookOpen className="mt-1 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">{lessonStats.summary}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Lesson outcomes will appear once the lecturer publishes the content.
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href={`/student/lessons/${lessonId}/focus`}>Start Lesson</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/student/ai/lesson-companion/${lessonId}`}>AI Companion</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Need a quick refresher?</CardTitle>
          <CardDescription>AI can summarize this lesson before you begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={`/student/ai/lesson-companion/${lessonId}`}>Generate Summary</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
