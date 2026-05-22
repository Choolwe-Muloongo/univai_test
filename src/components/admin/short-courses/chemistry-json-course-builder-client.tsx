'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Beaker, CheckCircle2, Clipboard, Copy, FileJson, FlaskConical, Plus, Save, Sparkles, Upload } from 'lucide-react';

import { cloneChemistryVisual, chemistryTemplatePreviews } from '@/components/learning/blocks/chemistry/defaults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getSchools } from '@/lib/api';
import type { School } from '@/lib/api/types';

type JsonCard = Record<string, unknown>;
type JsonQuestion = { id: string; type: string; difficulty: string; question: string; options?: string[]; answer: string; explanation?: string; chemistryVisual?: unknown; visual?: unknown; diagram?: unknown };
type JsonLesson = { id: string; title: string; summary: string; outcomes: string[]; cards: JsonCard[]; subLessons: JsonLesson[] };
type JsonModule = { id: string; title: string; description: string; outcomes: string[]; lessons: JsonLesson[] };
type JsonCourse = { title: string; description: string; schoolId: string; level: string; durationHours: number; entryFee: number; currency: string; certificateFee: number; audience: string; prerequisites: string[]; outcomes: string[] };
type JsonBlueprint = { course: JsonCourse; modules: JsonModule[]; questions: JsonQuestion[] };

type SaveStatus = 'draft' | 'published';
type Target = 'lesson' | 'subLesson' | 'question';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function makeLesson(index: number, title = `Lesson ${index + 1}`): JsonLesson {
  return { id: uid('lesson'), title, summary: 'Describe this chemistry lesson.', outcomes: ['Understand the chemistry concept.'], cards: [], subLessons: [] };
}

function makeModule(index: number): JsonModule {
  return { id: uid('module'), title: `Module ${index + 1}`, description: 'Describe this chemistry module.', outcomes: ['Complete this chemistry stage.'], lessons: [makeLesson(0)] };
}

function chemistryCard(template: string): JsonCard {
  const visual = cloneChemistryVisual(template);
  return {
    type: 'chemistry_visual',
    title: visual.title ?? 'Chemistry activity',
    body: visual.body ?? 'Use the structured chemistry activity to learn and practise.',
    chemistryTemplate: template,
    chemistryCardType: `${template}_card`,
    visual,
    required: true,
  };
}

function chemistryQuestion(template: string): JsonQuestion {
  const visual = cloneChemistryVisual(template);
  const firstInteraction = visual.interactions?.[0];
  const prompt = firstInteraction?.prompt || visual.title || 'Answer the chemistry question.';
  return {
    id: uid('question'),
    type: 'mcq',
    difficulty: visual.level === 'a_level' || visual.level === 'first_year_university' ? 'hard' : 'medium',
    question: prompt,
    options: ['A', 'B', 'C', 'D'],
    answer: 'A',
    explanation: visual.body ?? 'Use the chemistry visual and steps to reason through the answer.',
    chemistryVisual: visual,
  };
}

const starterBlueprint: JsonBlueprint = {
  course: {
    title: 'Interactive Chemistry Course',
    description: 'A chemistry course built from structured visual JSON: equations, particles, calculations, reactions, tables, and practice interactions.',
    schoolId: '',
    level: 'beginner',
    durationHours: 12,
    entryFee: 0,
    currency: 'ZMW',
    certificateFee: 0,
    audience: 'Chemistry learners who need interactive explanations and practice.',
    prerequisites: ['Basic science vocabulary', 'Basic arithmetic'],
    outcomes: ['Balance chemical equations', 'Interpret molecular structure', 'Use mole ratios', 'Analyse reactions and observations'],
  },
  modules: [
    {
      ...makeModule(0),
      title: 'Foundations of Chemical Thinking',
      description: 'Equations, atoms, molecules, reactions, and laboratory reasoning.',
      lessons: [
        {
          ...makeLesson(0, 'Balancing chemical equations'),
          cards: [chemistryCard('equation_balancer')],
        },
      ],
    },
  ],
  questions: [chemistryQuestion('equation_balancer')],
};

