'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, XCircle } from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { MathVisualBlock } from '@/components/learning/math-visual-blocks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { LessonWithCourseId } from '@/lib/api/types';

type LessonVisualBlock = Record<string, unknown>;

type LessonBlock = {
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
  visual?: LessonVisualBlock;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  steps?: Array<{
    title?: string;
    explanation?: string;
    visual?: LessonVisualBlock;
    imageUrl?: string;
    imageAlt?: string;
    imageCaption?: string;
  }>;
  [key: string]: unknown;
};

type PlayableLesson = Partial<LessonWithCourseId> & {
  title: string;
  summary?: string | null;
  estimatedMinutes?: number | null;
  difficulty?: string | null;
};

type LessonPlayerProps = {
  lesson: PlayableLesson;
  courseTitle?: string;
  backHref?: string;
  onComplete?: () => Promise<void> | void;
  completed?: boolean;
  completeLabel?: string;
};

type AnswerState = { isCorrect: boolean; message: string };

const interactiveTypes = new Set(['question', 'fill_blank', 'true_false']);
const visualBlockTypes = new Set(['equation', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry']);

export function LessonPlayer({ lesson, courseTitle, backHref, onComplete, completed = false, completeLabel = 'Complete lesson' }: LessonPlayerProps) {
  const blocks = useMemo(() => normalizeLessonBlocks(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [choice, setChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const block = blocks[index] ?? { type: 'summary', body: 'This lesson is being prepared.' };
  const progress = Math.round(((index + 1) / Math.max(1, blocks.length)) * 100);
  const answered = answers[index];
  const isInteractive = interactiveTypes.has(block.type);
  const canContinue = !isInteractive || Boolean(answered);
  const isLast = index === blocks.length - 1;

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
    setIndex((value) => Math.min(value + 1, blocks.length - 1));
    resetInput();
  }

  async function completeLesson() {
    if (!onComplete) return;
    setSaving(true);
    try {
      await onComplete();
    } finally {
      setSaving(false);
    }
  }

  function checkAnswer() {
    const state = evaluateAnswer(block, block.type === 'fill_blank' ? textAnswer : choice);
    if (!state) return;
    setAnswers((current) => ({ ...current, [index]: state }));
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col gap-5 px-2 py-2 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        {backHref ? (
          <Button variant="ghost" size="sm" asChild className="gap-2 px-2">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
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

      <Card className="flex min-h-[390px] flex-1 flex-col rounded-3xl border-primary/10 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full capitalize" variant={isInteractive ? 'default' : 'secondary'}>
              {labelForBlock(block.type)}
            </Badge>
            {lesson.difficulty ? <Badge variant="outline" className="rounded-full capitalize">{lesson.difficulty}</Badge> : null}
          </div>
          <CardTitle className="text-xl sm:text-2xl"><MathText text={titleForBlock(block)} /></CardTitle>
        </CardHeader>

        <CardContent className="flex-1 space-y-5">
          <BlockContent block={block} />

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

        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={goPrevious} disabled={index === 0} className="w-full gap-2 sm:w-auto">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isInteractive && !answered ? (
            <Button onClick={checkAnswer} disabled={!choice && !textAnswer.trim()} className="w-full sm:w-auto">Check answer</Button>
          ) : isLast ? (
            <Button onClick={completeLesson} disabled={!onComplete || completed || saving} className="w-full gap-2 bg-[#00694E] hover:bg-[#00563f] sm:w-auto">
              <Sparkles className="h-4 w-4" />
              {completed ? 'Lesson completed' : saving ? 'Saving...' : completeLabel}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canContinue} className="w-full gap-2 sm:w-auto">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function BlockContent({ block }: { block: LessonBlock }) {
  const text = block.type === 'question' ? block.question : block.type === 'fill_blank' ? block.text : block.type === 'true_false' ? block.statement : block.body;

  if (visualBlockTypes.has(block.type)) {
    return <div className="space-y-4"><CardImage block={block} /><MathVisualBlock block={block} /></div>;
  }

  return (
    <div className="space-y-4">
      <CardImage block={block} />
      {text ? <p className="text-base leading-7 text-muted-foreground"><MathText text={text} /></p> : null}
      {block.code ? <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-sm"><code>{block.code}</code></pre> : null}
      {block.visual ? <VisualFrame visual={block.visual} /> : null}
      {Array.isArray(block.steps) && block.steps.length > 0 ? (
        <div className="space-y-4">
          {block.steps.map((step, stepIndex) => (
            <div key={`${step.title ?? 'step'}-${stepIndex}`} className="space-y-3 rounded-2xl border bg-muted/10 p-4">
              <p className="font-semibold"><MathText text={step.title || `Step ${stepIndex + 1}`} /></p>
              <CardImage block={step} />
              {step.explanation ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={step.explanation} /></p> : null}
              {step.visual ? <VisualFrame visual={step.visual} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CardImage({ block }: { block: Pick<LessonBlock, 'imageUrl' | 'imageAlt' | 'imageCaption'> }) {
  if (!block.imageUrl || typeof block.imageUrl !== 'string') return null;
  return (
    <figure className="overflow-hidden rounded-2xl border bg-muted/20">
      <img src={block.imageUrl} alt={block.imageAlt || 'Lesson card illustration'} className="max-h-[420px] w-full object-contain" />
      {block.imageCaption ? <figcaption className="border-t bg-background/80 px-4 py-3 text-sm text-muted-foreground"><MathText text={block.imageCaption} /></figcaption> : null}
    </figure>
  );
}

function VisualFrame({ visual }: { visual: LessonVisualBlock }) {
  return (
    <div className="rounded-2xl border bg-background/80 p-3">
      <MathVisualBlock block={visual} />
    </div>
  );
}

function normalizeLessonBlocks(lesson: PlayableLesson): LessonBlock[] {
  const fromLearningObjects = lesson.learningObjects
    ?.flatMap((object) => {
      const payloadBlocks = readBlocksFromUnknown(object.payload);
      if (payloadBlocks.length) return payloadBlocks;
      const bodyBlocks = readBlocksFromUnknown(parseMaybeJson(object.body));
      if (bodyBlocks.length) return bodyBlocks;
      if (object.body && object.type !== 'video') return [{ type: 'explanation', title: object.title, body: stripHtml(object.body) } as LessonBlock];
      return [];
    })
    .filter(Boolean) as LessonBlock[] | undefined;

  if (fromLearningObjects?.length) return sanitizeBlocks(fromLearningObjects);

  const parsedContent = readBlocksFromUnknown(parseMaybeJson(lesson.content));
  if (parsedContent.length) return sanitizeBlocks(parsedContent);

  const fallback: LessonBlock[] = [{ type: 'explanation', title: 'Core idea', body: stripHtml(lesson.content ?? lesson.summary ?? 'This lesson is being prepared.') }];
  const quizQuestions = lesson.quiz?.questions ?? [];
  quizQuestions.slice(0, 4).forEach((question, idx) => {
    fallback.push({ type: 'question', question: question.question, options: question.options, correctAnswer: question.answer ?? question.options[0] ?? '', explanation: 'Review the lesson card and compare the options carefully.', title: `Quick check ${idx + 1}` });
  });
  fallback.push({ type: 'summary', body: 'Great work. You have reached the end of this lesson.' });
  return sanitizeBlocks(fallback);
}

function readBlocksFromUnknown(value: unknown): LessonBlock[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.blocks)) return record.blocks as LessonBlock[];
  if (record.lesson && typeof record.lesson === 'object' && Array.isArray((record.lesson as Record<string, unknown>).blocks)) return (record.lesson as Record<string, unknown>).blocks as LessonBlock[];
  return [];
}

function sanitizeBlocks(blocks: LessonBlock[]): LessonBlock[] {
  const cleaned = blocks
    .filter((block) => block && typeof block === 'object')
    .map((block) => ({ ...block, type: normalizeBlockType(String(block.type || 'explanation')) }))
    .map((block) => coerceIncompleteInteractiveBlock(block));
  return cleaned.length ? cleaned : [{ type: 'summary', body: 'This lesson is being prepared.' }];
}

function coerceIncompleteInteractiveBlock(block: LessonBlock): LessonBlock {
  if (block.type === 'question' && (!block.options?.length || !block.correctAnswer)) return { ...block, type: 'explanation', title: block.title ?? 'Checkpoint note', body: block.question ?? block.body ?? 'This checkpoint needs review before it can be answered.', visual: block.visual };
  if (block.type === 'fill_blank' && (!block.text || !block.correctAnswer)) return { ...block, type: 'explanation', title: block.title ?? 'Practice note', body: block.text ?? block.body ?? 'This fill-in-the-blank card needs review before it can be answered.', visual: block.visual };
  if (block.type === 'true_false' && (!block.statement || typeof block.correctAnswer === 'undefined')) return { ...block, type: 'explanation', title: block.title ?? 'True/false note', body: block.statement ?? block.body ?? 'This true-or-false card needs review before it can be answered.', visual: block.visual };
  return block;
}

function normalizeBlockType(type: string) {
  if (type === 'multiple_choice' || type === 'mcq' || type === 'checkpoint' || type === 'visual_question' || type === 'graph_question' || type === 'geometry_question' || type === 'table_question' || type === 'number_line_question') return 'question';
  if (type === 'fill-in-the-blank') return 'fill_blank';
  if (type === 'truefalse') return 'true_false';
  if (type === 'content' || type === 'read') return 'explanation';
  if (type === 'chart' || type === 'plot') return 'graph';
  if (type === 'formula') return 'equation';
  return type;
}

function evaluateAnswer(block: LessonBlock, rawAnswer: string): AnswerState | null {
  if (!interactiveTypes.has(block.type)) return null;
  const expected = block.type === 'true_false' ? String(block.correctAnswer ?? block.answer) : String(block.correctAnswer ?? block.answer ?? '');
  const isCorrect = normalizeAnswer(rawAnswer) === normalizeAnswer(expected);
  return { isCorrect, message: block.explanation || (isCorrect ? 'Nice. You understood this card.' : 'Review the card and try to spot the key idea.') };
}

function titleForBlock(block: LessonBlock) {
  if (block.title) return block.title;
  if (block.type === 'question') return block.visual ? 'Visual question' : 'Quick check';
  if (block.type === 'fill_blank') return block.visual ? 'Visual fill-in' : 'Fill in the blank';
  if (block.type === 'true_false') return block.visual ? 'Visual true or false' : 'True or false';
  if (block.type === 'equation') return 'Equation';
  if (block.type === 'graph') return 'Graph';
  if (block.type === 'table') return 'Table';
  if (block.type === 'number_line') return 'Number line';
  if (block.type === 'matrix') return 'Matrix';
  if (block.type === 'formula_sheet') return 'Formula sheet';
  if (block.type === 'geometry') return 'Diagram';
  if (block.type === 'summary') return 'Lesson summary';
  return 'Lesson card';
}

function labelForBlock(type: string) {
  if (type === 'fill_blank') return 'fill blank';
  if (type === 'true_false') return 'true/false';
  if (type === 'question') return 'checkpoint';
  if (type === 'explanation') return 'explanation';
  return type.replace('_', ' ');
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
