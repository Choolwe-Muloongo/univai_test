'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, XCircle } from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { LessonWithCourseId } from '@/lib/api/types';

type MissionBlock = {
  type: string;
  title?: string;
  body?: string;
  code?: string;
  question?: string;
  options?: string[];
  correctAnswer?: string | boolean;
  answer?: string | boolean;
  explanation?: string;
  text?: string;
  statement?: string;
  prompt?: string;
  front?: string;
  back?: string;
  items?: unknown[];
  description?: string;
  subLessonTitle?: string;
  [key: string]: unknown;
};

type MissionSection = {
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  blocks?: MissionBlock[];
  cards?: MissionBlock[];
  sections?: MissionSection[];
  subLessons?: MissionSection[];
  sub_lessons?: MissionSection[];
  topics?: MissionSection[];
  lessons?: MissionSection[];
};

type PlayableLesson = Partial<LessonWithCourseId> & {
  title: string;
  summary?: string | null;
  estimatedMinutes?: number | null;
  difficulty?: string | null;
};

type MissionCardPayload = {
  cardIndex: number;
  cardType: string;
  title?: string;
};

type MissionCheckpointPayload = MissionCardPayload & {
  correct: boolean;
};

type Props = {
  lesson: PlayableLesson;
  courseTitle?: string;
  backHref?: string;
  onComplete?: () => Promise<void> | void;
  completed?: boolean;
  completeLabel?: string;
  onCardCompleted?: (payload: MissionCardPayload) => void;
  onCheckpointAnswered?: (payload: MissionCheckpointPayload) => void;
};

type AnswerState = { isCorrect: boolean; message: string };

const interactiveTypes = new Set(['question', 'fill_blank', 'true_false']);