export function ChemistryJsonCourseBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [blueprint, setBlueprint] = useState<JsonBlueprint>(starterBlueprint);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [subLessonIndex, setSubLessonIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<Target>('lesson');
  const [status, setStatus] = useState<SaveStatus>('draft');
  const [editor, setEditor] = useState(pretty(starterBlueprint));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSchools().then((items) => {
      setSchools(items);
      if (items[0]) setBlueprint((current) => ({ ...current, course: { ...current.course, schoolId: current.course.schoolId || items[0].id } }));
    }).catch(() => setSchools([]));
  }, []);

  useEffect(() => setEditor(pretty(blueprint)), [blueprint]);

  const activeModule = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  const activeLesson = activeModule?.lessons[lessonIndex] ?? activeModule?.lessons[0];
  const activeSubLesson = subLessonIndex === null ? null : activeLesson?.subLessons[subLessonIndex] ?? null;
  const validation = useMemo(() => validateBlueprint(blueprint), [blueprint]);

  function updateCourse(patch: Partial<JsonCourse>) {
    setBlueprint((current) => ({ ...current, course: { ...current.course, ...patch } }));
  }

  function addModule() {
    setBlueprint((current) => ({ ...current, modules: [...current.modules, makeModule(current.modules.length)] }));
    setModuleIndex(blueprint.modules.length);
    setLessonIndex(0);
    setSubLessonIndex(null);
  }

  function addLesson() {
    if (!activeModule) return;
    setBlueprint((current) => ({ ...current, modules: current.modules.map((module, index) => index === moduleIndex ? { ...module, lessons: [...module.lessons, makeLesson(module.lessons.length)] } : module) }));
    setLessonIndex(activeModule.lessons.length);
    setSubLessonIndex(null);
  }

  function addSubLesson() {
    if (!activeLesson) return;
    const next = makeLesson(activeLesson.subLessons.length, `Sub-lesson ${activeLesson.subLessons.length + 1}`);
    setBlueprint((current) => ({ ...current, modules: current.modules.map((module, modulePosition) => modulePosition === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, lessonPosition) => lessonPosition === lessonIndex ? { ...lesson, subLessons: [...lesson.subLessons, next] } : lesson) } : module) }));
    setSubLessonIndex(activeLesson.subLessons.length);
    setTarget('subLesson');
  }

  function addChemistryTemplate(template: string) {
    if (target === 'question') {
      setBlueprint((current) => ({ ...current, questions: [...current.questions, chemistryQuestion(template)] }));
      setMessage('Chemistry practice question added.');
      return;
    }

    const nextCard = chemistryCard(template);
    setBlueprint((current) => ({
      ...current,
      modules: current.modules.map((module, modulePosition) => modulePosition === moduleIndex ? {
        ...module,
        lessons: module.lessons.map((lesson, lessonPosition) => {
          if (lessonPosition !== lessonIndex) return lesson;
          if (target === 'subLesson' && subLessonIndex !== null) {
            return { ...lesson, subLessons: lesson.subLessons.map((sub, subPosition) => subPosition === subLessonIndex ? { ...sub, cards: [...sub.cards, nextCard] } : sub) };
          }
          return { ...lesson, cards: [...lesson.cards, nextCard] };
        }),
      } : module),
    }));
    setMessage('Chemistry visual card added.');
  }

  function applyFullJson() {
    try {
      const parsed = JSON.parse(editor) as JsonBlueprint;
      if (!parsed.course || !Array.isArray(parsed.modules)) throw new Error('JSON must include course and modules.');
      setBlueprint({ ...parsed, questions: Array.isArray(parsed.questions) ? parsed.questions : [] });
      setError(null);
      setMessage('Full JSON applied.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid JSON.');
    }
  }

  function formatJson() {
    try { setEditor(pretty(JSON.parse(editor))); setError(null); } catch { setError('Cannot format invalid JSON.'); }
  }

  function copyJson() {
    void navigator.clipboard?.writeText(pretty(blueprint));
    setMessage('Full Chemistry course JSON copied.');
  }

  async function uploadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as JsonBlueprint;
      if (!parsed.course || !Array.isArray(parsed.modules)) throw new Error('JSON must include course and modules.');
      setBlueprint({ ...parsed, questions: Array.isArray(parsed.questions) ? parsed.questions : [] });
      setMessage(`${file.name} imported.`);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import JSON file.');
    }
  }

  async function saveCourse(nextStatus: SaveStatus = status) {
    if (validation.errors.length) return setError('Fix validation errors before saving.');
    setSaving(true);
    setError(null);
    try {
      await createShortCourseDraftWithBlueprint(toDraftPayload(blueprint, nextStatus) as never);
      setStatus(nextStatus);
      setMessage(nextStatus === 'published' ? 'Chemistry course published.' : 'Chemistry draft saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save Chemistry course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Beaker className="h-5 w-5 text-primary" /> Chemistry JSON Builder Studio</CardTitle>
          <CardDescription>Build Chemistry courses through buttons, then edit the generated JSON when you need full control.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {message ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle>Course basics</CardTitle><CardDescription>Fast fields for the generated JSON.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Title"><Input value={blueprint.course.title} onChange={(event) => updateCourse({ title: event.target.value })} /></Field>
              <Field label="Description"><Textarea rows={4} value={blueprint.course.description} onChange={(event) => updateCourse({ description: event.target.value })} /></Field>
              <Field label="School"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={blueprint.course.schoolId} onChange={(event) => updateCourse({ schoolId: event.target.value })}><option value="">Select school</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Level"><Input value={blueprint.course.level} onChange={(event) => updateCourse({ level: event.target.value })} /></Field><Field label="Hours"><Input type="number" value={blueprint.course.durationHours} onChange={(event) => updateCourse({ durationHours: Number(event.target.value) || 1 })} /></Field></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle>Structure</CardTitle><CardDescription>Add modules, lessons, and sub-lessons.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline" onClick={addModule}><Plus className="mr-2 h-4 w-4" />Add module</Button>
              <div className="space-y-2">{blueprint.modules.map((module, index) => <button key={module.id} onClick={() => { setModuleIndex(index); setLessonIndex(0); setSubLessonIndex(null); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === moduleIndex ? 'border-primary bg-primary/10' : ''}`}><b>{module.title}</b><span className="block text-xs text-muted-foreground">{module.lessons.length} lesson(s)</span></button>)}</div>
              <Button className="w-full" variant="outline" onClick={addLesson}><Plus className="mr-2 h-4 w-4" />Add lesson</Button>
              <div className="space-y-2">{activeModule?.lessons.map((lesson, index) => <button key={lesson.id} onClick={() => { setLessonIndex(index); setSubLessonIndex(null); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === lessonIndex && subLessonIndex === null ? 'border-primary bg-primary/10' : ''}`}><b>{lesson.title}</b><span className="block text-xs text-muted-foreground">{lesson.cards.length} cards · {lesson.subLessons.length} sub</span></button>)}</div>
              <Button className="w-full" variant="outline" onClick={addSubLesson}><Plus className="mr-2 h-4 w-4" />Add sub-lesson</Button>
              <div className="space-y-2">{activeLesson?.subLessons.map((lesson, index) => <button key={lesson.id} onClick={() => { setSubLessonIndex(index); setTarget('subLesson'); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === subLessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>↳ {lesson.title}</b><span className="block text-xs text-muted-foreground">{lesson.cards.length} cards</span></button>)}</div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" /> Chemistry templates</CardTitle><CardDescription>Click once to insert a complete structured Chemistry visual card or Practice Arena question.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2"><Button variant={target === 'lesson' ? 'default' : 'outline'} onClick={() => setTarget('lesson')}>Main lesson</Button><Button variant={target === 'subLesson' ? 'default' : 'outline'} disabled={!activeSubLesson} onClick={() => setTarget('subLesson')}>Active sub-lesson</Button><Button variant={target === 'question' ? 'default' : 'outline'} onClick={() => setTarget('question')}>Practice Arena question</Button></div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{chemistryTemplatePreviews.map((item) => <Button key={item.id} type="button" variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => addChemistryTemplate(item.id)}><Sparkles className="mr-2 h-4 w-4 shrink-0" />{item.title}</Button>)}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /> Full course JSON</CardTitle><CardDescription>Edit everything here: modules, lessons, cards, questions, and Chemistry visuals.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={editor} onChange={(event) => setEditor(event.target.value)} rows={22} spellCheck={false} className="min-h-[480px] font-mono text-xs md:text-sm" />
              <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={applyFullJson}><CheckCircle2 className="mr-2 h-4 w-4" />Apply JSON</Button><Button variant="outline" onClick={formatJson}><Clipboard className="mr-2 h-4 w-4" />Format</Button><Button variant="outline" onClick={copyJson}><Copy className="mr-2 h-4 w-4" />Copy</Button><label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"><Upload className="mr-2 h-4 w-4" />Import<input type="file" accept="application/json,.json" className="sr-only" onChange={uploadJson} /></label></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle>Save / publish</CardTitle><CardDescription>{validation.errors.length ? 'Fix validation errors first.' : 'Ready to save.'}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {validation.errors.map((item) => <div key={item} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{item}</div>)}
              {validation.warnings.map((item) => <div key={item} className="rounded-2xl border bg-muted/40 p-3 text-sm">{item}</div>)}
              <Field label="Save status"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as SaveStatus)}><option value="draft">Draft / unpublished</option><option value="published">Published</option></select></Field>
              <div className="flex flex-col gap-2 sm:flex-row"><Button disabled={saving || validation.errors.length > 0} onClick={() => saveCourse('draft')}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save draft'}</Button><Button disabled={saving || validation.errors.length > 0} variant="outline" onClick={() => saveCourse('published')}>Publish now</Button></div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function pretty(value: unknown) { return JSON.stringify(value, null, 2); }

function validateBlueprint(blueprint: JsonBlueprint) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!blueprint.course.title.trim()) errors.push('Course title is required.');
  if (!blueprint.course.schoolId.trim()) warnings.push('School is not selected. Saving may fail if the backend requires schoolId.');
  if (!blueprint.modules.length) errors.push('At least one module is required.');
  blueprint.modules.forEach((module, modulePosition) => {
    if (!module.title.trim()) errors.push(`Module ${modulePosition + 1} needs a title.`);
    if (!module.lessons.length) errors.push(`Module ${modulePosition + 1} needs at least one lesson.`);
    module.lessons.forEach((lesson, lessonPosition) => {
      if (!lesson.title.trim()) errors.push(`Module ${modulePosition + 1}, lesson ${lessonPosition + 1} needs a title.`);
      if (!lesson.cards.length && !lesson.subLessons.some((sub) => sub.cards.length)) warnings.push(`Module ${modulePosition + 1}, lesson ${lessonPosition + 1} has no cards yet.`);
    });
  });
  return { errors, warnings };
}

function flattenLessons(blueprint: JsonBlueprint) {
  return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => {
    const parent = { title: lesson.title, summary: lesson.summary, content: lesson.summary, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex, blocks: lesson.cards };
    const children = lesson.subLessons.map((subLesson, subIndex) => ({ title: `${lesson.title}: ${subLesson.title}`, summary: subLesson.summary, content: subLesson.summary, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1, blocks: subLesson.cards }));
    return [parent, ...children];
  }));
}

