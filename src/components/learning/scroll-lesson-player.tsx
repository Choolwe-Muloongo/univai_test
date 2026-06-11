'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ImageIcon, Sparkles } from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { MathVisualBlock } from '@/components/learning/math-visual-blocks';
import { getBlockDefinition, normalizeBlockType as normalizeRegisteredBlockType, type LearningBlockPayload } from '@/components/learning/blocks/registry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { LessonWithCourseId } from '@/lib/api/types';

type ScrollLesson = Partial<LessonWithCourseId> & {
  title: string;
  summary?: string | null;
  estimatedMinutes?: number | null;
  difficulty?: string | null;
};

type ScrollBlock = Record<string, unknown> & {
  type: string;
  title?: string;
  body?: string;
  question?: string;
  options?: string[];
  text?: string;
  statement?: string;
  front?: string;
  back?: string;
  explanation?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  visual?: Record<string, unknown>;
};

type ScrollLessonPlayerProps = {
  lesson: ScrollLesson;
  courseTitle?: string;
  backHref?: string;
  onComplete?: () => Promise<void> | void;
  completed?: boolean;
  completeLabel?: string;
  onCardCompleted?: (payload: { cardIndex: number; cardType: string; title?: string; source?: string }) => void;
};

const visualTypes = new Set(['equation', 'formula', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry', 'venn']);

export function ScrollLessonPlayer({ lesson, courseTitle, backHref, onComplete, completed = false, completeLabel = 'Complete lesson', onCardCompleted }: ScrollLessonPlayerProps) {
  const blocks = useMemo(() => normalizeScrollBlocks(lesson), [lesson]);
  const [saving, setSaving] = useState(false);

  async function completeScrolledLesson() {
    if (!onComplete) return;
    blocks.forEach((block, index) => {
      onCardCompleted?.({ cardIndex: index, cardType: block.type, title: titleFor(block, index), source: 'scroll_complete' });
    });
    setSaving(true);
    try {
      await onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <header className="sticky top-0 z-30 -mx-3 border-b bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
        <div className="flex items-center justify-between gap-2">
          {backHref ? (
            <Button variant="ghost" size="sm" asChild className="h-9 shrink-0 gap-2 rounded-full px-2 sm:px-3">
              <Link href={backHref}>
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
          ) : <span className="size-9 shrink-0" />}
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-primary sm:text-xs"><MathText text={courseTitle || 'Study mode'} /></p>
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-xl"><MathText text={lesson.title} /></h1>
          </div>
          <Badge variant="secondary" className="max-w-[110px] truncate rounded-full px-2 py-1 text-[11px] sm:max-w-[160px] sm:text-xs">Scroll</Badge>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground sm:text-xs">
            <span>{blocks.length} cards loaded</span>
            <span>{lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : 'Self-paced'}</span>
          </div>
          <Progress value={100} className="h-1.5 sm:h-2" />
        </div>
      </header>

      <main className="grid gap-4 py-4 pb-28">
        {blocks.map((block, index) => (
          <article key={`${block.type}-${index}`} className="scroll-mt-24 overflow-hidden rounded-2xl border border-primary/10 bg-background shadow-sm sm:rounded-3xl" id={`card-${index + 1}`}>
            <header className="space-y-2 px-4 py-3 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={isPractice(block.type) ? 'default' : 'secondary'} className="rounded-full capitalize">{label(block.type)}</Badge>
                <Badge variant="outline" className="rounded-full">Card {index + 1}</Badge>
              </div>
              <h2 className="break-words text-lg font-semibold leading-tight sm:text-2xl"><MathText text={titleFor(block, index)} /></h2>
            </header>
            <div className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
              <ScrollBlockContent block={block} />
              {isPractice(block.type) ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                  Practice cards are easier to answer in Card mode. Use Settings → Card mode when you want instant checking.
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </main>

      <footer className="sticky bottom-0 z-30 -mx-3 mt-auto border-t bg-background/95 p-3 backdrop-blur sm:-mx-4 sm:p-4 lg:-mx-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Scroll mode shows the full lesson at once. Cards are already loaded.</p>
          <Button onClick={completeScrolledLesson} disabled={!onComplete || completed || saving} className="min-h-11 w-full gap-2 bg-[#00694E] hover:bg-[#00563f] sm:w-auto">
            <Sparkles className="size-4" />
            {completed ? 'Lesson completed' : saving ? 'Saving...' : completeLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function ScrollBlockContent({ block }: { block: ScrollBlock }) {
  const definition = getBlockDefinition(block.type);
  if (definition && shouldUseBlockEngineRenderer(block)) {
    const Renderer = definition.StudentRenderer;
    return <div className="space-y-4 overflow-hidden break-words"><Renderer payload={block as LearningBlockPayload} definition={definition} state={{ revealed: true }} /></div>;
  }

  const text = String(block.body ?? block.question ?? block.text ?? block.statement ?? block.explanation ?? '');
  const options = Array.isArray(block.options) ? block.options : [];

  return (
    <div className="space-y-4 overflow-hidden break-words">
      {block.imageUrl ? (
        <figure className="overflow-hidden rounded-2xl border bg-muted/20">
          <img src={String(block.imageUrl)} alt={String(block.imageAlt || 'Lesson image')} className="mx-auto max-h-[420px] w-full object-contain" />
          {block.imageCaption ? <figcaption className="border-t bg-background/80 px-4 py-3 text-sm text-muted-foreground"><MathText text={String(block.imageCaption)} /></figcaption> : null}
        </figure>
      ) : null}

      {visualTypes.has(block.type) ? <MathVisualBlock block={block} /> : null}
      {block.visual ? <MathVisualBlock block={block.visual} /> : null}

      {text ? <p className="break-words text-base leading-7 text-muted-foreground"><MathText text={text} /></p> : null}

      {block.front || block.back ? (
        <div className="rounded-2xl border p-4">
          {block.front ? <p className="break-words font-semibold"><MathText text={String(block.front)} /></p> : null}
          {block.back ? <p className="mt-2 break-words text-sm leading-6 text-muted-foreground"><MathText text={String(block.back)} /></p> : null}
        </div>
      ) : null}

      {options.length ? (
        <div className="grid gap-2">
          {options.map((option, index) => <div key={`${option}-${index}`} className="rounded-2xl border p-3 text-sm"><MathText text={option} /></div>)}
        </div>
      ) : null}

      {!text && !options.length && !block.imageUrl && !block.visual ? (
        <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
          <ImageIcon className="mb-2 size-5" />
          This card has custom content. Open Card mode for the full interactive renderer.
        </div>
      ) : null}
    </div>
  );
}

function normalizeScrollBlocks(lesson: ScrollLesson): ScrollBlock[] {
  const fromLearningObjects = lesson.learningObjects
    ?.flatMap((object) => {
      const payloadBlocks = readBlocksFromUnknown(object.payload);
      if (payloadBlocks.length) return payloadBlocks;
      const bodyBlocks = readBlocksFromUnknown(parseMaybeJson(object.body));
      if (bodyBlocks.length) return bodyBlocks;
      if (object.body && object.type !== 'video') return [{ type: 'explanation', title: object.title, body: stripHtml(object.body) } as ScrollBlock];
      return [];
    })
    .filter(Boolean) as ScrollBlock[] | undefined;

  if (fromLearningObjects?.length) return sanitizeBlocks(fromLearningObjects);

  const parsedContent = readBlocksFromUnknown(parseMaybeJson(lesson.content));
  if (parsedContent.length) return sanitizeBlocks(parsedContent);

  return sanitizeBlocks([{ type: 'explanation', title: 'Core idea', body: stripHtml(lesson.content ?? lesson.summary ?? 'This lesson is being prepared.') }, { type: 'summary', body: 'Great work. You have reached the end of this lesson.' }]);
}

function readBlocksFromUnknown(value: unknown): ScrollBlock[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const direct = [
    ...(Array.isArray(record.blocks) ? record.blocks as ScrollBlock[] : []),
    ...(Array.isArray(record.cards) ? record.cards as ScrollBlock[] : []),
  ];
  const grouped = [
    ...sectionsFrom(record.sections),
    ...sectionsFrom(record.subLessons),
    ...sectionsFrom(record.sub_lessons),
    ...sectionsFrom(record.topics),
    ...sectionsFrom(record.lessons),
  ];
  if (record.lesson && typeof record.lesson === 'object') return [...direct, ...readBlocksFromUnknown(record.lesson), ...grouped];
  return [...direct, ...grouped];
}

function sectionsFrom(value: unknown): ScrollBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section, index) => blocksFromSection(section as Record<string, unknown>, index));
}

function blocksFromSection(section: Record<string, unknown>, index: number): ScrollBlock[] {
  const title = String(section.title ?? section.name ?? `Sub-lesson ${index + 1}`);
  const intro: ScrollBlock = { type: 'sub_lesson', title, body: String(section.description ?? section.summary ?? 'Start this sub-lesson.') };
  const localBlocks = [...(Array.isArray(section.blocks) ? section.blocks : []), ...(Array.isArray(section.cards) ? section.cards : [])].map((block) => ({ ...(block as ScrollBlock), subLessonTitle: title }));
  const nested = [
    ...sectionsFrom(section.sections),
    ...sectionsFrom(section.subLessons),
    ...sectionsFrom(section.sub_lessons),
    ...sectionsFrom(section.topics),
    ...sectionsFrom(section.lessons),
  ];
  return [intro, ...localBlocks, ...nested];
}

function sanitizeBlocks(blocks: ScrollBlock[]): ScrollBlock[] {
  const cleaned = blocks
    .filter((block) => block && typeof block === 'object')
    .map((block) => ({ ...block, type: normalizeRegisteredBlockType(String(block.type || 'explanation')) }));
  return cleaned.length ? cleaned : [{ type: 'summary', body: 'This lesson is being prepared.' }];
}

function shouldUseBlockEngineRenderer(block: ScrollBlock) {
  return Boolean(getBlockDefinition(block.type));
}

function titleFor(block: ScrollBlock, index: number) {
  return String(block.title ?? block.sectionTitle ?? block.subLessonTitle ?? label(block.type) + ` ${index + 1}`);
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPractice(type: string) {
  return ['question', 'fill_blank', 'true_false'].includes(type);
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
