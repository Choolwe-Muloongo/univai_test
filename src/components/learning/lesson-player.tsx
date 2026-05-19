'use client';

import { ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Sparkles, XCircle } from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { MathVisualBlock } from '@/components/learning/math-visual-blocks';
import { getBlockDefinition, normalizeBlockType as normalizeRegisteredBlockType, type LearningBlockPayload } from '@/components/learning/blocks/registry';
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
  prompt?: string;
  front?: string;
  back?: string;
  items?: unknown[];
  pairs?: Array<{ left?: string; right?: string }>;
  criteria?: unknown[];
  description?: string;
  term?: string;
  definition?: string;
  visual?: LessonVisualBlock;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  sectionTitle?: string;
  subLessonTitle?: string;
  templateLabel?: string;
  subjectArea?: string;
  teachingMove?: string;
  boardId?: string;
  keepSourceVisible?: boolean;
  sourceQuestion?: string;
  teacherNote?: string;
  extractedData?: unknown[];
  graphPointX?: string | number;
  graphPointY?: string | number;
  graphPointLabel?: string;
  graphMode?: string;
  showGraphLine?: boolean;
  cumulativeTable?: boolean;
  threadTrail?: Array<{ title: string; move?: string; note?: string; data: string[] }>;
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

type LessonSection = {
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  blocks?: LessonBlock[];
  cards?: LessonBlock[];
  lessons?: LessonSection[];
  subLessons?: LessonSection[];
  sub_lessons?: LessonSection[];
  sections?: LessonSection[];
  topics?: LessonSection[];
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
const revealTypes = new Set(['flashcard', 'reveal', 'worked_solution']);
const visualBlockTypes = new Set(['equation', 'formula', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry']);
const nativePlayerTypes = new Set([
  'sub_lesson', 'explanation', 'example', 'question', 'fill_blank', 'true_false', 'summary',
  'definition', 'analogy', 'case_study', 'scenario', 'process', 'checklist', 'reflection',
  'flashcard', 'mistake', 'misconception', 'comparison', 'mini_project', 'rubric',
  'timeline', 'risk_review', 'practice_task',
]);

export function LessonPlayer({ lesson, courseTitle, backHref, onComplete, completed = false, completeLabel = 'Complete lesson' }: LessonPlayerProps) {
  const blocks = useMemo(() => normalizeLessonBlocks(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [choice, setChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  const block = enrichBlockForClassroomThread(blocks, index);
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
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-5 px-2 py-2 sm:px-0">
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

      <div className="grid flex-1 min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="flex min-h-[390px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border-primary/10 shadow-sm sm:rounded-3xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge className="rounded-full capitalize" variant={isInteractive ? 'default' : 'secondary'}>
              {labelForBlock(block)}
            </Badge>
            {typeof block.subLessonTitle === 'string' && block.type !== 'sub_lesson' ? <Badge variant="outline" className="max-w-[220px] truncate rounded-full"><MathText text={block.subLessonTitle} /></Badge> : null}
          </div>
          <CardTitle className="text-xl sm:text-2xl"><MathText text={titleForBlock(block)} /></CardTitle>
        </CardHeader>

        <CardContent className="flex-1 min-w-0 space-y-5">
          <BlockContent block={block} revealed={Boolean(revealed[index])} onReveal={() => setRevealed((current) => ({ ...current, [index]: true }))} />

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
      <SideContextPanel block={block} lessonDifficulty={lesson.difficulty} />
      </div>
    </div>
  );
}

function BlockContent({ block, revealed, onReveal }: { block: LessonBlock; revealed: boolean; onReveal: () => void }) {
  const text = block.type === 'question' ? block.question : block.type === 'fill_blank' ? block.text : block.type === 'true_false' ? block.statement : block.body;
  const items = toTextArray(block.items);
  const criteria = toTextArray(block.criteria);
  const context = <ClassroomThreadContext block={block} compact={false} />;

  const registryDefinition = getBlockDefinition(block.type);
  if (registryDefinition && shouldUseBlockEngineRenderer(block)) {
    const Renderer = registryDefinition.StudentRenderer;
    return <div className="space-y-4"><Renderer payload={block as LearningBlockPayload} definition={registryDefinition} state={{ revealed }} />{context}</div>;
  }

  if (visualBlockTypes.has(block.type)) {
    return <div className="space-y-4"><CardImage block={block} /><MathVisualBlock block={block} />{context}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
      <CardImage block={block} />
      {block.term || block.definition ? (
        <div className="rounded-2xl border bg-muted/20 p-4">
          {block.term ? <p className="text-sm font-semibold"><MathText text={block.term} /></p> : null}
          {block.definition ? <p className="mt-2 text-sm leading-6 text-muted-foreground"><MathText text={block.definition} /></p> : null}
        </div>
      ) : null}
      {text ? <p className="text-base leading-7 text-muted-foreground"><MathText text={text} /></p> : null}
      {block.description && !text ? <p className="text-base leading-7 text-muted-foreground"><MathText text={block.description} /></p> : null}
      {block.prompt ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold">Prompt</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground"><MathText text={block.prompt} /></p>
        </div>
      ) : null}
      </div>
      {revealTypes.has(block.type) || block.front || block.back ? (
        <div className="space-y-3 rounded-2xl border p-4">
          {block.front ? <p className="text-base font-semibold"><MathText text={block.front} /></p> : null}
          {revealed ? (
            <div className="rounded-xl bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
              <MathText text={block.back || block.explanation || 'Review the previous idea, then explain it in your own words.'} />
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onReveal}>Reveal answer</Button>
          )}
        </div>
      ) : null}
      {items.length ? (
        <GuidedSection title={block.type === 'summary' ? 'Key takeaways' : 'Supporting points'}>
          <ul className="grid gap-2">
            {items.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} className="rounded-xl border bg-background p-3 text-sm leading-6 text-muted-foreground">
                <MathText text={item} />
              </li>
            ))}
          </ul>
        </GuidedSection>
      ) : null}
      {Array.isArray(block.pairs) && block.pairs.length ? (
        <GuidedSection title="Pairs">
          <div className="grid gap-2">
          {block.pairs.map((pair, pairIndex) => (
            <div key={`${pair.left ?? pairIndex}-${pairIndex}`} className="grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-2">
              <span className="font-medium"><MathText text={pair.left || `Item ${pairIndex + 1}`} /></span>
              <span className="text-muted-foreground"><MathText text={pair.right || 'Add matching value'} /></span>
            </div>
          ))}
          </div>
        </GuidedSection>
      ) : null}
      {criteria.length ? (
        criteria.length > 5 ? <ExpandableSection title={`Quality criteria (${criteria.length})`}>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {criteria.map((criterion, criterionIndex) => <li key={`${criterion}-${criterionIndex}`}><MathText text={`- ${criterion}`} /></li>)}
          </ul>
        </ExpandableSection> : <GuidedSection title="Quality criteria">
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {criteria.map((criterion, criterionIndex) => <li key={`${criterion}-${criterionIndex}`}><MathText text={`- ${criterion}`} /></li>)}
          </ul>
        </GuidedSection>
      ) : null}
      {block.code ? <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-sm"><code>{block.code}</code></pre> : null}
      {block.visual ? <VisualFrame visual={block.visual} /> : null}
      {Array.isArray(block.steps) && block.steps.length > 0 ? (
        <GuidedSection title="Worked steps">
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
        </GuidedSection>
      ) : null}
      {context}
    </div>
  );
}

function GuidedSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border bg-muted/10 p-4">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </section>
  );
}

function ExpandableSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="min-w-0 rounded-2xl border bg-muted/10 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
        {title}
        <ChevronDown className="size-4 text-muted-foreground" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function ClassroomThreadContext({ block, compact = false }: { block: LessonBlock; compact?: boolean }) {
  const extracted = toTextArray(block.extractedData);
  const trail = Array.isArray(block.threadTrail) ? block.threadTrail : [];
  if (!block.sourceQuestion && !block.teacherNote && !extracted.length && trail.length <= 1) return null;
  const sourceQuestion = typeof block.sourceQuestion === 'string' ? block.sourceQuestion : '';
  const sourceIsLong = sourceQuestion.length > 360;
  return (
    <div className={compact ? 'space-y-3' : 'space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4'}>
      {block.sourceQuestion ? (
        sourceIsLong || compact ? (
          <ExpandableSection title="Original classroom question">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground"><MathText text={block.sourceQuestion} /></p>
          </ExpandableSection>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Original classroom question</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground"><MathText text={block.sourceQuestion} /></p>
          </div>
        )
      ) : null}
      {extracted.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Data collected so far</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {extracted.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl border bg-background/70 px-3 py-2 text-sm">
                <MathText text={item} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {block.teacherNote ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Teacher reasoning</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground"><MathText text={block.teacherNote} /></p>
        </div>
      ) : null}
      {trail.length > 1 ? (
        <ExpandableSection title="Board progress so far">
          <div className="mt-2 grid gap-2">
            {trail.map((step, stepIndex) => (
              <div key={`${step.title}-${stepIndex}`} className="rounded-xl border bg-background/70 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Step {stepIndex + 1}: <MathText text={step.title} /></span>
                  {step.move ? <Badge variant="outline" className="rounded-full"><MathText text={step.move} /></Badge> : null}
                </div>
                {step.note ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground"><MathText text={step.note} /></p> : null}
                {step.data.length ? <p className="mt-1 text-xs text-muted-foreground"><MathText text={`Collected: ${step.data.join(', ')}`} /></p> : null}
              </div>
            ))}
          </div>
        </ExpandableSection>
      ) : null}
    </div>
  );
}

function SideContextPanel({ block, lessonDifficulty }: { block: LessonBlock; lessonDifficulty?: string | null }) {
  const hasContext = Boolean(block.sourceQuestion || block.teacherNote || toTextArray(block.extractedData).length || (Array.isArray(block.threadTrail) && block.threadTrail.length > 1) || block.subjectArea || lessonDifficulty);
  if (!hasContext) return null;
  return (
    <aside className="hidden min-w-0 space-y-3 xl:block">
      <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border bg-background/95 p-4 shadow-sm">
        <p className="text-sm font-semibold">Card context</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {typeof block.subjectArea === 'string' ? <Badge variant="outline" className="rounded-full"><MathText text={block.subjectArea} /></Badge> : null}
          {lessonDifficulty ? <Badge variant="outline" className="rounded-full capitalize">{lessonDifficulty}</Badge> : null}
        </div>
        <div className="mt-4">
          <ClassroomThreadContext block={block} compact />
        </div>
      </div>
    </aside>
  );
}

function enrichBlockForClassroomThread(blocks: LessonBlock[], index: number): LessonBlock {
  const current = blocks[index] ?? { type: 'summary', body: 'This lesson is being prepared.' };
  const boardId = typeof current.boardId === 'string' && current.boardId.trim() ? current.boardId.trim() : null;
  if (!boardId) return current;

  const thread = blocks.slice(0, index + 1).filter((block) => block.boardId === boardId);
  const source = thread.find((block) => typeof block.sourceQuestion === 'string' && block.sourceQuestion.trim())
    ?? thread.find((block) => ['board_problem', 'transaction_board', 'graph_equation_setup', 'graph_intro'].includes(block.type));
  const extractedData = uniqueText(thread.flatMap((block) => toTextArray(block.extractedData)));
  const graphPoints = thread.flatMap(pointsFromBlock);
  const tableRows = thread.flatMap((block) => rowsFromBlock(block));

  const enriched: LessonBlock = {
    ...current,
    sourceQuestion: current.keepSourceVisible === false ? current.sourceQuestion : current.sourceQuestion || sourceQuestionFrom(source),
    extractedData,
    threadTrail: thread.map((block, threadIndex) => ({
      title: block.title || block.templateLabel || labelForBlock(block) || `Step ${threadIndex + 1}`,
      move: block.teachingMove,
      note: block.teacherNote || block.body || block.explanation,
      data: toTextArray(block.extractedData),
    })),
  };

  if (graphPoints.length && isGraphTeachingBlock(current)) {
    enriched.visual = {
      ...(current.visual ?? {}),
      type: 'graph',
      title: current.title,
      description: current.description ?? current.body,
      graphType: current.showGraphLine ? 'line' : 'scatter',
      data: graphPoints,
      xMin: current.xMin ?? inferAxisMin(graphPoints, 'x'),
      xMax: current.xMax ?? inferAxisMax(graphPoints, 'x'),
      yMin: current.yMin ?? inferAxisMin(graphPoints, 'y'),
      yMax: current.yMax ?? inferAxisMax(graphPoints, 'y'),
    };
  }

  if (tableRows.length && current.cumulativeTable) {
    enriched.visual = {
      ...(current.visual ?? {}),
      type: 'table',
      columns: Array.isArray(current.columns) ? current.columns : ['Item', 'Debit', 'Credit', 'Reason'],
      rows: tableRows,
      description: current.description ?? current.body,
    };
  }

  return enriched;
}

function sourceQuestionFrom(block?: LessonBlock) {
  if (!block) return undefined;
  return block.sourceQuestion || block.question || block.prompt || block.body || block.text || block.statement;
}

function isGraphTeachingBlock(block: LessonBlock) {
  return block.type.startsWith('graph_') || block.type.includes('graph') || block.visual?.type === 'graph';
}

function pointsFromBlock(block: LessonBlock) {
  const direct = pointFromValues(block.graphPointX, block.graphPointY, block.graphPointLabel);
  const visualPoints = block.visual && Array.isArray(block.visual.data)
    ? (block.visual.data as Array<Record<string, unknown>>).map((point) => pointFromValues(point.x, point.y, String(point.label ?? ''))).filter(Boolean) as Array<{ x: number; y: number; label?: string }>
    : [];
  return direct ? [...visualPoints, direct] : visualPoints;
}

function pointFromValues(xValue: unknown, yValue: unknown, label?: string) {
  const x = Number(xValue);
  const y = Number(yValue);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y, label: label || `(${x}, ${y})` };
}

function rowsFromBlock(block: LessonBlock) {
  if (block.visual?.type === 'table' && Array.isArray(block.visual.rows)) return block.visual.rows as unknown[][];
  if (Array.isArray(block.rows)) return block.rows as unknown[][];
  return [];
}

function inferAxisMin(points: Array<{ x: number; y: number }>, axis: 'x' | 'y') {
  const min = Math.min(...points.map((point) => point[axis]));
  return Number.isFinite(min) ? Math.floor(min - 1) : -10;
}

function inferAxisMax(points: Array<{ x: number; y: number }>, axis: 'x' | 'y') {
  const max = Math.max(...points.map((point) => point[axis]));
  return Number.isFinite(max) ? Math.ceil(max + 1) : 10;
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

function uniqueText(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const direct = [
    ...(Array.isArray(record.blocks) ? record.blocks as LessonBlock[] : []),
    ...(Array.isArray(record.cards) ? record.cards as LessonBlock[] : []),
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

function sectionsFrom(value: unknown): LessonBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section, index) => blocksFromSection(section as LessonSection, index));
}

function blocksFromSection(section: LessonSection, index: number): LessonBlock[] {
  const title = section.title ?? section.name ?? `Sub-lesson ${index + 1}`;
  const intro: LessonBlock = {
    type: 'sub_lesson',
    title,
    body: section.description ?? section.summary ?? 'Start this sub-lesson.',
    subLessonTitle: title,
  };
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
  return normalizeRegisteredBlockType(type);
}

function evaluateAnswer(block: LessonBlock, rawAnswer: string): AnswerState | null {
  if (!interactiveTypes.has(block.type)) return null;
  const expected = block.type === 'true_false' ? String(block.correctAnswer ?? block.answer) : String(block.correctAnswer ?? block.answer ?? '');
  const isCorrect = normalizeAnswer(rawAnswer) === normalizeAnswer(expected);
  return { isCorrect, message: block.explanation || (isCorrect ? 'Nice. You understood this card.' : 'Review the card and try to spot the key idea.') };
}

function titleForBlock(block: LessonBlock) {
  if (block.title) return block.title;
  const definition = getBlockDefinition(block.type);
  if (definition) return definition.label;
  if (block.type === 'sub_lesson') return 'Sub-lesson';
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
  if (block.type === 'definition') return 'Definition';
  if (block.type === 'analogy') return 'Analogy';
  if (block.type === 'case_study') return 'Case study';
  if (block.type === 'scenario') return 'Scenario';
  if (block.type === 'process') return 'Step by step';
  if (block.type === 'checklist') return 'Checklist';
  if (block.type === 'reflection') return 'Reflection';
  if (block.type === 'flashcard') return 'Flashcard';
  if (block.type === 'mistake' || block.type === 'misconception') return 'Common mistake';
  if (block.type === 'comparison') return 'Compare';
  if (block.type === 'mini_project') return 'Mini project';
  if (block.type === 'rubric') return 'Rubric';
  if (block.type === 'timeline') return 'Timeline';
  if (block.type === 'risk_review') return 'Risk review';
  if (block.type === 'practice_task') return 'Practice task';
  if (block.type === 'summary') return 'Lesson summary';
  return 'Lesson card';
}

function labelForBlock(block: LessonBlock) {
  const type = block.type;
  if (typeof block.teachingMove === 'string' && block.teachingMove.trim()) return block.teachingMove;
  if (typeof block.templateLabel === 'string' && block.templateLabel.trim()) {
    const parts = block.templateLabel.split(':');
    return (parts[1] ?? parts[0]).trim();
  }
  if (type === 'sub_lesson') return 'sub lesson';
  if (type === 'fill_blank') return 'fill blank';
  if (type === 'true_false') return 'true/false';
  if (type === 'question') return 'checkpoint';
  if (type === 'explanation') return 'explanation';
  const definition = getBlockDefinition(type);
  if (definition) return definition.label;
  return type.replace(/_/g, ' ');
}

function shouldUseBlockEngineRenderer(block: LessonBlock) {
  if (nativePlayerTypes.has(block.type) || visualBlockTypes.has(block.type)) return false;
  return Boolean(getBlockDefinition(block.type));
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
