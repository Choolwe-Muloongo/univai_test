'use client';

import { ChangeEvent, type ReactNode, useEffect, useMemo, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getCourses, getSchools } from '@/lib/api';
import { generateShortCourseContent } from '@/lib/api/short-course-generation';
import type { CourseBuilderBlueprint } from '@/lib/api/course-builder-types';
import type { Course, School } from '@/lib/api/types';
import { extractDocumentText, type DocumentExtractionProgress } from '@/lib/document-text-extractor';

type SourceDoc = { name: string; mode: string; text: string; warning?: string };
type BuilderStep = 'start' | 'lessons' | 'cards' | 'preview';
type CardType = 'explanation' | 'example' | 'question' | 'fill_blank' | 'true_false' | 'summary' | 'equation';

type LessonCard = {
  type: CardType;
  title: string;
  body?: string;
  question?: string;
  options?: string[];
  correctAnswer?: string | boolean;
  explanation?: string;
  text?: string;
  statement?: string;
  equation?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
};

type VisualLesson = {
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: string;
  outcomes: string[];
  cards: LessonCard[];
  activities: string[];
  assessment: string;
};

type VisualModule = {
  title: string;
  description: string;
  durationMinutes: number;
  outcomes: string[];
  moduleAssessment: string;
  lessons: VisualLesson[];
};

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

const CARD_TYPES: Array<{ type: CardType; label: string; help: string }> = [
  { type: 'explanation', label: 'Teach', help: 'Explain a concept' },
  { type: 'example', label: 'Example', help: 'Show how it works' },
  { type: 'question', label: 'MCQ', help: 'Multiple-choice check' },
  { type: 'fill_blank', label: 'Blank', help: 'Fill-in answer' },
  { type: 'true_false', label: 'True/False', help: 'Quick judgement' },
  { type: 'equation', label: 'Math', help: 'Formula or equation' },
  { type: 'summary', label: 'Summary', help: 'Wrap up' },
];

const defaultLesson = (position = 1): VisualLesson => ({
  title: `Lesson ${position}`,
  summary: 'Introduce the concept clearly and practically.',
  durationMinutes: 20,
  difficulty: 'beginner',
  outcomes: ['Understand the main concept.'],
  cards: [
    { type: 'explanation', title: 'Core idea', body: 'Explain the main idea in simple words.' },
    { type: 'example', title: 'Example', body: 'Show one practical example.' },
    { type: 'question', title: 'Quick check', question: 'What should learners do after learning a new idea?', options: ['Ignore it', 'Practise with an example', 'Skip feedback', 'Memorize blindly'], correctAnswer: 'Practise with an example', explanation: 'Practice helps turn information into skill.' },
    { type: 'summary', title: 'Summary', body: 'Summarize the lesson.' },
  ],
  activities: [],
  assessment: 'Complete the lesson checks.',
});

const defaultModule = (position = 1): VisualModule => ({
  title: `Module ${position}`,
  description: 'Describe what this module teaches and why it matters.',
  durationMinutes: 60,
  outcomes: ['Complete the module lessons successfully.'],
  moduleAssessment: 'Complete the module practice activities.',
  lessons: [defaultLesson(1)],
});

