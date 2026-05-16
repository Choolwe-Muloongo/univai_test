'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, generateAi, getCourses, getSchools } from '@/lib/api';
import type { CourseBuilderBlueprint, CourseBuilderLesson, LessonCardBlock } from '@/lib/api/course-builder-types';
import type { Course, School } from '@/lib/api/types';

type FormState = {
  title: string;
  description: string;
  schoolId: string;
  price: string;
  currency: string;
  certificateFee: string;
  certificateCurrency: string;
  durationHours: string;
  level: string;
};

type AnyCard = Record<string, any>;

const allowedCardTypes = new Set([
  'explanation',
  'example',
  'equation',
  'graph',
  'table',
  'number_line',
  'matrix',
  'formula_sheet',
  'geometry',
  'question',
  'fill_blank',
  'true_false',
  'summary',
]);
const textDocumentExtensions = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.xml'];

export function ShortCourseLaunchBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [readingDocument, setReadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sourceDocumentName, setSourceDocumentName] = useState('');
  const [sourceDocumentText, setSourceDocumentText] = useState('');
  const [blueprintText, setBlueprintText] = useState('');
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    schoolId: '',
    price: '0',
    currency: 'ZMW',
    certificateFee: '0',
    certificateCurrency: 'ZMW',
    durationHours: '8',
    level: 'beginner',
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        if (schoolData[0]) setForm((value) => ({ ...value, schoolId: value.schoolId || schoolData[0].id }));
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short-course builder data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const parsedBlueprint = useMemo(() => {
    if (!blueprintText.trim()) return null;
    try {
      return normalizeBlueprint(JSON.parse(cleanJson(blueprintText)) as CourseBuilderBlueprint);
    } catch {
      return null;
    }
  }, [blueprintText]);

  const validation = useMemo(() => validateBlueprint(parsedBlueprint), [parsedBlueprint]);
  const previewLesson = parsedBlueprint?.modules?.[0]?.lessons?.[0] ?? null;

  async function readDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setReadingDocument(true);
    setError(null);
    setMessage(null);
    try {
      const name = file.name;
      const lowerName = name.toLowerCase();
      const isTextReadable = textDocumentExtensions.some((extension) => lowerName.endsWith(extension)) || file.type.startsWith('text/');
      setSourceDocumentName(name);

      if (!isTextReadable) {
        setSourceDocumentText(`Uploaded file: ${name}. This file type cannot be read directly in the browser yet. Paste the important content below or upload a .txt, .md, .csv, .json, .html, or .xml version for full AI context.`);
        setMessage('Document attached by name. For PDF/DOCX content, paste the extracted text into the source box so AI can use it.');
        return;
      }

      const text = await file.text();
      const clipped = text.slice(0, 60000);
      setSourceDocumentText(clipped);
      setMessage(text.length > clipped.length ? 'Document loaded. It was shortened to the first 60,000 characters for AI context.' : 'Document loaded. AI will use it together with your prompt.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read document.');
    } finally {
      setReadingDocument(false);
      event.target.value = '';
    }
  }

  async function generateCourse() {
    const seed = prompt || form.title || (sourceDocumentText ? 'Create a course from the attached source document.' : '');
    if (!seed.trim() && !sourceDocumentText.trim()) {
      setError('Describe the course or attach/paste a source document first.');
      return;
    }

    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const response = await generateAi({
        mode: 'general',
        feature: 'admin_short_course_builder',
        audience: 'short-course learners',
        brandContext: 'UnivAI Institute creates AI-assisted short courses that are human-reviewed before publishing.',
        prompt: buildLaunchPrompt(seed, form, sourceDocumentText, sourceDocumentName),
      });
      const raw = String((response as Record<string, unknown>).text || (response as Record<string, unknown>).output || (response as Record<string, unknown>).content || JSON.stringify(response));
      const blueprint = normalizeBlueprint(JSON.parse(cleanJson(raw)) as CourseBuilderBlueprint);
      const pretty = JSON.stringify(blueprint, null, 2);
      setBlueprintText(pretty);
      setForm((value) => ({
        ...value,
        title: value.title || blueprint.courseSummary.title,
        description: value.description || blueprint.courseSummary.description,
        durationHours: String(blueprint.courseSummary.totalDurationHours || value.durationHours),
        level: value.level || blueprint.courseSummary.level || 'beginner',
      }));
      setMessage('AI course draft generated from your prompt and source document. Review and edit the blueprint before saving.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  function startManualDraft() {
    const blueprint = normalizeBlueprint(buildManualBlueprint(form.title || prompt || 'New short course', form));
    setBlueprintText(JSON.stringify(blueprint, null, 2));
    setMessage('Manual draft created. Edit the JSON blueprint, preview it, then save it for review.');
  }

  async function saveDraft() {
    if (!parsedBlueprint) {
      setError('The course blueprint is not valid JSON.');
      return;
    }
    if (!validation.ready) {
      setError(`Fix before saving: ${validation.issues.join(' ')}`);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const cleanId = slugify(form.title || parsedBlueprint.courseSummary.title || `short-course-${Date.now()}`);
      const lessons = flattenLessons(parsedBlueprint);
      await createShortCourseDraftWithBlueprint({
        course: {
          id: cleanId,
          title: form.title || parsedBlueprint.courseSummary.title,
          description: form.description || parsedBlueprint.courseSummary.description,
          schoolId: form.schoolId,
          imageId: 'short-course',
          pricingType: Number(form.price) > 0 ? 'paid' : 'free',
          price: Number(form.price),
          currency: form.currency,
          certificateFee: Number(form.certificateFee),
          certificateCurrency: form.certificateCurrency,
          durationHours: Number(form.durationHours || parsedBlueprint.courseSummary.totalDurationHours || 1),
          level: form.level || parsedBlueprint.courseSummary.level || 'beginner',
          status: 'draft',
          modules: parsedBlueprint.modules.map((module) => ({ title: module.title, description: module.description })),
          lessons,
          outcomes: parsedBlueprint.courseSummary.outcomes ?? [],
        } as any,
        blueprint: parsedBlueprint as any,
        sourceMode: sourceDocumentText ? 'document' as any : 'new',
        programmeTitle: null,
        programmeCourseTitle: sourceDocumentName || null,
      });
      const nextCourses = await getCourses();
      setCourses(nextCourses);
      setMessage('Draft saved. Go to Review & Publish to submit it for human review, approve it, then publish.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading launch builder..." />;

  return (
    <div className="space-y-6">
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-xl border bg-muted/40 p-4 text-sm">{message}</div> : null}

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader><CardTitle>Launch rule: draft first, review before publish</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This builder cannot publish directly. It creates draft courses only. Use Review & Publish after human checking.
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Course setup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Course idea / AI prompt">
              <Textarea rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Create a 19-hour beginner algebra course from the attached notes, with math cards and checkpoint questions." />
            </Field>
            <Field label="Attach source document">
              <Input type="file" accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.doc,.docx" onChange={readDocument} disabled={readingDocument} />
            </Field>
            <Field label={sourceDocumentName ? `Source content: ${sourceDocumentName}` : 'Source content / pasted notes'}>
              <Textarea rows={6} value={sourceDocumentText} onChange={(event) => setSourceDocumentText(event.target.value)} placeholder="Paste notes here, or upload a readable text document. AI will use this together with the prompt." />
            </Field>
            <Field label="Title"><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></Field>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field>
            <Field label="School / Faculty">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
              <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
              <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
              <Field label="Hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
            </div>
            <div className="grid gap-2">
              <Button type="button" onClick={generateCourse} disabled={generating || readingDocument}>{generating ? 'Generating...' : 'Generate with AI'}</Button>
              <Button type="button" variant="outline" onClick={startManualDraft}>Start manual draft</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Reviewable blueprint</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea className="font-mono text-xs" rows={28} value={blueprintText} onChange={(event) => setBlueprintText(event.target.value)} placeholder="AI or manual blueprint JSON will appear here." />
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-semibold">Validation</p>
              {validation.ready ? <p className="text-green-600">Ready to save as draft.</p> : validation.issues.map((issue) => <p key={issue} className="text-muted-foreground">• {issue}</p>)}
            </div>
            <Button className="w-full" type="button" onClick={saveDraft} disabled={saving || !validation.ready}>{saving ? 'Saving draft...' : 'Save draft for review'}</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Student preview</CardTitle></CardHeader>
            <CardContent>
              {previewLesson ? (
                <LessonPlayer lesson={lessonPreview(previewLesson)} courseTitle={form.title || parsedBlueprint?.courseSummary.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" />
              ) : (
                <p className="text-sm text-muted-foreground">Generate or paste a valid blueprint to preview the first lesson.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Existing drafts and courses</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {courses.slice(0, 8).map((course) => <div key={course.id} className="rounded-lg border p-3"><p className="font-medium">{course.title}</p><p className="text-muted-foreground">{course.status ?? 'draft'} · {course.level ?? 'beginner'} · {course.durationHours ?? 0}h</p></div>)}
              {!courses.length ? <p className="text-muted-foreground">No short courses yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function cleanJson(raw: string) {
  return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`;
}

function normalizeBlueprint(blueprint: CourseBuilderBlueprint): CourseBuilderBlueprint {
  return {
    courseSummary: {
      title: blueprint.courseSummary?.title || 'Untitled short course',
      audience: blueprint.courseSummary?.audience || 'General learners',
      level: blueprint.courseSummary?.level || 'beginner',
      description: blueprint.courseSummary?.description || 'Short course draft.',
      prerequisites: blueprint.courseSummary?.prerequisites ?? [],
      totalDurationHours: Number(blueprint.courseSummary?.totalDurationHours || 1),
      outcomes: blueprint.courseSummary?.outcomes?.length ? blueprint.courseSummary.outcomes : ['Learning outcome'],
      finalAssessment: blueprint.courseSummary?.finalAssessment || 'Final review.',
      certificateCriteria: blueprint.courseSummary?.certificateCriteria || 'Complete all lessons and pass required assessment.',
    },
    assessments: blueprint.assessments ?? { quizzes: [], practicalWork: [], instructorReviewChecklist: [] },
    modules: (blueprint.modules ?? []).map((module, moduleIndex) => ({
      title: module.title || `Module ${moduleIndex + 1}`,
      description: module.description || 'Module description.',
      durationMinutes: Number(module.durationMinutes || 60),
      outcomes: module.outcomes ?? [],
      moduleAssessment: module.moduleAssessment || 'Module check.',
      lessons: (module.lessons ?? []).map((lesson, lessonIndex) => normalizeLesson(lesson, lessonIndex)),
    })),
  };
}

function normalizeLesson(lesson: CourseBuilderLesson, index = 0): CourseBuilderLesson {
  return {
    title: lesson.title || `Lesson ${index + 1}`,
    summary: lesson.summary || 'Lesson summary.',
    durationMinutes: Number(lesson.durationMinutes || 20),
    difficulty: lesson.difficulty || 'beginner',
    outcomes: lesson.outcomes ?? [],
    blocks: (lesson.blocks?.length ? lesson.blocks : fallbackBlocks()).map(normalizeCard),
    subLessons: (lesson.subLessons ?? []).map((sub, subIndex) => normalizeLesson(sub, subIndex)),
    activities: lesson.activities ?? [],
    assessment: lesson.assessment || 'Lesson check.',
  };
}

function normalizeCard(card: LessonCardBlock): LessonCardBlock {
  const raw = card as AnyCard;
  const type = normalizeCardType(raw.type);

  if (type === 'question') return { type: 'question', title: raw.title, question: raw.question || 'Question?', visual: normalizeVisual(raw.visual), options: raw.options?.length ? raw.options : ['A', 'B', 'C', 'D'], correctAnswer: raw.correctAnswer || 'A', explanation: raw.explanation || 'Explanation.' } as any;
  if (type === 'fill_blank') return { type: 'fill_blank', title: raw.title, text: raw.text || 'Fill in ____', visual: normalizeVisual(raw.visual), correctAnswer: raw.correctAnswer || 'answer', explanation: raw.explanation || 'Explanation.' } as any;
  if (type === 'true_false') return { type: 'true_false', title: raw.title, statement: raw.statement || 'This is true.', visual: normalizeVisual(raw.visual), correctAnswer: Boolean(raw.correctAnswer ?? true), explanation: raw.explanation || 'Explanation.' } as any;
  if (type === 'example') return { type: 'example', title: raw.title || 'Example', body: raw.body || 'Example body.', code: raw.code || '' } as any;
  if (type === 'equation') return { type: 'equation', title: raw.title || 'Equation', body: raw.body || '', equation: raw.equation || raw.formula || 'x^2', explanation: raw.explanation || '' } as any;
  if (type === 'graph') return normalizeVisual({ ...raw, type: 'graph' }) as any;
  if (type === 'table') return normalizeVisual({ ...raw, type: 'table' }) as any;
  if (type === 'number_line') return normalizeVisual({ ...raw, type: 'number_line' }) as any;
  if (type === 'matrix') return normalizeVisual({ ...raw, type: 'matrix' }) as any;
  if (type === 'formula_sheet') return normalizeVisual({ ...raw, type: 'formula_sheet' }) as any;
  if (type === 'geometry') return normalizeVisual({ ...raw, type: 'geometry' }) as any;
  if (type === 'summary') return { type: 'summary', title: raw.title || 'Summary', body: raw.body || 'Summary.' } as any;
  return { type: 'explanation', title: raw.title || 'Core idea', body: raw.body || 'Explanation.', steps: normalizeSteps(raw.steps) } as any;
}

function normalizeCardType(type: unknown) {
  const value = String(type || 'explanation');
  if (['visual_question', 'graph_question', 'geometry_question', 'table_question', 'number_line_question', 'mcq', 'checkpoint', 'multiple_choice'].includes(value)) return 'question';
  if (value === 'fill-in-the-blank') return 'fill_blank';
  if (value === 'truefalse') return 'true_false';
  if (value === 'chart' || value === 'plot') return 'graph';
  if (value === 'formula') return 'equation';
  return value;
}

function normalizeVisual(visual: unknown): AnyCard | undefined {
  if (!visual || typeof visual !== 'object') return undefined;
  const raw = visual as AnyCard;
  const type = normalizeCardType(raw.type);
  if (type === 'equation') return { type: 'equation', title: raw.title || 'Equation', body: raw.body || '', equation: raw.equation || raw.formula || 'x^2', explanation: raw.explanation || '' };
  if (type === 'graph') return { type: 'graph', title: raw.title || 'Graph', description: raw.description || '', graphType: raw.graphType || 'function', xLabel: raw.xLabel || 'x', yLabel: raw.yLabel || 'y', xMin: Number(raw.xMin ?? -10), xMax: Number(raw.xMax ?? 10), yMin: Number(raw.yMin ?? -10), yMax: Number(raw.yMax ?? 10), functions: Array.isArray(raw.functions) ? raw.functions : [], data: Array.isArray(raw.data) ? raw.data : [] };
  if (type === 'table') return { type: 'table', title: raw.title || 'Table', description: raw.description || '', columns: Array.isArray(raw.columns) ? raw.columns : [], rows: Array.isArray(raw.rows) ? raw.rows : [] };
  if (type === 'number_line') return { type: 'number_line', title: raw.title || 'Number line', description: raw.description || '', min: Number(raw.min ?? -10), max: Number(raw.max ?? 10), step: Number(raw.step ?? 1), points: Array.isArray(raw.points) ? raw.points : [], intervals: Array.isArray(raw.intervals) ? raw.intervals : [] };
  if (type === 'matrix') return { type: 'matrix', title: raw.title || 'Matrix', description: raw.description || '', matrix: Array.isArray(raw.matrix) ? raw.matrix : [[1, 0], [0, 1]] };
  if (type === 'formula_sheet') return { type: 'formula_sheet', title: raw.title || 'Formula sheet', formulas: Array.isArray(raw.formulas) ? raw.formulas : [] };
  if (type === 'geometry') return { type: 'geometry', title: raw.title || 'Diagram', description: raw.description || '', shape: raw.shape || 'triangle', labels: raw.labels || {}, values: raw.values || {} };
  return undefined;
}

function normalizeSteps(steps: unknown) {
  if (!Array.isArray(steps)) return undefined;
  return steps.map((step, index) => {
    const raw = typeof step === 'object' && step ? step as AnyCard : {};
    return { title: raw.title || `Step ${index + 1}`, explanation: raw.explanation || raw.body || '', visual: normalizeVisual(raw.visual) };
  });
}

function validateBlueprint(blueprint: CourseBuilderBlueprint | null) {
  const issues: string[] = [];
  if (!blueprint) issues.push('Blueprint must be valid JSON.');
  if (blueprint && !blueprint.courseSummary?.title) issues.push('Course title is required.');
  if (blueprint && !blueprint.modules?.length) issues.push('At least one module is required.');
  const lessons = blueprint ? flattenLessons(blueprint) : [];
  if (blueprint && !lessons.length) issues.push('At least one lesson is required.');
  for (const lesson of lessons) {
    if (!lesson.blocks?.length) issues.push(`${lesson.title} needs playable cards.`);
    for (const card of lesson.blocks ?? []) if (!allowedCardTypes.has(normalizeCardType((card as AnyCard).type))) issues.push(`${lesson.title} has unsupported card type ${(card as AnyCard).type}.`);
  }
  return { ready: issues.length === 0, issues };
}

function flattenLessons(blueprint: CourseBuilderBlueprint) {
  return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => {
    const parent = { ...lesson, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex, blocks: lesson.blocks?.length ? lesson.blocks : fallbackBlocks() };
    const children = (lesson.subLessons ?? []).map((subLesson, subIndex) => ({ ...subLesson, title: `${lesson.title}: ${subLesson.title}`, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1, blocks: subLesson.blocks?.length ? subLesson.blocks : fallbackBlocks() }));
    return [parent, ...children];
  }));
}

function fallbackBlocks(): LessonCardBlock[] {
  return [
    { type: 'explanation', title: 'Core idea', body: 'Explain one idea clearly.' },
    { type: 'example', title: 'Example', body: 'Show one practical example.' },
    { type: 'question', question: 'What should learners do after a new idea?', options: ['Ignore it', 'Practice with an example', 'Skip feedback', 'Memorize blindly'], correctAnswer: 'Practice with an example', explanation: 'Practice helps turn information into skill.' },
    { type: 'summary', body: 'Summarize the lesson.' },
  ];
}

function lessonPreview(lesson: CourseBuilderLesson) {
  return {
    id: 'preview',
    title: lesson.title,
    content: lesson.summary,
    learningObjects: [{ id: 'preview-object', type: 'content', title: lesson.title, payload: { blocks: lesson.blocks }, version: 1, isCurrent: true, isReusable: false, reviewStatus: 'draft', publicationStatus: 'draft' }],
  } as any;
}

function buildManualBlueprint(title: string, form: FormState): CourseBuilderBlueprint {
  return normalizeBlueprint({
    courseSummary: { title, audience: 'General learners', level: form.level, description: form.description || 'Manual short-course draft.', prerequisites: [], totalDurationHours: Number(form.durationHours || 1), outcomes: ['Learning outcome'], finalAssessment: 'Final assessment.', certificateCriteria: 'Complete required lessons and assessment.' },
    assessments: { quizzes: [], practicalWork: [], instructorReviewChecklist: ['Review all cards', 'Confirm questions are correct'] },
    modules: [{ title: 'Module 1', description: 'Module description.', durationMinutes: 60, outcomes: ['Module outcome'], moduleAssessment: 'Module check.', lessons: [{ title: 'Lesson 1', summary: 'Lesson summary.', durationMinutes: 20, difficulty: form.level, outcomes: [], blocks: fallbackBlocks(), activities: [], assessment: 'Lesson check.' }] }],
  });
}

function buildLaunchPrompt(seed: string, form: FormState, sourceDocumentText: string, sourceDocumentName: string) {
  const sourceSection = sourceDocumentText.trim()
    ? `\n\nSOURCE DOCUMENT (${sourceDocumentName || 'pasted notes'}):\n${sourceDocumentText.slice(0, 60000)}\n\nUse the source document as the primary academic material. Do not merely summarize it; transform it into an interactive short course with modules, lessons, worked examples and checkpoint questions. For mathematics, output clean math-friendly text: use exponents like 2^2 or LaTeX like $x^2$, roots like sqrt(25) or \\sqrt{25}, and fractions like \\frac{a}{b}.`
    : '';

  return `Create a launch-ready UnivAI Institute short course in strict JSON only. No markdown. No videos.
Course request: ${seed}
Title: ${form.title || 'create suitable title'}
Description: ${form.description || 'create suitable description'}
Level: ${form.level}
Duration hours: ${form.durationHours}${sourceSection}

Rules:
- Build modules and lessons with SoloLearn-style cards.
- Allowed card types: explanation, example, equation, graph, table, number_line, matrix, formula_sheet, geometry, question, fill_blank, true_false, summary.
- AI decides card count based on difficulty and topic size.
- Add questions between teaching cards.
- If math, physics, statistics, engineering, accounting, economics, or graph-based reasoning is involved, generate visual teaching cards where helpful.
- Questions may include a "visual" object containing one visual card, such as graph, geometry, table, number_line, equation, matrix, or formula_sheet.
- Explanation cards may include a "steps" array. Each step can include title, explanation, and visual.
- Use step-by-step explanation cards for plotting graphs, solving equations, geometry construction, statistics interpretation, and matrix operations.
- For graph plotting lessons, show a progression such as table of values -> plotted points -> final graph.
- For graph cards use: {"type":"graph","graphType":"function" | "line" | "bar" | "scatter" | "pie","xMin":-10,"xMax":10,"yMin":-10,"yMax":10,"functions":[{"expression":"x^2","label":"y = x^2"}],"data":[{"x":0,"y":0}]}.
- For visual questions use: {"type":"question","question":"Which point lies on the graph?","visual":{"type":"graph","graphType":"function","functions":[{"expression":"x^2","label":"y = x^2"}]},"options":["(1,2)","(2,4)","(3,6)","(4,8)"],"correctAnswer":"(2,4)","explanation":"When x = 2, y = 4."}.
- For step-by-step explanations use: {"type":"explanation","title":"How to plot y = x + 1","body":"We will plot the graph step by step.","steps":[{"title":"Step 1","explanation":"Create a table of values.","visual":{"type":"table","columns":["x","y"],"rows":[[0,1],[1,2],[2,3]]}},{"title":"Step 2","explanation":"Plot the points.","visual":{"type":"graph","graphType":"scatter","data":[{"x":0,"y":1},{"x":1,"y":2},{"x":2,"y":3}]}}]}.
- Avoid fake accreditation, job guarantees, fees, official dates, or unsupported claims.
- Return only JSON shaped as: {"courseSummary":{"title":"","audience":"","level":"","description":"","prerequisites":[],"totalDurationHours":0,"outcomes":[],"finalAssessment":"","certificateCriteria":""},"assessments":{"quizzes":[],"practicalWork":[],"instructorReviewChecklist":[]},"modules":[{"title":"","description":"","durationMinutes":0,"outcomes":[],"moduleAssessment":"","lessons":[{"title":"","summary":"","durationMinutes":0,"difficulty":"","outcomes":[],"blocks":[],"subLessons":[],"activities":[],"assessment":""}]}]}`;
}