function toDraftPayload(blueprint: JsonBlueprint, status: SaveStatus) {
  const course = blueprint.course;
  return {
    sourceMode: 'new',
    course: {
      id: `chemistry-json-${Date.now()}`,
      title: course.title,
      description: course.description,
      schoolId: course.schoolId,
      imageId: 'chemistry-json-course',
      status,
      level: course.level,
      durationHours: course.durationHours,
      price: String(course.entryFee ?? 0),
      currency: course.currency || 'ZMW',
      certificateFee: String(course.certificateFee ?? 0),
      certificateCurrency: course.currency || 'ZMW',
      modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description })),
      lessons: flattenLessons(blueprint),
      outcomes: course.outcomes,
    },
    blueprint: {
      courseSummary: { title: course.title, audience: course.audience, level: course.level, description: course.description, prerequisites: course.prerequisites, totalDurationHours: course.durationHours, outcomes: course.outcomes, finalAssessment: 'Complete Chemistry practice and final assessment.', certificateCriteria: 'Complete lessons and pass the Chemistry assessment.' },
      assessments: { quizzes: blueprint.questions.map((question) => question.question), practicalWork: [], instructorReviewChecklist: ['Check chemistry equations.', 'Check coefficients and units.', 'Check lab observations.', 'Check final assessment.'] },
      modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description, durationMinutes: Math.max(30, Math.round((course.durationHours * 60) / Math.max(1, blueprint.modules.length))), outcomes: module.outcomes, moduleAssessment: 'Complete all Chemistry activities in this module.', lessons: module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: 30, outcomes: lesson.outcomes, activities: [`Cards JSON: ${JSON.stringify(lesson.cards)}`], assessment: 'Complete practice checks.', blocks: lesson.cards, subLessons: lesson.subLessons.map((subLesson) => ({ title: subLesson.title, summary: subLesson.summary, durationMinutes: 20, outcomes: subLesson.outcomes, blocks: subLesson.cards, activities: [], assessment: 'Complete side mission.' })) })) })),
    },
  };
}
