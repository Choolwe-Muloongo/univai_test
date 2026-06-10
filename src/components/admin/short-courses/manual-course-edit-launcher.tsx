'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, RotateCcw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getCourseById, getCourses, getLessonsByCourse } from '@/lib/api';
import type { Course } from '@/lib/api/types';

const AUTOSAVE_KEY = 'univai.manual-builder.autosave.v2';

type ManualCard = {
  id: string;
  type: string;
  title: string;
  body: string;
  mathTool: string;
  saved: boolean;
  [key: string]: unknown;
};

type ManualLesson = {
  id: string;
  title: string;
  summary: string;
  outcomes: string[];
  subLessons: unknown[];
  cards: ManualCard[];
  saved: boolean;
};

type ManualModule = {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  lessons: ManualLesson[];
  saved: boolean;
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const lines = (value?: string) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);

function firstString(...values: unknown[]) {
  const match = values.find((value) => typeof value === 'string' && value.trim());
  return typeof match === 'string' ? match : '';
}

function lessonBlocks(lesson: Record<string, unknown>): Record<string, unknown>[] {
  const candidates = [lesson.blocks, lesson.cards, lesson.contentBlocks, lesson.content_blocks, lesson.lessonBlocks, lesson.lesson_blocks];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  }
  return [];
}

function cardFromBlock(block: Record<string, unknown>, index: number): ManualCard {
  const type = firstString(block.type, block.cardType, block.kind) || 'teach';
  const body = firstString(block.body, block.content, block.text, block.explanation, block.description);

  return {
    id: firstString(block.id) || uid('card'),
    type,
    title: firstString(block.title, block.heading, block.label) || `Card ${index}`,
    body,
    question: firstString(block.question, block.prompt),
    text: firstString(block.text),
    statement: firstString(block.statement),
    prompt: firstString(block.prompt),
    front: firstString(block.front),
    back: firstString(block.back),
    items: Array.isArray(block.items) ? block.items.join('\n') : firstString(block.items),
    criteria: Array.isArray(block.criteria) ? block.criteria.join('\n') : firstString(block.criteria),
    options: Array.isArray(block.options) ? block.options.join('\n') : firstString(block.options),
    answer: firstString(block.answer, block.correctAnswer, block.correct_answer),
    explanation: firstString(block.explanation),
    equation: firstString(block.equation),
    expression: firstString(block.expression),
    imageUrl: firstString(block.imageUrl, block.image_url, block.image),
    imageAlt: firstString(block.imageAlt, block.image_alt),
    imageCaption: firstString(block.imageCaption, block.image_caption),
    mathTool: firstString(block.mathTool, block.math_tool) || 'none',
    saved: true,
  };
}

function cardsFromLesson(lesson: Record<string, unknown>): ManualCard[] {
  const blocks = lessonBlocks(lesson);
  if (blocks.length) return blocks.map((block, index) => cardFromBlock(block, index + 1));

  return [{
    id: uid('card'),
    type: 'teach',
    title: firstString(lesson.title, lesson.name) || 'Lesson overview',
    body: firstString(lesson.summary, lesson.description, lesson.content) || 'Edit this card with the existing lesson content.',
    mathTool: 'none',
    saved: true,
  }];
}

function lessonFromApi(lesson: unknown, index: number): ManualLesson {
  const row = lesson && typeof lesson === 'object' ? lesson as Record<string, unknown> : {};
  return {
    id: firstString(row.id) || uid('lesson'),
    title: firstString(row.title, row.name) || `Lesson ${index}`,
    summary: firstString(row.summary, row.description, row.overview),
    outcomes: Array.isArray(row.outcomes) ? row.outcomes.map(String) : lines(firstString(row.outcomes, row.learningOutcomes, row.learning_outcomes)),
    subLessons: [],
    cards: cardsFromLesson(row),
    saved: true,
  };
}

function modulesFromLessons(lessons: unknown[]): ManualModule[] {
  const importedLessons = lessons.map((lesson, index) => lessonFromApi(lesson, index + 1));
  return [{
    id: uid('module'),
    title: 'Imported course content',
    description: 'Loaded from the existing course so it can be edited in the manual builder.',
    outcomes: [],
    lessons: importedLessons.length ? importedLessons : [lessonFromApi({}, 1)],
    saved: true,
  }];
}

function courseForm(course: Record<string, unknown>) {
  return {
    title: firstString(course.title, course.name),
    description: firstString(course.description, course.summary),
    schoolId: firstString(course.schoolId, course.school_id),
    level: firstString(course.level, course.difficulty) || 'beginner',
    durationHours: String(course.durationHours ?? course.duration_hours ?? 8),
    entryFee: String(course.price ?? course.entryFee ?? course.entry_fee ?? 0),
    currency: firstString(course.currency) || 'ZMW',
    certificateFee: String(course.certificateFee ?? course.certificate_fee ?? 0),
  };
}

export function ManualCourseEditLauncher() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCourses()
      .then((items) => {
        if (!mounted) return;
        setCourses(items);
        setSelectedId(items[0]?.id || '');
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load existing courses.'))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const filteredCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) => `${course.title} ${course.id} ${course.description || ''}`.toLowerCase().includes(needle));
  }, [courses, query]);

  async function prepareCourseForEditing() {
    if (!selectedId) {
      setError('Choose a course to edit.');
      return;
    }

    setPreparing(true);
    setError(null);
    setMessage(null);

    try {
      const [course, lessons] = await Promise.all([
        getCourseById(selectedId),
        getLessonsByCourse(selectedId).catch(() => []),
      ]);
      const courseRecord = course as unknown as Record<string, unknown>;
      const snapshot = {
        form: courseForm(courseRecord),
        modules: modulesFromLessons(lessons as unknown[]),
        quizBank: [],
        editingCourseId: selectedId,
      };
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
      setMessage('Course loaded. The manual builder will reload and show “Saved builder work found”; press Resume draft to edit it.');
      window.setTimeout(() => window.location.reload(), 350);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load this course into the builder.');
    } finally {
      setPreparing(false);
    }
  }

  function clearPendingEdit() {
    window.localStorage.removeItem(AUTOSAVE_KEY);
    setMessage('Pending builder draft cleared. Reloading the builder.');
    window.setTimeout(() => window.location.reload(), 250);
  }

  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Edit3 className="size-5" />Edit existing course</CardTitle>
        <CardDescription>Select a saved course, load it into the manual builder, then resume the draft and save changes back to that course.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {message ? <div className="rounded-xl border bg-background p-3 text-sm">{message}</div> : null}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search existing courses..." />
          </div>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loading || !filteredCourses.length}>
            {loading ? <option>Loading courses...</option> : null}
            {!loading && filteredCourses.length === 0 ? <option>No courses found</option> : null}
            {filteredCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <Button type="button" onClick={prepareCourseForEditing} disabled={loading || preparing || !selectedId}>
            {preparing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Edit3 className="mr-2 size-4" />}
            {preparing ? 'Loading...' : 'Load for editing'}
          </Button>
          <Button type="button" variant="outline" onClick={clearPendingEdit}>
            <RotateCcw className="mr-2 size-4" />Clear draft
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">This uses the builder’s existing recovery system, so it avoids duplicating the course and preserves the normal save/update path.</p>
      </CardContent>
    </Card>
  );
}
