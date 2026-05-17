'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, FunctionSquare, HelpCircle, Lightbulb, ListChecks, Lock, Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type Course, type Lesson } from '@/lib/api/types';
import { getCourseById, getCourseMeeting, getLessonsByCourse } from '@/lib/api';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useSession } from '@/components/providers/session-provider';
import type { CourseMeeting } from '@/lib/api/types';

type LessonBlock = {
  type?: string;
  title?: string;
  body?: string;
  question?: string;
  statement?: string;
  text?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string | boolean;
  explanation?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  visual?: Record<string, any>;
};

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <Card><CardContent><Skeleton className="aspect-video w-full" /></CardContent></Card>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
      <div className="lg:col-span-1"><Skeleton className="h-64 w-full rounded-3xl" /></div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { session } = useSession();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [meeting, setMeeting] = useState<CourseMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      setUserRole(session?.user?.role ?? null);
      if (!id) return;
      setLoading(true);
      const [foundCourse, foundLessons, meetingInfo] = await Promise.all([
        getCourseById(id),
        getLessonsByCourse(id),
        getCourseMeeting(id),
      ]);
      setCourse(foundCourse);
      setCourseLessons(foundLessons);
      setMeeting(meetingInfo);
      setLoading(false);
    };
    loadCourse();
  }, [id, session]);

  const placeholder = PlaceHolderImages.find((p) => p.id === course?.imageId);
  const activeLesson = courseLessons[activeLessonIndex] ?? null;
  const blocks = useMemo(() => extractBlocks(activeLesson), [activeLesson]);
  const activeBlock = blocks[activeCardIndex] ?? blocks[0] ?? null;
  const isFreemium = userRole === 'freemium-student';
  const introductoryLessonCount = 2;
  const progress = blocks.length ? Math.round(((activeCardIndex + 1) / blocks.length) * 100) : 0;

  if (loading) return <CourseSkeleton />;
  if (!course) notFound();

  function chooseLesson(index: number) {
    setActiveLessonIndex(index);
    setActiveCardIndex(0);
  }

  function nextCard() {
    setActiveCardIndex((value) => Math.min(blocks.length - 1, value + 1));
  }

  function previousCard() {
    setActiveCardIndex((value) => Math.max(0, value - 1));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <Card className="overflow-hidden rounded-3xl border-primary/20 shadow-sm">
          <CardContent className="p-0">
            <div className="relative flex aspect-[16/7] items-center justify-center bg-muted">
              <Image src={placeholder?.imageUrl || `https://picsum.photos/seed/${course.id}/1200/500`} alt={course.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/5" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-semibold uppercase text-white/75">Short course</p>
                <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
                <p className="mt-1 text-white/90">Interactive card lessons built from the manual course builder.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Lesson Content</h2>
            <p className="text-muted-foreground">No fake video tabs. No coding placeholder. Just the learning cards you built.</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {courseLessons.map((lesson, index) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => chooseLesson(index)}
                className={`min-w-[210px] rounded-3xl border p-4 text-left transition ${index === activeLessonIndex ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'bg-card hover:border-primary/60'} ${isFreemium && index >= introductoryLessonCount ? 'border-dashed opacity-70' : ''}`}
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">Lesson {index + 1}</p>
                <p className="mt-1 font-bold">{lesson.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{extractBlocks(lesson).length} cards</p>
              </button>
            ))}
          </div>

          <Card className="overflow-hidden rounded-3xl border-primary/20 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{activeLesson?.title ?? 'Lesson'}</CardTitle>
                  <CardDescription>{blocks.length ? `Card ${activeCardIndex + 1} of ${blocks.length}` : 'No cards published yet'}</CardDescription>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{progress}%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </CardHeader>
            <CardContent>
              {isFreemium && activeLessonIndex >= introductoryLessonCount ? (
                <LockedLesson />
              ) : activeBlock ? (
                <LearningCard block={activeBlock} />
              ) : (
                <div className="rounded-3xl border p-10 text-center text-muted-foreground">This lesson has no published cards yet.</div>
              )}

              {blocks.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" disabled={activeCardIndex === 0} onClick={previousCard}><ChevronLeft className="mr-2 size-4" /> Previous</Button>
                  <Button disabled={activeCardIndex >= blocks.length - 1} onClick={nextCard}>Continue <ChevronRight className="ml-2 size-4" /></Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24 rounded-3xl border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Rocket className="size-5" /> Course Actions</CardTitle>
            <CardDescription>Finish the cards, then attempt the final assessment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button size="lg" className="w-full" asChild><Link href={`/student/courses/${course.id}/exam`}>Start Final Exam</Link></Button>
            {meeting?.meetingUrl ? <Button variant="outline" className="w-full" asChild><Link href={meeting.meetingUrl} target="_blank">Join Live Lesson</Link></Button> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LockedLesson() {
  return (
    <div className="rounded-3xl border border-dashed p-10 text-center">
      <Lock className="mx-auto mb-4 size-12 text-muted-foreground" />
      <h3 className="text-xl font-semibold">Content Locked</h3>
      <p className="mb-4 text-muted-foreground">Upgrade to access this lesson and the full course.</p>
      <Button asChild><Link href="/student/payments">Upgrade Now</Link></Button>
    </div>
  );
}

function extractBlocks(lesson?: Lesson | null): LessonBlock[] {
  if (!lesson) return [];

  const fromObjects = lesson.learningObjects?.flatMap((object) => {
    const payloadBlocks = object.payload?.blocks;
    if (Array.isArray(payloadBlocks)) return payloadBlocks as LessonBlock[];

    if (typeof object.body === 'string') {
      const parsed = parseBlocks(object.body);
      if (parsed.length) return parsed;
    }
    return [];
  }) ?? [];

  if (fromObjects.length) return fromObjects;
  const fromContent = parseBlocks(lesson.content);
  if (fromContent.length) return fromContent;
  if (lesson.content) return [{ type: 'explanation', title: lesson.title, body: lesson.content }];
  return [];
}

function parseBlocks(value?: string | null): LessonBlock[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as { blocks?: LessonBlock[] };
    return Array.isArray(parsed.blocks) ? parsed.blocks : [];
  } catch {
    return [];
  }
}

function LearningCard({ block }: { block: LessonBlock }) {
  const type = block.type ?? 'explanation';
  const Icon = type === 'question' ? HelpCircle : type === 'example' ? Lightbulb : type === 'summary' ? CheckCircle2 : type === 'fill_blank' || type === 'true_false' ? ListChecks : BookOpen;

  return (
    <article className="rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary"><Icon className="size-4" /> {type.replace('_', ' ')}</span>
      </div>
      <h3 className="text-2xl font-bold">{block.title ?? (type === 'question' ? 'Quick check' : 'Learning card')}</h3>
      {block.body ? <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-muted-foreground">{block.body}</p> : null}
      {block.statement ? <p className="mt-4 text-lg font-semibold">{block.statement}</p> : null}
      {block.text ? <p className="mt-4 text-lg font-semibold">{block.text}</p> : null}
      {block.question ? <p className="mt-4 text-lg font-semibold">{block.question}</p> : null}
      {block.imageUrl ? <img src={block.imageUrl} alt={block.imageAlt || block.title || 'Lesson image'} className="mt-4 max-h-80 w-full rounded-2xl border object-contain" /> : null}
      {block.imageCaption ? <p className="mt-2 text-center text-xs text-muted-foreground">{block.imageCaption}</p> : null}
      {Array.isArray(block.options) && block.options.length ? <Options options={block.options} answer={block.correctAnswer ?? block.answer} /> : null}
      {block.visual ? <MathVisual visual={block.visual} /> : null}
      {block.explanation ? <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Explanation: </span>{block.explanation}</div> : null}
    </article>
  );
}

function Options({ options, answer }: { options: string[]; answer?: string | boolean }) {
  return (
    <div className="mt-4 grid gap-2">
      {options.map((option) => {
        const isCorrect = String(option) === String(answer);
        return <div key={option} className={`rounded-2xl border p-3 text-sm ${isCorrect ? 'border-primary bg-primary/10 text-primary' : 'bg-muted/30'}`}>{option}</div>;
      })}
    </div>
  );
}

function MathVisual({ visual }: { visual: Record<string, any> }) {
  const type = typeof visual.type === 'string' ? visual.type : 'visual';

  if (type === 'table') {
    const columns = Array.isArray(visual.columns) ? visual.columns : [];
    const rows = Array.isArray(visual.rows) ? visual.rows : [];
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          {columns.length ? <thead className="bg-muted"><tr>{columns.map((column: string) => <th key={column} className="p-3 text-left font-semibold">{column}</th>)}</tr></thead> : null}
          <tbody>{rows.map((row: any[], index: number) => <tr key={index} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{String(cell)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }

  if (type === 'formula_sheet') {
    const formulas = Array.isArray(visual.formulas) ? visual.formulas : [];
    return <div className="mt-4 grid gap-2">{formulas.map((formula: any, index: number) => <div key={index} className="rounded-2xl border bg-muted/30 p-4"><p className="font-semibold">{formula.name || `Formula ${index + 1}`}</p><p className="mt-1 font-mono text-lg">{formula.formula}</p>{formula.description ? <p className="mt-1 text-sm text-muted-foreground">{formula.description}</p> : null}</div>)}</div>;
  }

  if (type === 'number_line') {
    const points = Array.isArray(visual.points) ? visual.points : [];
    return <div className="mt-4 rounded-2xl border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Number line</p><div className="mt-4 flex items-center gap-2 overflow-x-auto"><span>{visual.min ?? -5}</span><div className="relative h-2 min-w-[220px] flex-1 rounded-full bg-primary/30">{points.map((point: number) => <span key={point} className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${Math.min(100, Math.max(0, ((Number(point) - Number(visual.min ?? -5)) / (Number(visual.max ?? 5) - Number(visual.min ?? -5))) * 100))}%` }} />)}</div><span>{visual.max ?? 5}</span></div><p className="mt-3 text-sm text-muted-foreground">Points: {points.join(', ') || 'none'}</p></div>;
  }

  const equation = typeof visual.equation === 'string' ? visual.equation : '';
  const expression = typeof visual.expression === 'string' ? visual.expression : '';
  const functions = Array.isArray(visual.functions) ? visual.functions : [];
  const functionText = functions.map((fn: any) => fn.expression || fn.label).filter(Boolean).join(', ');

  return (
    <div className="mt-4 rounded-2xl border bg-muted/30 p-5 text-center">
      <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase text-muted-foreground"><FunctionSquare className="size-4" /> {type.replace('_', ' ')}</p>
      <p className="mt-3 break-words font-mono text-xl">{equation || expression || functionText || 'Math visual'}</p>
      {type === 'graph' ? <p className="mt-2 text-xs text-muted-foreground">Graph preview source. A full plotted graph can be added later.</p> : null}
    </div>
  );
}