export function VisualManualCourseBuilderClient() {
  const [step, setStep] = useState<BuilderStep>('start');
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<DocumentExtractionProgress | null>(null);
  const [prompt, setPrompt] = useState('');
  const [documents, setDocuments] = useState<SourceDoc[]>([]);
  const [modules, setModules] = useState<VisualModule[]>([defaultModule(1)]);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ title: '', description: '', schoolId: '', price: '0', currency: 'ZMW', certificateFee: '0', certificateCurrency: 'ZMW', durationHours: '8', level: 'beginner' });

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        if (schoolData[0]) setForm((value) => ({ ...value, schoolId: schoolData[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load course builder data.'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const activeModule = modules[moduleIndex] ?? modules[0];
  const activeLesson = activeModule.lessons[lessonIndex] ?? activeModule.lessons[0];
  const activeCard = activeLesson.cards[cardIndex] ?? activeLesson.cards[0];
  const sourceText = useMemo(() => documents.map((doc, index) => `DOCUMENT ${index + 1}: ${doc.name}\n${doc.text}`).join('\n\n---\n\n').slice(0, 180000), [documents]);
  const blueprint = useMemo(() => buildBlueprint(form, modules), [form, modules]);
  const completion = useMemo(() => computeCompletion(form, modules), [form, modules]);

  async function readDocuments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setReading(true); setError(null); setMessage(null); setProgress(null);
    try {
      const extracted: SourceDoc[] = [];
      for (const file of files) {
        const result = await extractDocumentText(file, { onProgress: setProgress });
        extracted.push({ name: file.name, mode: result.mode, text: result.text.slice(0, 60000), warning: result.warning });
      }
      setDocuments((current) => [...current, ...extracted]);
      setMessage(`${extracted.length} document(s) loaded.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read documents.');
    } finally {
      setReading(false); setProgress(null); event.target.value = '';
    }
  }

  function selectModule(index: number) {
    setModuleIndex(index);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function updateModule(patch: Partial<VisualModule>) {
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, ...patch } : module));
  }

  function addModule() {
    const nextIndex = modules.length;
    setModules((current) => [...current, defaultModule(current.length + 1)]);
    setModuleIndex(nextIndex);
    setLessonIndex(0);
    setCardIndex(0);
    setStep('lessons');
  }

  function removeModule() {
    if (modules.length <= 1) return;
    const nextIndex = Math.max(0, moduleIndex - 1);
    setModules((current) => current.filter((_, index) => index !== moduleIndex));
    setModuleIndex(nextIndex);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function moveModule(direction: -1 | 1) {
    const targetIndex = moduleIndex + direction;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    setModules((current) => moveItem(current, moduleIndex, targetIndex));
    setModuleIndex(targetIndex);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function updateLesson(patch: Partial<VisualLesson>) {
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, position) => position === lessonIndex ? { ...lesson, ...patch } : lesson) } : module));
  }

  function addLesson() {
    const nextLesson = defaultLesson(activeModule.lessons.length + 1);
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: [...module.lessons, nextLesson] } : module));
    setLessonIndex(activeModule.lessons.length);
    setCardIndex(0);
    setStep('lessons');
  }

  function removeLesson() {
    if (activeModule.lessons.length <= 1) return;
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.filter((_, position) => position !== lessonIndex) } : module));
    setLessonIndex((value) => Math.max(0, value - 1));
    setCardIndex(0);
  }

  function moveLesson(direction: -1 | 1) {
    const targetIndex = lessonIndex + direction;
    if (targetIndex < 0 || targetIndex >= activeModule.lessons.length) return;
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: moveItem(module.lessons, lessonIndex, targetIndex) } : module));
    setLessonIndex(targetIndex);
    setCardIndex(0);
  }

  function moveLessonToModule(targetModuleIndex: number) {
    if (targetModuleIndex === moduleIndex || targetModuleIndex < 0 || targetModuleIndex >= modules.length) return;
    const lessonToMove = activeLesson;
    const targetLessonIndex = modules[targetModuleIndex].lessons.length;
    setModules((current) => current.map((module, index) => {
      if (index === moduleIndex) return { ...module, lessons: module.lessons.filter((_, position) => position !== lessonIndex) };
      if (index === targetModuleIndex) return { ...module, lessons: [...module.lessons, lessonToMove] };
      return module;
    }).map((module, index) => index === moduleIndex && module.lessons.length === 0 ? { ...module, lessons: [defaultLesson(1)] } : module));
    setModuleIndex(targetModuleIndex);
    setLessonIndex(targetLessonIndex);
    setCardIndex(0);
  }

  function updateCard(patch: Partial<LessonCard>) {
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, position) => position === lessonIndex ? { ...lesson, cards: lesson.cards.map((card, cardPosition) => cardPosition === cardIndex ? { ...card, ...patch } : card) } : lesson) } : module));
  }

  function addCard(type: CardType) {
    const card = cardByType(type);
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, position) => position === lessonIndex ? { ...lesson, cards: [...lesson.cards, card] } : lesson) } : module));
    setCardIndex(activeLesson.cards.length);
    setStep('cards');
  }

  function removeCard() {
    if (activeLesson.cards.length <= 1) return;
    setModules((current) => current.map((module, index) => index === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, position) => position === lessonIndex ? { ...lesson, cards: lesson.cards.filter((_, cardPosition) => cardPosition !== cardIndex) } : lesson) } : module));
    setCardIndex((value) => Math.max(0, value - 1));
  }

  async function generateFromAi() {
    const seed = prompt.trim() || form.title.trim() || 'Create a practical short course from the attached documents.';
    if (!seed && !sourceText) { setError('Add a course idea or upload documents first.'); return; }
    setGenerating(true); setError(null); setMessage(null);
    try {
      const response = await generateShortCourseContent({
        mode: 'general',
        feature: 'admin_short_course_visual_builder',
        audience: 'short-course learners',
        brandContext: 'UnivAI short courses use editable SoloLearn-style cards. Admins must review before publishing.',
        prompt: buildAiPrompt(seed, form, sourceText, documents.map((doc) => doc.name)),
      });
      const raw = String(response.text || response.output || response.content || JSON.stringify(response));
      const parsed = normalizeAiBlueprint(JSON.parse(cleanJson(raw)) as CourseBuilderBlueprint);
      setModules(parsed.modules.length ? parsed.modules.map((module, index) => ({
        title: module.title || `Module ${index + 1}`,
        description: module.description || 'Course module.',
        durationMinutes: module.durationMinutes || module.lessons.reduce((total, lesson) => total + Number(lesson.durationMinutes || 0), 0) || 60,
        outcomes: module.outcomes || [],
        moduleAssessment: module.moduleAssessment || 'Module practice.',
        lessons: module.lessons.length ? module.lessons.map((lesson, lessonPosition) => ({
          title: lesson.title || `Lesson ${lessonPosition + 1}`,
          summary: lesson.summary || 'Lesson summary.',
          durationMinutes: lesson.durationMinutes || 20,
          difficulty: lesson.difficulty || parsed.courseSummary.level || 'beginner',
          outcomes: lesson.outcomes || [],
          cards: (lesson.blocks?.length ? lesson.blocks : [cardByType('explanation') as any]).map(cardFromBlock),
          activities: lesson.activities || [],
          assessment: lesson.assessment || 'Lesson check.',
        })) : [defaultLesson(1)],
      })) : [defaultModule(1)]);
      setForm((value) => ({ ...value, title: value.title || parsed.courseSummary.title, description: value.description || parsed.courseSummary.description, durationHours: String(parsed.courseSummary.totalDurationHours || value.durationHours), level: parsed.courseSummary.level || value.level }));
      setModuleIndex(0); setLessonIndex(0); setCardIndex(0); setStep('cards');
      setMessage('AI draft created. Review modules, lessons, and cards before saving.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally { setGenerating(false); }
  }

  async function saveDraft() {
    const missing = validateCourse(form, modules);
    if (missing) { setError(missing); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      await createShortCourseDraftWithBlueprint({
        course: { id: slugify(form.title || `short-course-${Date.now()}`), title: form.title, description: form.description || blueprint.courseSummary.description, schoolId: form.schoolId, imageId: 'short-course', pricingType: Number(form.price) > 0 ? 'paid' : 'free', price: Number(form.price), currency: form.currency, certificateFee: Number(form.certificateFee), certificateCurrency: form.certificateCurrency, durationHours: Number(form.durationHours || blueprint.courseSummary.totalDurationHours || 1), level: form.level, status: 'draft', modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description })), lessons: flattenLessons(blueprint), outcomes: blueprint.courseSummary.outcomes } as any,
        blueprint: blueprint as any,
        sourceMode: 'new',
        programmeTitle: null,
        programmeCourseTitle: documents.map((doc) => doc.name).join(', ') || null,
      });
      setCourses(await getCourses());
      setMessage('Draft saved. Next step: Review & Publish.');
      setStep('preview');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoading message="Loading builder..." />;

  return (
    <div className="space-y-6">
      <BuilderHero step={step} setStep={setStep} completion={completion} onSave={saveDraft} saving={saving} canSave={!validateCourse(form, modules)} />
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {progress ? <ProgressNotice progress={progress} /> : null}

      {step === 'start' ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>1. Course basics</CardTitle>
              <CardDescription>Start simple. Give the course a name, describe it, and add source documents if you have them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Course title"><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Software Development Fundamentals" /></Field>
              <Field label="What is this course about?"><Textarea rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="Describe what learners will understand or be able to do." /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="School / Faculty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
                <Field label="Level"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></Field>
                <Field label="Total hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
                <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
                <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
                <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
              </div>
              <Field label="Upload source documents, optional"><Input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={readDocuments} disabled={reading} /></Field>
              <DocumentList documents={documents} onClear={() => setDocuments([])} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader><CardTitle>Choose how to build</CardTitle><CardDescription>Admins can use AI for a first draft or build the module structure manually.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-background p-4">
                <p className="font-semibold">Use AI to prepare a first draft</p>
                <p className="mt-1 text-sm text-muted-foreground">Best when you uploaded notes, units, or a course outline.</p>
                <Textarea className="mt-3" rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Build a beginner course from these documents. Make one module per major topic and one lesson per skill." />
                <Button className="mt-3 w-full" onClick={generateFromAi} disabled={generating || reading}>{generating ? 'Creating course draft...' : 'Generate editable course'}</Button>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="font-semibold">Build manually</p>
                <p className="mt-1 text-sm text-muted-foreground">Start with one module, then add lessons and cards.</p>
                <Button className="mt-3 w-full" variant="outline" onClick={() => setStep('lessons')}>Start manual editing</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 'lessons' ? <ModuleLessonStep modules={modules} moduleIndex={moduleIndex} lessonIndex={lessonIndex} activeModule={activeModule} activeLesson={activeLesson} selectModule={selectModule} setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }} updateModule={updateModule} addModule={addModule} removeModule={removeModule} moveModule={moveModule} updateLesson={updateLesson} addLesson={addLesson} removeLesson={removeLesson} moveLesson={moveLesson} moveLessonToModule={moveLessonToModule} goCards={() => setStep('cards')} /> : null}
      {step === 'cards' ? <CardStep form={form} modules={modules} activeModule={activeModule} activeLesson={activeLesson} activeCard={activeCard} moduleIndex={moduleIndex} lessonIndex={lessonIndex} cardIndex={cardIndex} selectModule={selectModule} setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }} setCardIndex={setCardIndex} updateCard={updateCard} addCard={addCard} removeCard={removeCard} /> : null}
      {step === 'preview' ? <PreviewStep form={form} modules={modules} activeLesson={activeLesson} courses={courses} saveDraft={saveDraft} saving={saving} /> : null}
    </div>
  );
}

function BuilderHero({ step, setStep, completion, onSave, saving, canSave }: { step: BuilderStep; setStep: (step: BuilderStep) => void; completion: number; onSave: () => void; saving: boolean; canSave: boolean }) {
  const steps: Array<{ key: BuilderStep; label: string }> = [{ key: 'start', label: 'Start' }, { key: 'lessons', label: 'Modules & Lessons' }, { key: 'cards', label: 'Cards' }, { key: 'preview', label: 'Preview' }];
  return <div className="rounded-3xl border bg-card p-4 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold uppercase text-primary">Guided short-course builder</p><h2 className="text-2xl font-bold">Build a complete course structure visually.</h2><p className="text-sm text-muted-foreground">Create modules, assign lessons, edit cards, and preview the student experience before saving.</p></div><Button onClick={onSave} disabled={saving || !canSave}>{saving ? 'Saving...' : 'Save draft for review'}</Button></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} /></div><div className="mt-4 grid gap-2 sm:grid-cols-4">{steps.map((item, index) => <button key={item.key} onClick={() => setStep(item.key)} className={`rounded-2xl border p-3 text-left text-sm transition ${step === item.key ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40'}`}><span className="font-semibold">{index + 1}. {item.label}</span></button>)}</div></div>;
}

function ModuleLessonStep(props: { modules: VisualModule[]; moduleIndex: number; lessonIndex: number; activeModule: VisualModule; activeLesson: VisualLesson; selectModule: (index: number) => void; setLessonIndex: (index: number) => void; updateModule: (patch: Partial<VisualModule>) => void; addModule: () => void; removeModule: () => void; moveModule: (direction: -1 | 1) => void; updateLesson: (patch: Partial<VisualLesson>) => void; addLesson: () => void; removeLesson: () => void; moveLesson: (direction: -1 | 1) => void; moveLessonToModule: (targetModuleIndex: number) => void; goCards: () => void }) {
  return <div className="grid gap-6 xl:grid-cols-[300px_320px_1fr]"><Card className="rounded-3xl"><CardHeader><CardTitle>Modules</CardTitle><CardDescription>Modules are the big sections of the course.</CardDescription></CardHeader><CardContent className="space-y-2">{props.modules.map((module, index) => <button key={`${module.title}-${index}`} onClick={() => props.selectModule(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === props.moduleIndex ? 'border-primary bg-primary/10' : ''}`}><p className="font-semibold">{module.title}</p><p className="text-muted-foreground">{module.lessons.length} lesson(s) · {module.durationMinutes} min</p></button>)}<Button className="w-full" variant="outline" onClick={props.addModule}>+ Add module</Button><div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => props.moveModule(-1)} disabled={props.moduleIndex === 0}>Move up</Button><Button variant="outline" size="sm" onClick={() => props.moveModule(1)} disabled={props.moduleIndex === props.modules.length - 1}>Move down</Button></div><Button className="w-full" variant="destructive" onClick={props.removeModule} disabled={props.modules.length <= 1}>Delete module</Button></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Lessons in module</CardTitle><CardDescription>Select, add, delete, or rearrange lessons.</CardDescription></CardHeader><CardContent className="space-y-2">{props.activeModule.lessons.map((lesson, index) => <button key={`${lesson.title}-${index}`} onClick={() => props.setLessonIndex(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === props.lessonIndex ? 'border-primary bg-primary/10' : ''}`}><p className="font-semibold">{lesson.title}</p><p className="text-muted-foreground">{lesson.cards.length} cards · {lesson.durationMinutes} min</p></button>)}<Button className="w-full" variant="outline" onClick={props.addLesson}>+ Add lesson</Button><div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => props.moveLesson(-1)} disabled={props.lessonIndex === 0}>Move up</Button><Button variant="outline" size="sm" onClick={() => props.moveLesson(1)} disabled={props.lessonIndex === props.activeModule.lessons.length - 1}>Move down</Button></div><Field label="Move selected lesson to"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={props.moduleIndex} onChange={(event) => props.moveLessonToModule(Number(event.target.value))}>{props.modules.map((module, index) => <option key={`${module.title}-move-${index}`} value={index}>{module.title}</option>)}</select></Field><Button className="w-full" variant="destructive" onClick={props.removeLesson} disabled={props.activeModule.lessons.length <= 1}>Delete lesson</Button></CardContent></Card><div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Edit module</CardTitle><CardDescription>Name the module and describe the learning journey.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Module name"><Input value={props.activeModule.title} onChange={(event) => props.updateModule({ title: event.target.value })} /></Field><Field label="Module description"><Textarea rows={3} value={props.activeModule.description} onChange={(event) => props.updateModule({ description: event.target.value })} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Module minutes"><Input type="number" min={1} value={props.activeModule.durationMinutes} onChange={(event) => props.updateModule({ durationMinutes: Number(event.target.value) })} /></Field><Field label="Module assessment"><Input value={props.activeModule.moduleAssessment} onChange={(event) => props.updateModule({ moduleAssessment: event.target.value })} /></Field></div><Field label="Module outcomes, one per line"><Textarea rows={3} value={props.activeModule.outcomes.join('\n')} onChange={(event) => props.updateModule({ outcomes: event.target.value.split('\n').filter(Boolean) })} /></Field></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Edit lesson</CardTitle><CardDescription>Name the selected lesson and tell learners what it covers.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Lesson title"><Input value={props.activeLesson.title} onChange={(event) => props.updateLesson({ title: event.target.value })} /></Field><Field label="Lesson summary"><Textarea rows={4} value={props.activeLesson.summary} onChange={(event) => props.updateLesson({ summary: event.target.value })} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Minutes"><Input type="number" min={1} value={props.activeLesson.durationMinutes} onChange={(event) => props.updateLesson({ durationMinutes: Number(event.target.value) })} /></Field><Field label="Difficulty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={props.activeLesson.difficulty} onChange={(event) => props.updateLesson({ difficulty: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></Field></div><Field label="Learning outcomes, one per line"><Textarea rows={4} value={props.activeLesson.outcomes.join('\n')} onChange={(event) => props.updateLesson({ outcomes: event.target.value.split('\n').filter(Boolean) })} /></Field><div className="flex flex-wrap gap-2"><Button onClick={props.goCards}>Edit lesson cards</Button></div></CardContent></Card></div></div>;
}

function CardStep(props: { form: FormState; modules: VisualModule[]; activeModule: VisualModule; activeLesson: VisualLesson; activeCard: LessonCard; moduleIndex: number; lessonIndex: number; cardIndex: number; selectModule: (index: number) => void; setLessonIndex: (index: number) => void; setCardIndex: (index: number) => void; updateCard: (patch: Partial<LessonCard>) => void; addCard: (type: CardType) => void; removeCard: () => void }) {
  return <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Card editor</CardTitle><CardDescription>Select a module, lesson, and card. The preview updates immediately.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex gap-2 overflow-x-auto pb-1">{props.modules.map((module, index) => <Button key={`${module.title}-${index}`} size="sm" variant={index === props.moduleIndex ? 'default' : 'outline'} onClick={() => props.selectModule(index)}>{module.title}</Button>)}</div><div className="flex gap-2 overflow-x-auto pb-1">{props.activeModule.lessons.map((lesson, index) => <Button key={`${lesson.title}-${index}`} size="sm" variant={index === props.lessonIndex ? 'default' : 'outline'} onClick={() => props.setLessonIndex(index)}>{lesson.title}</Button>)}</div><div className="flex gap-2 overflow-x-auto pb-1">{props.activeLesson.cards.map((card, index) => <button key={`${card.type}-${index}`} onClick={() => props.setCardIndex(index)} className={`min-w-[120px] rounded-2xl border p-3 text-left text-xs ${index === props.cardIndex ? 'border-primary bg-primary/10' : ''}`}><p className="font-semibold">Card {index + 1}</p><p className="text-muted-foreground">{card.type}</p></button>)}</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{CARD_TYPES.map((item) => <button key={item.type} onClick={() => props.addCard(item.type)} className="rounded-2xl border p-3 text-left text-xs hover:border-primary"><p className="font-semibold">+ {item.label}</p><p className="text-muted-foreground">{item.help}</p></button>)}</div><Field label="Card type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={props.activeCard.type} onChange={(event) => props.updateCard(cardByType(event.target.value as CardType))}>{CARD_TYPES.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></Field><Field label="Card title"><Input value={props.activeCard.title || ''} onChange={(event) => props.updateCard({ title: event.target.value })} /></Field><CardFields card={props.activeCard} updateCard={props.updateCard} /><Button variant="destructive" onClick={props.removeCard} disabled={props.activeLesson.cards.length <= 1}>Delete selected card</Button></CardContent></Card></div><Card className="rounded-3xl xl:sticky xl:top-4 xl:self-start"><CardHeader><CardTitle>Student preview</CardTitle><CardDescription>{props.activeModule.title} / {props.activeLesson.title}</CardDescription></CardHeader><CardContent><LessonPlayer lesson={lessonPreview(props.activeLesson)} courseTitle={props.form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /></CardContent></Card></div>;
}

function PreviewStep({ form, modules, activeLesson, courses, saveDraft, saving }: { form: FormState; modules: VisualModule[]; activeLesson: VisualLesson; courses: Course[]; saveDraft: () => void; saving: boolean }) {
  return <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]"><Card className="rounded-3xl"><CardHeader><CardTitle>Final learner preview</CardTitle><CardDescription>Check the lesson experience before saving.</CardDescription></CardHeader><CardContent><div className="mb-4 rounded-2xl border p-4 text-sm"><p className="font-semibold">Course structure</p><p className="text-muted-foreground">{modules.length} module(s) · {modules.reduce((total, module) => total + module.lessons.length, 0)} lesson(s)</p></div><LessonPlayer lesson={lessonPreview(activeLesson)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /><Button className="mt-4 w-full" onClick={saveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save draft for review'}</Button></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Recent courses</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{courses.slice(0, 8).map((course) => <div key={course.id} className="rounded-xl border p-3"><p className="font-semibold">{course.title}</p><p className="text-muted-foreground">{course.status ?? 'draft'} · {course.level ?? 'beginner'} · {course.durationHours ?? 0}h</p></div>)}</CardContent></Card></div>;
}

function CardFields({ card, updateCard }: { card: LessonCard; updateCard: (patch: Partial<LessonCard>) => void }) {
  if (card.type === 'question') return <><Field label="Question"><Textarea rows={3} value={card.question || ''} onChange={(event) => updateCard({ question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={4} value={(card.options || []).join('\n')} onChange={(event) => updateCard({ options: event.target.value.split('\n').filter(Boolean) })} /></Field><Field label="Correct answer"><Input value={String(card.correctAnswer || '')} onChange={(event) => updateCard({ correctAnswer: event.target.value })} /></Field><Field label="Answer explanation"><Textarea rows={2} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  if (card.type === 'fill_blank') return <><Field label="Text"><Textarea rows={3} value={card.text || ''} onChange={(event) => updateCard({ text: event.target.value })} /></Field><Field label="Correct answer"><Input value={String(card.correctAnswer || '')} onChange={(event) => updateCard({ correctAnswer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={2} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  if (card.type === 'true_false') return <><Field label="Statement"><Textarea rows={3} value={card.statement || ''} onChange={(event) => updateCard({ statement: event.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(card.correctAnswer)} onChange={(event) => updateCard({ correctAnswer: event.target.checked })} /> Statement is true</label><Field label="Explanation"><Textarea rows={2} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  if (card.type === 'equation') return <><Field label="Equation"><Input value={card.equation || ''} onChange={(event) => updateCard({ equation: event.target.value })} placeholder="x^2 + y^2 = r^2" /></Field><Field label="Explanation"><Textarea rows={3} value={card.body || ''} onChange={(event) => updateCard({ body: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  return <><Field label="Card text"><Textarea rows={6} value={card.body || ''} onChange={(event) => updateCard({ body: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
}

function ImageFields({ card, updateCard }: { card: LessonCard; updateCard: (patch: Partial<LessonCard>) => void }) {
  function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateCard({ imageUrl: String(reader.result || '') });
    reader.readAsDataURL(file);
    event.target.value = '';
  }
  return <div className="space-y-3 rounded-2xl border p-4"><p className="text-sm font-semibold">Optional image for this card</p><Input type="file" accept="image/*" onChange={readImage} />{card.imageUrl ? <img src={card.imageUrl} alt={card.imageAlt || 'Card image'} className="max-h-48 rounded-xl border object-contain" /> : null}<Field label="Image description"><Input value={card.imageAlt || ''} onChange={(event) => updateCard({ imageAlt: event.target.value })} /></Field><Field label="Caption"><Input value={card.imageCaption || ''} onChange={(event) => updateCard({ imageCaption: event.target.value })} /></Field></div>;
}

function ProgressNotice({ progress }: { progress: DocumentExtractionProgress }) { return <div className="rounded-2xl border bg-primary/5 p-4 text-sm"><div className="mb-2 flex justify-between gap-3"><span>{progress.message}</span><strong>{progress.percent ?? 0}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(1, progress.percent ?? 1)}%` }} /></div>{progress.currentPage && progress.totalPages ? <p className="mt-2 text-xs text-muted-foreground">Page {progress.currentPage} of {progress.totalPages}</p> : null}</div>; }
function DocumentList({ documents, onClear }: { documents: SourceDoc[]; onClear: () => void }) { if (!documents.length) return null; return <div className="space-y-2 rounded-2xl border p-3 text-sm"><p className="font-semibold">Loaded documents</p>{documents.map((doc, index) => <div key={`${doc.name}-${index}`} className="rounded-xl bg-muted/40 p-2"><p>{index + 1}. {doc.name}</p>{doc.warning ? <p className="text-xs text-amber-600">{doc.warning}</p> : null}</div>)}<Button type="button" size="sm" variant="ghost" onClick={onClear}>Clear documents</Button></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function cleanJson(raw: string) { return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim(); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`; }
function cardByType(type: CardType): LessonCard { if (type === 'question') return { type, title: 'Quick check', question: 'Write the question here.', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A', explanation: 'Explain the correct answer.' }; if (type === 'fill_blank') return { type, title: 'Fill in the blank', text: 'Complete this: ____', correctAnswer: 'answer', explanation: 'Explain the answer.' }; if (type === 'true_false') return { type, title: 'True or false', statement: 'Write a statement here.', correctAnswer: true, explanation: 'Explain why.' }; if (type === 'summary') return { type, title: 'Summary', body: 'Summarize what learners should remember.' }; if (type === 'equation') return { type, title: 'Equation', equation: 'x^2', body: 'Explain the equation.' }; if (type === 'example') return { type, title: 'Example', body: 'Show one practical example.' }; return { type, title: 'Core idea', body: 'Explain one concept clearly.' }; }
function cardFromBlock(block: any): LessonCard { const type = String(block.type || 'explanation') as CardType; return { ...cardByType(CARD_TYPES.some((item) => item.type === type) ? type : 'explanation'), ...block }; }
function moveItem<T>(items: T[], from: number, to: number) { const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy; }
function buildBlueprint(form: FormState, modules: VisualModule[]): CourseBuilderBlueprint { return { courseSummary: { title: form.title || 'Untitled short course', audience: 'Short-course learners', level: form.level || 'beginner', description: form.description || 'Short-course draft.', prerequisites: [], totalDurationHours: Number(form.durationHours || 1), outcomes: modules.flatMap((module) => module.outcomes.length ? module.outcomes : module.lessons.flatMap((lesson) => lesson.outcomes)).filter(Boolean).slice(0, 12), finalAssessment: 'Final practice assessment.', certificateCriteria: 'Complete lessons and pass the final assessment.' }, assessments: { quizzes: ['Generate easy, medium, hard and very hard practice questions.'], practicalWork: [], instructorReviewChecklist: ['Check module order.', 'Check lesson accuracy.', 'Check images and captions.', 'Check quiz answers.'] }, modules: modules.map((module) => ({ title: module.title, description: module.description, durationMinutes: module.durationMinutes, outcomes: module.outcomes, moduleAssessment: module.moduleAssessment, lessons: module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: lesson.durationMinutes, difficulty: lesson.difficulty, outcomes: lesson.outcomes, blocks: lesson.cards as any, subLessons: [], activities: lesson.activities, assessment: lesson.assessment })) })) }; }
function flattenLessons(blueprint: CourseBuilderBlueprint) { return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => ({ ...lesson, moduleTitle: module.title, moduleIndex, lessonIndex, sortOrder: moduleIndex * 100 + lessonIndex }))); }
function lessonPreview(lesson: VisualLesson) { return { id: 'preview', title: lesson.title, summary: lesson.summary, estimatedMinutes: lesson.durationMinutes, difficulty: lesson.difficulty, learningObjects: [{ id: 'preview-object', type: 'content', title: lesson.title, body: JSON.stringify({ blocks: lesson.cards }), payload: { blocks: lesson.cards } }] as any } as any; }
function normalizeAiBlueprint(blueprint: CourseBuilderBlueprint): CourseBuilderBlueprint { return { ...blueprint, modules: (blueprint.modules || []).map((module) => ({ ...module, lessons: (module.lessons || []).map((lesson) => ({ ...lesson, blocks: lesson.blocks?.length ? lesson.blocks : [cardByType('explanation') as any] })) })) }; }
function buildAiPrompt(seed: string, form: FormState, sourceText: string, names: string[]) { return `Create a short course in strict JSON only. Prompt: ${seed}\nTitle: ${form.title || 'Suggest a title'}\nLevel: ${form.level}\nHours: ${form.durationHours}\nDocuments: ${names.join(', ') || 'none'}\n${sourceText ? `Source text:\n${sourceText}` : ''}\nUse clear SoloLearn-style lesson cards. Structure the course into proper modules. Add questions between explanations. Return shape: {"courseSummary":{"title":"","audience":"","level":"","description":"","prerequisites":[],"totalDurationHours":0,"outcomes":[],"finalAssessment":"","certificateCriteria":""},"assessments":{"quizzes":[],"practicalWork":[],"instructorReviewChecklist":[]},"modules":[{"title":"","description":"","durationMinutes":0,"outcomes":[],"moduleAssessment":"","lessons":[{"title":"","summary":"","durationMinutes":0,"difficulty":"","outcomes":[],"blocks":[{"type":"explanation","title":"","body":""}],"subLessons":[],"activities":[],"assessment":""}]}]}`; }
function validateCourse(form: FormState, modules: VisualModule[]) { if (!form.title.trim()) return 'Course title is required.'; if (!form.schoolId) return 'School / Faculty is required.'; if (!modules.length) return 'Add at least one module.'; if (modules.some((module) => !module.title.trim())) return 'Every module needs a title.'; if (modules.some((module) => !module.lessons.length)) return 'Every module needs at least one lesson.'; if (modules.some((module) => module.lessons.some((lesson) => !lesson.title.trim()))) return 'Every lesson needs a title.'; if (modules.some((module) => module.lessons.some((lesson) => !lesson.cards.length))) return 'Every lesson needs at least one card.'; return null; }
function computeCompletion(form: FormState, modules: VisualModule[]) { let score = 0; const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0); if (form.title.trim()) score += 18; if (form.description.trim()) score += 12; if (form.schoolId) score += 10; if (modules.length) score += 15; if (modules.some((module) => module.description.trim())) score += 10; if (lessonCount) score += 15; if (modules.some((module) => module.lessons.some((lesson) => lesson.cards.length >= 3))) score += 15; if (!validateCourse(form, modules)) score += 5; return Math.min(100, score); }