export function StudentMissionLessonPlayer({
  lesson,
  courseTitle,
  backHref,
  onComplete,
  completed = false,
  completeLabel = 'Claim Mission Reward',
  onCardCompleted,
  onCheckpointAnswered,
}: Props) {
  const blocks = useMemo(() => normalizeMissionBlocks(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [choice, setChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const block = blocks[index] ?? { type: 'summary', body: 'This mission is being prepared.' };
  const answered = answers[index];
  const isInteractive = interactiveTypes.has(block.type);
  const canContinue = !isInteractive || Boolean(answered);
  const isLast = index === blocks.length - 1;
  const progress = Math.round(((index + 1) / Math.max(1, blocks.length)) * 100);

  function currentPayload(): MissionCardPayload {
    return { cardIndex: index, cardType: block.type, title: titleForBlock(block) };
  }

  function markCardDone(source: string) {
    onCardCompleted?.({ ...currentPayload(), source } as MissionCardPayload);
  }

  function resetInput() {
    setChoice('');
    setTextAnswer('');
  }

  function goPrevious() {
    setIndex((value) => Math.max(value - 1, 0));
    resetInput();
  }

  function goNext() {
    if (!canContinue) return;
    markCardDone('continue');
    setIndex((value) => Math.min(value + 1, blocks.length - 1));
    resetInput();
  }

  function checkAnswer() {
    const state = evaluateAnswer(block, block.type === 'fill_blank' ? textAnswer : choice);
    if (!state) return;
    setAnswers((current) => ({ ...current, [index]: state }));
    onCheckpointAnswered?.({ ...currentPayload(), correct: state.isCorrect });
  }

  async function completeMission() {
    if (!onComplete) return;
    markCardDone('complete');
    setSaving(true);
    try {
      await onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-5 px-2 py-2 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        {backHref ? (
          <Button variant="ghost" size="sm" asChild className="gap-2 px-2">
            <Link href={backHref}><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        ) : <span />}
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : 'Self-paced'}
        </Badge>
      </div>

      <div className="space-y-2">
        {courseTitle ? <p className="text-sm font-medium text-primary"><MathText text={courseTitle} /></p> : null}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl"><MathText text={lesson.title} /></h1>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Card {index + 1} of {blocks.length}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Card className="flex min-h-[390px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border-primary/10 shadow-sm sm:rounded-3xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge className="rounded-full capitalize" variant={isInteractive ? 'default' : 'secondary'}>{labelForBlock(block)}</Badge>
            {block.subLessonTitle && block.type !== 'sub_lesson' ? <Badge variant="outline" className="rounded-full"><MathText text={String(block.subLessonTitle)} /></Badge> : null}
          </div>
          <CardTitle className="text-xl sm:text-2xl"><MathText text={titleForBlock(block)} /></CardTitle>
        </CardHeader>

        <CardContent className="flex-1 min-w-0 space-y-5">
          <MissionBlockContent block={block} revealed={Boolean(revealed[index])} onReveal={() => setRevealed((current) => ({ ...current, [index]: true }))} />

          {block.type === 'question' ? (
            <div className="grid gap-3">
              {(block.options ?? []).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={Boolean(answered)}
                  onClick={() => setChoice(option)}
                  className={`rounded-2xl border p-4 text-left text-sm transition ${choice === option ? 'border-primary bg-primary/5' : 'hover:border-primary/50'} ${answered ? 'cursor-default' : ''}`}
                >
                  <MathText text={option} />
                </button>
              ))}
            </div>
          ) : null}

          {block.type === 'fill_blank' ? <Input value={textAnswer} disabled={Boolean(answered)} onChange={(event) => setTextAnswer(event.target.value)} placeholder="Type your answer..." /> : null}

          {block.type === 'true_false' ? (
            <div className="grid grid-cols-2 gap-3">
              {['true', 'false'].map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={Boolean(answered)}
                  onClick={() => setChoice(option)}
                  className={`rounded-2xl border p-4 text-center text-sm font-medium capitalize transition ${choice === option ? 'border-primary bg-primary/5' : 'hover:border-primary/50'} ${answered ? 'cursor-default' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {answered ? (
            <div className={`rounded-2xl border p-4 text-sm ${answered.isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="mb-1 flex items-center gap-2 font-semibold">
                {answered.isCorrect ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                {answered.isCorrect ? 'Correct' : 'Not quite'}
              </div>
              <p className="text-muted-foreground"><MathText text={answered.message} /></p>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="sticky bottom-0 z-10 flex flex-col gap-3 border-t bg-background/95 pt-4 backdrop-blur sm:static sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={goPrevious} disabled={index === 0} className="w-full gap-2 sm:w-auto"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          {isInteractive && !answered ? (
            <Button onClick={checkAnswer} disabled={!choice && !textAnswer.trim()} className="w-full sm:w-auto">Check answer</Button>
          ) : isLast ? (
            <Button onClick={completeMission} disabled={!onComplete || completed || saving} className="w-full gap-2 bg-[#00694E] hover:bg-[#00563f] sm:w-auto">
              <Sparkles className="h-4 w-4" /> {completed ? 'Mission completed' : saving ? 'Saving...' : completeLabel}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canContinue} className="w-full gap-2 sm:w-auto">Continue <ChevronRight className="h-4 w-4" /></Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function MissionBlockContent({ block, revealed, onReveal }: { block: MissionBlock; revealed: boolean; onReveal: () => void }) {
  const text = block.type === 'question' ? block.question : block.type === 'fill_blank' ? block.text : block.type === 'true_false' ? block.statement : block.body;
  const items = toTextArray(block.items);
  return (
    <div className="space-y-4">
      {text ? <p className="text-base leading-7 text-muted-foreground"><MathText text={text} /></p> : null}
      {block.description && !text ? <p className="text-base leading-7 text-muted-foreground"><MathText text={block.description} /></p> : null}
      {block.prompt ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-semibold">Prompt</p><p className="mt-2 text-sm leading-6 text-muted-foreground"><MathText text={block.prompt} /></p></div> : null}
      {block.code ? <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-sm"><code>{block.code}</code></pre> : null}
      {items.length ? <ul className="grid gap-2">{items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`} className="rounded-xl border bg-background p-3 text-sm leading-6 text-muted-foreground"><MathText text={item} /></li>)}</ul> : null}
      {block.front || block.back ? (
        <div className="space-y-3 rounded-2xl border p-4">
          {block.front ? <p className="text-base font-semibold"><MathText text={block.front} /></p> : null}
          {revealed ? <div className="rounded-xl bg-muted/50 p-3 text-sm leading-6 text-muted-foreground"><MathText text={block.back || block.explanation || 'Review this idea in your own words.'} /></div> : <Button type="button" variant="outline" size="sm" onClick={onReveal}>Reveal answer</Button>}
        </div>
      ) : null}
    </div>
  );
}

function normalizeMissionBlocks(lesson: PlayableLesson): MissionBlock[] {
  const fromLearningObjects = lesson.learningObjects
    ?.flatMap((object) => {
      const payloadBlocks = readBlocksFromUnknown(object.payload);
      if (payloadBlocks.length) return payloadBlocks;
      const bodyBlocks = readBlocksFromUnknown(parseMaybeJson(object.body));
      if (bodyBlocks.length) return bodyBlocks;
      if (object.body && object.type !== 'video') return [{ type: 'explanation', title: object.title, body: stripHtml(object.body) } as MissionBlock];
      return [];
    })
    .filter(Boolean) as MissionBlock[] | undefined;

  if (fromLearningObjects?.length) return sanitizeBlocks(fromLearningObjects);

  const parsedContent = readBlocksFromUnknown(parseMaybeJson(lesson.content));
  if (parsedContent.length) return sanitizeBlocks(parsedContent);

  const fallback: MissionBlock[] = [{ type: 'explanation', title: 'Core idea', body: stripHtml(lesson.content ?? lesson.summary ?? 'This lesson is being prepared.') }];
  const quizQuestions = lesson.quiz?.questions ?? [];
  quizQuestions.slice(0, 4).forEach((question, idx) => {
    fallback.push({ type: 'question', question: question.question, options: question.options, correctAnswer: question.answer ?? question.options[0] ?? '', explanation: 'Review the lesson card and compare the options carefully.', title: `Quick check ${idx + 1}` });
  });
  fallback.push({ type: 'summary', body: 'Great work. You have reached the end of this mission.' });
  return sanitizeBlocks(fallback);
}

function readBlocksFromUnknown(value: unknown): MissionBlock[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const direct = [
    ...(Array.isArray(record.blocks) ? record.blocks as MissionBlock[] : []),
    ...(Array.isArray(record.cards) ? record.cards as MissionBlock[] : []),
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

function sectionsFrom(value: unknown): MissionBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section, index) => blocksFromSection(section as MissionSection, index));
}

function blocksFromSection(section: MissionSection, index: number): MissionBlock[] {
  const title = section.title ?? section.name ?? `Mission step ${index + 1}`;
  const intro: MissionBlock = { type: 'sub_lesson', title, body: section.description ?? section.summary ?? 'Start this mission step.', subLessonTitle: title };
  const localBlocks = [...(section.blocks ?? []), ...(section.cards ?? [])].map((block) => ({ ...block, subLessonTitle: title }));
  const nested = [
    ...sectionsFrom(section.sections),
    ...sectionsFrom(section.subLessons),
    ...sectionsFrom(section.sub_lessons),
    ...sectionsFrom(section.topics),
    ...sectionsFrom(section.lessons),
  ];
  return [intro, ...localBlocks, ...nested];
}

function sanitizeBlocks(blocks: MissionBlock[]): MissionBlock[] {
  const cleaned = blocks
    .filter((block) => block && typeof block === 'object')
    .map((block) => ({ ...block, type: String(block.type || 'explanation') }))
    .map((block) => coerceIncompleteInteractiveBlock(block));
  return cleaned.length ? cleaned : [{ type: 'summary', body: 'This mission is being prepared.' }];
}

function coerceIncompleteInteractiveBlock(block: MissionBlock): MissionBlock {
  if (block.type === 'question' && (!block.options?.length || !block.correctAnswer)) return { ...block, type: 'explanation', title: block.title ?? 'Checkpoint note', body: block.question ?? block.body ?? 'This checkpoint needs review before it can be answered.' };
  if (block.type === 'fill_blank' && (!block.text || !block.correctAnswer)) return { ...block, type: 'explanation', title: block.title ?? 'Practice note', body: block.text ?? block.body ?? 'This fill-in-the-blank card needs review before it can be answered.' };
  if (block.type === 'true_false' && (!block.statement || typeof block.correctAnswer === 'undefined')) return { ...block, type: 'explanation', title: block.title ?? 'True/false note', body: block.statement ?? block.body ?? 'This true-or-false card needs review before it can be answered.' };
  return block;
}

function evaluateAnswer(block: MissionBlock, rawAnswer: string): AnswerState | null {
  if (!interactiveTypes.has(block.type)) return null;
  const expected = block.type === 'true_false' ? String(block.correctAnswer ?? block.answer) : String(block.correctAnswer ?? block.answer ?? '');
  const isCorrect = normalizeAnswer(rawAnswer) === normalizeAnswer(expected);
  return { isCorrect, message: block.explanation || (isCorrect ? 'Nice. You understood this card.' : 'Review the card and try to spot the key idea.') };
}

function titleForBlock(block: MissionBlock) {
  if (block.title) return block.title;
  if (block.type === 'sub_lesson') return 'Mission step';
  if (block.type === 'question') return 'Quick check';
  if (block.type === 'fill_blank') return 'Fill in the blank';
  if (block.type === 'true_false') return 'True or false';
  if (block.type === 'summary') return 'Mission summary';
  return 'Mission card';
}

function labelForBlock(block: MissionBlock) {
  if (block.type === 'sub_lesson') return 'mission step';
  if (block.type === 'fill_blank') return 'fill blank';
  if (block.type === 'true_false') return 'true/false';
  if (block.type === 'question') return 'checkpoint';
  if (block.type === 'explanation') return 'explanation';
  return block.type.replace(/_/g, ' ');
}

function toTextArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return String(record.title ?? record.label ?? record.name ?? record.text ?? record.description ?? record.explanation ?? '');
      }
      return '';
    })
    .filter(Boolean);
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
