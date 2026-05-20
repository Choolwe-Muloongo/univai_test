'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MouseEvent, useEffect, useRef, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getCourseById, getLessonById, getLessonsByCourse } from '@/lib/api';
import { completeShortCourseLesson, getShortCourseProgress } from '@/lib/api/short-courses';
import { recordLearningEvent, type LearningEventType } from '@/lib/api/student-gamification';
import type { Course, Lesson, LessonWithCourseId } from '@/lib/api/types';

export default function FocusedLessonPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<LessonWithCourseId | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const completedCardsRef = useRef<Set<number>>(new Set());
  const checkedCardsRef = useRef<Set<number>>(new Set());
  const missedCountRef = useRef(0);
  const correctCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getCourseById(params.id),
      getLessonById(params.lessonId),
      getLessonsByCourse(params.id).catch(() => []),
      getShortCourseProgress(params.id).catch(() => null),
    ])
      .then(([courseData, lessonData, lessonList, progress]) => {
        if (!mounted) return;
        if (!progress?.entryFeePaid || isExpired(progress.accessExpiresAt)) {
          setError('Active course access is required before starting lessons.');
          return;
        }
        if (lessonData?.courseId && String(lessonData.courseId) !== String(params.id)) {
          setError('This lesson does not belong to the selected Journey.');
          return;
        }
        setCourse(courseData);
        setLesson(lessonData);
        setLessons(lessonList);
        setCompleted(Boolean(progress?.completedLessons?.map(String).includes(String(params.lessonId))));
      })
      .catch((cause) => {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load mission.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.id, params.lessonId]);

  if (loading) return <main className="min-h-screen bg-background px-4 py-6"><PageLoading message="Opening mission..." /></main>;
  if (error) return <main className="min-h-screen bg-background px-4 py-6"><PageError message={error} actionHref={`/student/courses/${params.id}`} actionLabel="Back to Mission Control" /></main>;
  if (!course || !lesson) return <main className="min-h-screen bg-background px-4 py-6"><PageError title="Mission unavailable" message="This mission could not be opened." actionHref={`/student/courses/${params.id}`} actionLabel="Back to Mission Control" /></main>;

  const currentIndex = lessons.findIndex((item) => String(item.id) === String(params.lessonId));
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : null;

  function visibleCardIndex() {
    const text = playerShellRef.current?.textContent ?? '';
    const match = text.match(/Card\s+(\d+)\s+of\s+(\d+)/i);
    return match ? Number(match[1]) - 1 : null;
  }

  function logCard(source: string) {
    const cardIndex = visibleCardIndex();
    if (cardIndex === null || completedCardsRef.current.has(cardIndex)) return;
    completedCardsRef.current.add(cardIndex);
    recordLearningEvent({
      type: 'card_completed',
      courseId: params.id,
      lessonId: params.lessonId,
      metadata: { source, cardIndex: cardIndex + 1, lessonTitle: lesson?.title },
    }).catch((error) => console.warn('Gamification event failed', error));
  }

  function logCheck() {
    const cardIndex = visibleCardIndex();
    if (cardIndex === null || checkedCardsRef.current.has(cardIndex)) return;
    const text = playerShellRef.current?.textContent ?? '';
    const passed = /\bCorrect\b/.test(text);
    const missed = /\bNot quite\b/.test(text);
    if (!passed && !missed) return;

    checkedCardsRef.current.add(cardIndex);
    if (passed) correctCountRef.current += 1;
    if (missed) missedCountRef.current += 1;

    const eventType = (passed ? 'checkpoint_correct' : ['checkpoint', 'wrong'].join('_')) as LearningEventType;
    recordLearningEvent({
      type: eventType,
      courseId: params.id,
      lessonId: params.lessonId,
      metadata: { source: 'lesson_player', cardIndex: cardIndex + 1, lessonTitle: lesson?.title },
    }).catch((error) => console.warn('Gamification event failed', error));
  }

  function handlePlayerClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button');
    const label = button?.textContent?.trim() ?? '';
    if (!button) return;

    if (/^Continue/i.test(label)) logCard('continue_button');
    if (/Check answer/i.test(label)) window.setTimeout(logCheck, 120);
    if (/Claim Mission Reward|Complete lesson|Lesson completed/i.test(label)) logCard('mission_complete_button');
  }

  async function markComplete() {
    setCompleteError(null);
    const wasCompleted = completed;
    try {
      logCard('mission_complete');
      await completeShortCourseLesson(params.id, params.lessonId);
      setCompleted(true);
      if (!wasCompleted) {
        await recordLearningEvent({
          type: 'mission_completed',
          courseId: params.id,
          lessonId: params.lessonId,
          metadata: {
            source: 'lesson_player',
            lessonTitle: lesson?.title,
            cardsCompleted: completedCardsRef.current.size,
            correctChecks: correctCountRef.current,
            missedChecks: missedCountRef.current,
            perfectRun: missedCountRef.current === 0 && correctCountRef.current > 0,
          },
        }).catch((error) => console.warn('Gamification event failed', error));
      }
    } catch (cause) {
      setCompleteError(studentFriendlyError(cause));
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl" ref={playerShellRef} onClickCapture={handlePlayerClick}>
        <LessonPlayer
          lesson={lesson as any}
          courseTitle={course.title}
          backHref={`/student/courses/${params.id}`}
          onComplete={markComplete}
          completed={completed}
          completeLabel="Claim Mission Reward"
        />
        {completeError ? <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{completeError}</div> : null}
        {completed ? (
          <Card className="mx-auto mt-4 max-w-3xl rounded-2xl">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">Mission completed · reward claimed</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline"><Link href={`/student/courses/${params.id}/practice`}>Enter Training Arena</Link></Button>
                {nextLesson ? <Button asChild><Link href={`/student/courses/${params.id}/lessons/${nextLesson.id}`}>Next Mission</Link></Button> : <Button asChild><Link href={`/student/courses/${params.id}`}>Back to Mission Control</Link></Button>}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}

function studentFriendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unable to claim this mission reward.';
  if (message.includes('402')) return 'Active Journey access is required. Please enroll or renew access.';
  return message || 'Unable to claim this mission reward.';
}

function isExpired(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}
