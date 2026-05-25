'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { CheckCircle2, Copy, FileJson, Layers3, Plus, Save, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getSchools } from '@/lib/api';
import type { School } from '@/lib/api/types';

type Step = 'course' | 'modules' | 'lessons' | 'cards' | 'questions' | 'preview';
type SaveStatus = 'draft' | 'published';
type CardTarget = 'lesson' | 'subLesson';
type JsonCard = Record<string, unknown>;
type JsonCourse = { title: string; description: string; schoolId: string; level: string; durationHours: number; entryFee: number; currency: string; certificateFee: number; audience: string; prerequisites: string[]; outcomes: string[] };
type JsonSubLesson = { id: string; title: string; summary: string; cards: JsonCard[] };
type JsonLesson = { id: string; title: string; summary: string; outcomes: string[]; cards: JsonCard[]; subLessons: JsonSubLesson[] };
type JsonModule = { id: string; title: string; description: string; outcomes: string[]; lessons: JsonLesson[] };
type JsonQuestion = { id: string; type: string; difficulty: string; question: string; options?: string[]; answer: string; explanation?: string };
type JsonBlueprint = { course: JsonCourse; modules: JsonModule[]; questions: JsonQuestion[] };

type MergeLocation = { moduleIndex: number; lessonIndex: number; subLessonIndex: number | null; cardTarget: CardTarget };

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const steps: Array<{ id: Step; label: string }> = [
  { id: 'course', label: 'Course' },
  { id: 'modules', label: 'Modules' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'cards', label: 'Cards' },
  { id: 'questions', label: 'Questions' },
  { id: 'preview', label: 'Preview' },
];

const initialBlueprint: JsonBlueprint = {
  course: {
    title: 'Introduction to Web Development',
    description: 'Learn the basics of HTML, CSS, JavaScript, and how web pages work.',
    schoolId: '',
    level: 'beginner',
    durationHours: 12,
    entryFee: 20,
    currency: 'ZMW',
    certificateFee: 50,
    audience: 'Beginners who want to build websites.',
    prerequisites: ['Basic computer literacy'],
    outcomes: ['Understand how websites work', 'Create a simple web page', 'Style content with CSS'],
  },
  modules: [makeModule(0)],
  questions: [],
};

export function JsonCourseBuilderFlexStudio() {
  const [schools, setSchools] = useState<School[]>([]);
  const [blueprint, setBlueprint] = useState<JsonBlueprint>(initialBlueprint);
  const [step, setStep] = useState<Step>('preview');
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [subLessonIndex, setSubLessonIndex] = useState<number | null>(null);
  const [cardTarget, setCardTarget] = useState<CardTarget>('lesson');
  const [editor, setEditor] = useState(pretty(initialBlueprint));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('draft');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getSchools().then((items) => {
      setSchools(items);
      if (items[0]) {
        setBlueprint((current) => current.course.schoolId ? current : { ...current, course: { ...current.course, schoolId: items[0].id } });
      }
    }).catch(() => setSchools([]));
  }, []);

  const activeModule = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  const activeLesson = activeModule?.lessons[lessonIndex] ?? activeModule?.lessons[0];
  const activeSubLesson = subLessonIndex === null ? null : activeLesson?.subLessons[subLessonIndex] ?? null;
  const activeCards = cardTarget === 'subLesson' && activeSubLesson ? activeSubLesson.cards : activeLesson?.cards ?? [];
  const validation = useMemo(() => validateBlueprint(blueprint), [blueprint]);

  useEffect(() => {
    setError(null);
    if (step === 'course') setEditor(pretty(blueprint.course));
    if (step === 'modules') setEditor(pretty(activeModule ?? makeModule(0)));
    if (step === 'lessons') setEditor(pretty(activeLesson ?? makeLesson(0)));
    if (step === 'cards') setEditor(pretty(activeCards));
    if (step === 'questions') setEditor(pretty(blueprint.questions));
    if (step === 'preview') setEditor(pretty(blueprint));
  }, [step, moduleIndex, lessonIndex, subLessonIndex, cardTarget, blueprint, activeModule, activeLesson, activeCards]);

  function updateBlueprint(next: JsonBlueprint, nextMessage?: string) {
    setBlueprint(next);
    setMessage(nextMessage ?? null);
    setError(null);
  }

  function updateCourse(patch: Partial<JsonCourse>) {
    updateBlueprint({ ...blueprint, course: { ...blueprint.course, ...patch } });
  }

  function addModule() {
    const next = { ...blueprint, modules: [...blueprint.modules, makeModule(blueprint.modules.length)] };
    setModuleIndex(next.modules.length - 1);
    setLessonIndex(0);
    setSubLessonIndex(null);
    updateBlueprint(next, 'Module added.');
  }

  function addLesson() {
    const next = cloneBlueprint(blueprint);
    const module = next.modules[moduleIndex];
    if (!module) return;
    module.lessons.push(makeLesson(module.lessons.length));
    setLessonIndex(module.lessons.length - 1);
    setSubLessonIndex(null);
    updateBlueprint(next, 'Lesson added.');
  }

  function addSubLesson() {
    const next = cloneBlueprint(blueprint);
    const lesson = next.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    lesson.subLessons.push({ id: uid('sub'), title: `Sub-lesson ${lesson.subLessons.length + 1}`, summary: 'Describe this sub-lesson.', cards: [] });
    setSubLessonIndex(lesson.subLessons.length - 1);
    setCardTarget('subLesson');
    updateBlueprint(next, 'Sub-lesson added.');
  }

  function removeModule() {
    if (blueprint.modules.length <= 1) return setError('Keep at least one module.');
    const next = { ...blueprint, modules: blueprint.modules.filter((_, index) => index !== moduleIndex) };
    setModuleIndex(Math.max(0, moduleIndex - 1));
    setLessonIndex(0);
    setSubLessonIndex(null);
    updateBlueprint(next, 'Module removed.');
  }

  function removeLesson() {
    const module = blueprint.modules[moduleIndex];
    if (!module || module.lessons.length <= 1) return setError('Keep at least one lesson in this module.');
    const next = cloneBlueprint(blueprint);
    next.modules[moduleIndex].lessons = next.modules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
    setLessonIndex(Math.max(0, lessonIndex - 1));
    setSubLessonIndex(null);
    updateBlueprint(next, 'Lesson removed.');
  }

  function applyEditor() {
    try {
      const raw = parseJson(editor);
      const location = { moduleIndex, lessonIndex, subLessonIndex, cardTarget };
      if (step === 'course') {
        const courseRaw = asRecord(asRecord(raw).course ?? raw);
        updateBlueprint({ ...blueprint, course: normalizeCourse({ ...blueprint.course, ...courseRaw }) }, 'Course fields updated.');
        return;
      }
      if (step === 'preview') {
        const result = isFullBlueprint(raw) ? parseFullBlueprint(raw, blueprint) : mergePartial(blueprint, raw, location);
        updateBlueprint(result.blueprint, result.message);
        return;
      }
      const result = mergePartial(blueprint, wrapForStep(step, raw), location);
      updateBlueprint(result.blueprint, result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid JSON.');
    }
  }

  function formatEditor() {
    try { setEditor(pretty(parseJson(editor))); setError(null); }
    catch { setError('Cannot format invalid JSON.'); }
  }

  async function uploadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw = parseJson(await file.text());
      const result = isFullBlueprint(raw) ? parseFullBlueprint(raw, blueprint) : mergePartial(blueprint, raw, { moduleIndex, lessonIndex, subLessonIndex, cardTarget });
      updateBlueprint(result.blueprint, `${file.name}: ${result.message}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import this JSON file.');
    }
  }

  async function saveCourse(status: SaveStatus) {
    if (validation.errors.length) return setError('Fix validation errors before saving.');
    setSaving(true);
    setError(null);
    try {
      await createShortCourseDraftWithBlueprint(toDraftPayload(blueprint, status) as never);
      setSaveStatus(status);
      setMessage(status === 'published' ? 'Course published.' : 'Draft saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <input ref={uploadRef} type="file" accept="application/json,.json" className="hidden" onChange={uploadJson} />
      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /> Flexible JSON Builder</CardTitle>
              <CardDescription>Paste or upload a full course, one module, lessons, cards, or questions. Partial JSON merges into the current draft.</CardDescription>
            </div>
            <Button type="button" onClick={() => uploadRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload JSON</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {steps.map((item) => <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`min-w-[120px] rounded-2xl border p-3 text-left text-sm ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background'}`}><b>{item.label}</b></button>)}
          </div>
          {message ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-primary" /> Structure</CardTitle><CardDescription>Select where lessons/cards should be added.</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><div className="flex items-center justify-between"><Label>Modules</Label><Button size="sm" type="button" onClick={addModule}><Plus className="mr-1 h-3 w-3" />Add</Button></div>{blueprint.modules.map((module, index) => <button key={module.id} type="button" onClick={() => { setModuleIndex(index); setLessonIndex(0); setSubLessonIndex(null); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === moduleIndex ? 'border-primary bg-primary/10' : ''}`}><b>{module.title}</b><span className="block text-xs text-muted-foreground">{module.lessons.length} lessons</span></button>)}<Button size="sm" variant="ghost" className="text-destructive" onClick={removeModule}><Trash2 className="mr-1 h-3 w-3" />Delete active module</Button></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label>Lessons</Label><Button size="sm" type="button" onClick={addLesson}><Plus className="mr-1 h-3 w-3" />Add</Button></div>{activeModule?.lessons.map((lesson, index) => <button key={lesson.id} type="button" onClick={() => { setLessonIndex(index); setSubLessonIndex(null); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === lessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{lesson.title}</b><span className="block text-xs text-muted-foreground">{lesson.cards.length} cards · {lesson.subLessons.length} sub-lessons</span></button>)}<Button size="sm" variant="ghost" className="text-destructive" onClick={removeLesson}><Trash2 className="mr-1 h-3 w-3" />Delete active lesson</Button></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label>Cards target</Label><Button size="sm" type="button" onClick={addSubLesson}><Plus className="mr-1 h-3 w-3" />Sub</Button></div><button type="button" onClick={() => { setSubLessonIndex(null); setCardTarget('lesson'); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${subLessonIndex === null ? 'border-primary bg-primary/10' : ''}`}>Main lesson cards</button>{activeLesson?.subLessons.map((sub, index) => <button key={sub.id} type="button" onClick={() => { setSubLessonIndex(index); setCardTarget('subLesson'); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === subLessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{sub.title}</b><span className="block text-xs text-muted-foreground">{sub.cards.length} cards</span></button>)}</div>
          </CardContent></Card>
          <Card className="rounded-3xl"><CardHeader><CardTitle>Validation</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{validation.errors.length === 0 && validation.warnings.length === 0 ? <p className="rounded-2xl border border-primary/20 bg-primary/5 p-3">No issues found.</p> : null}{validation.errors.map((item) => <p key={item} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive">{item}</p>)}{validation.warnings.map((item) => <p key={item} className="rounded-2xl border bg-muted/40 p-3">{item}</p>)}</CardContent></Card>
        </aside>

        <section className="space-y-6">
          {step === 'course' ? <CourseFields course={blueprint.course} schools={schools} updateCourse={updateCourse} /> : null}
          <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /> {editorTitle(step)}</CardTitle><CardDescription>{editorHint(step)}</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={editor} onChange={(event) => setEditor(event.target.value)} rows={step === 'preview' ? 18 : 14} spellCheck={false} className="font-mono text-xs md:text-sm" /><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button type="button" onClick={applyEditor}><CheckCircle2 className="mr-2 h-4 w-4" />Apply / merge JSON</Button><Button type="button" variant="outline" onClick={formatEditor}><FileJson className="mr-2 h-4 w-4" />Format</Button><Button type="button" variant="outline" onClick={() => { void navigator.clipboard?.writeText(pretty(blueprint)); setMessage('Full JSON copied.'); }}><Copy className="mr-2 h-4 w-4" />Copy full JSON</Button><Button type="button" onClick={() => saveCourse('draft')} disabled={saving || validation.errors.length > 0}><Save className="mr-2 h-4 w-4" />Save draft</Button><Button type="button" onClick={() => saveCourse('published')} disabled={saving || validation.errors.length > 0}>Publish</Button></div></CardContent></Card>
          <Preview blueprint={blueprint} />
        </section>
      </div>
    </div>
  );
}

function CourseFields({ course, schools, updateCourse }: { course: JsonCourse; schools: School[]; updateCourse: (patch: Partial<JsonCourse>) => void }) {
  return <Card className="rounded-3xl"><CardHeader><CardTitle>Course basics</CardTitle><CardDescription>These fields can be updated now, or later with partial course JSON.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Title"><Input value={course.title} onChange={(e) => updateCourse({ title: e.target.value })} /></Field><Field label="Level"><Input value={course.level} onChange={(e) => updateCourse({ level: e.target.value })} /></Field><Field label="School"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={course.schoolId} onChange={(e) => updateCourse({ schoolId: e.target.value })}><option value="">Select school</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field><Field label="Currency"><Input value={course.currency} onChange={(e) => updateCourse({ currency: e.target.value })} /></Field><Field label="Duration hours"><Input type="number" value={course.durationHours} onChange={(e) => updateCourse({ durationHours: Number(e.target.value) || 0 })} /></Field><Field label="Entry fee"><Input type="number" value={course.entryFee} onChange={(e) => updateCourse({ entryFee: Number(e.target.value) || 0 })} /></Field><Field label="Certificate fee"><Input type="number" value={course.certificateFee} onChange={(e) => updateCourse({ certificateFee: Number(e.target.value) || 0 })} /></Field><Field label="Outcomes"><Textarea value={course.outcomes.join('\n')} onChange={(e) => updateCourse({ outcomes: lines(e.target.value) })} /></Field><div className="md:col-span-2"><Field label="Description"><Textarea value={course.description} rows={4} onChange={(e) => updateCourse({ description: e.target.value })} /></Field></div></CardContent></Card>;
}

function Preview({ blueprint }: { blueprint: JsonBlueprint }) {
  return <Card className="rounded-3xl"><CardHeader><CardTitle>Live preview</CardTitle><CardDescription>{blueprint.modules.length} modules · {blueprint.modules.reduce((sum, module) => sum + module.lessons.length, 0)} lessons · {blueprint.questions.length} questions</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Mission Control</p><h2 className="text-2xl font-bold">{blueprint.course.title}</h2><p className="mt-2 text-sm text-muted-foreground">{blueprint.course.description}</p></div>{blueprint.modules.map((module, moduleIndex) => <div key={module.id} className="rounded-3xl border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Stage {moduleIndex + 1}</p><h3 className="text-xl font-bold">{module.title}</h3><p className="text-sm text-muted-foreground">{module.description}</p><div className="mt-3 space-y-2">{module.lessons.map((lesson, lessonIndex) => <div key={lesson.id} className="rounded-2xl border bg-background p-3"><p className="font-semibold">Mission {lessonIndex + 1}: {lesson.title}</p><p className="text-sm text-muted-foreground">{lesson.summary}</p><p className="mt-1 text-xs text-muted-foreground">{lesson.cards.length} cards · {lesson.subLessons.length} side missions</p></div>)}</div></div>)}</CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function pretty(value: unknown) { return JSON.stringify(value, null, 2); }
function parseJson(text: string) { return JSON.parse(text.replace(/^\uFEFF/, '')); }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function asString(value: unknown, fallback = '') { return typeof value === 'string' ? value : value == null ? fallback : String(value); }
function asNumber(value: unknown, fallback = 0) { const next = Number(value); return Number.isFinite(next) ? next : fallback; }
function lines(value: string) { return value.split('\n').map((line) => line.trim()).filter(Boolean); }
function stringArray(value: unknown) { return Array.isArray(value) ? value.map((item) => asString(item).trim()).filter(Boolean) : typeof value === 'string' ? lines(value) : []; }
function cloneBlueprint(value: JsonBlueprint): JsonBlueprint { return JSON.parse(JSON.stringify(value)) as JsonBlueprint; }
function makeLesson(index: number): JsonLesson { return { id: uid('lesson'), title: `Lesson ${index + 1}`, summary: 'Describe this lesson.', outcomes: ['Understand the main idea.'], cards: [], subLessons: [] }; }
function makeModule(index: number): JsonModule { return { id: uid('module'), title: `Module ${index + 1}`, description: 'Describe this module.', outcomes: ['Complete this stage.'], lessons: [makeLesson(0)] }; }
function normalizeCards(value: unknown): JsonCard[] { const record = asRecord(value); const source = Array.isArray(value) ? value : Array.isArray(record.cards) ? record.cards : Array.isArray(record.blocks) ? record.blocks : value && typeof value === 'object' ? [value] : []; return source.filter((item): item is JsonCard => Boolean(item) && typeof item === 'object' && !Array.isArray(item)); }
function normalizeCourse(value: Record<string, unknown>): JsonCourse { return { title: asString(value.title, 'Untitled course'), description: asString(value.description ?? value.summary, 'Describe this course.'), schoolId: asString(value.schoolId ?? value.school_id), level: asString(value.level, 'beginner'), durationHours: asNumber(value.durationHours ?? value.duration_hours ?? value.duration, 8), entryFee: asNumber(value.entryFee ?? value.entry_fee ?? value.price, 0), currency: asString(value.currency, 'ZMW'), certificateFee: asNumber(value.certificateFee ?? value.certificate_fee, 0), audience: asString(value.audience, 'Learners'), prerequisites: stringArray(value.prerequisites), outcomes: stringArray(value.outcomes) }; }
function normalizeSubLesson(value: unknown, index: number): JsonSubLesson { const record = asRecord(value); return { id: asString(record.id, uid('sub')), title: asString(record.title ?? record.name, `Sub-lesson ${index + 1}`), summary: asString(record.summary ?? record.description ?? record.content, 'Describe this sub-lesson.'), cards: normalizeCards(record.cards ?? record.blocks ?? record.learning_cards) }; }
function normalizeLesson(value: unknown, index: number): JsonLesson { const record = asRecord(value); const subSource = Array.isArray(record.subLessons) ? record.subLessons : Array.isArray(record.sub_lessons) ? record.sub_lessons : []; return { id: asString(record.id, uid('lesson')), title: asString(record.title ?? record.name, `Lesson ${index + 1}`), summary: asString(record.summary ?? record.description ?? record.content, 'Describe this lesson.'), outcomes: stringArray(record.outcomes), cards: normalizeCards(record.cards ?? record.blocks ?? record.learningObjects ?? record.learning_cards), subLessons: subSource.map((item, subIndex) => normalizeSubLesson(item, subIndex)) }; }
function normalizeModule(value: unknown, index: number): JsonModule { const record = asRecord(value); const lessonsSource = Array.isArray(record.lessons) ? record.lessons : []; return { id: asString(record.id, uid('module')), title: asString(record.title ?? record.name, `Module ${index + 1}`), description: asString(record.description ?? record.summary, 'Describe this module.'), outcomes: stringArray(record.outcomes), lessons: lessonsSource.length ? lessonsSource.map((lesson, lessonIndex) => normalizeLesson(lesson, lessonIndex)) : [makeLesson(0)] }; }
function normalizeQuestions(value: unknown): JsonQuestion[] { const record = asRecord(value); const source = Array.isArray(value) ? value : Array.isArray(record.questions) ? record.questions : value && typeof value === 'object' && (record.question || record.prompt) ? [value] : []; return source.map((item, index) => { const row = asRecord(item); const options = Array.isArray(row.options) ? row.options.map((option) => asString(option)).filter(Boolean) : undefined; const question: JsonQuestion = { id: asString(row.id, uid('question')), type: asString(row.type, 'mcq'), difficulty: asString(row.difficulty, 'easy'), question: asString(row.question ?? row.prompt, `Question ${index + 1}`), answer: asString(row.answer ?? row.correctAnswer ?? row.correct_answer), explanation: asString(row.explanation) }; if (options?.length) question.options = options; return question; }); }
function getModules(raw: unknown): JsonModule[] { const record = asRecord(raw); const source = Array.isArray(raw) ? raw : Array.isArray(record.modules) ? record.modules : record.title || record.name ? [raw] : []; return source.map((item, index) => normalizeModule(item, index)); }
function getLessons(raw: unknown): JsonLesson[] { const record = asRecord(raw); const source = Array.isArray(raw) ? raw : Array.isArray(record.lessons) ? record.lessons : record.title || record.name ? [raw] : []; return source.map((item, index) => normalizeLesson(item, index)); }
function wrapForStep(step: Step, raw: unknown) { if (step === 'modules') return { modules: getModules(raw) }; if (step === 'lessons') return { lessons: getLessons(raw) }; if (step === 'cards') return { cards: normalizeCards(raw), mode: asRecord(raw).mode, replace: asRecord(raw).replace }; if (step === 'questions') return { questions: normalizeQuestions(raw), mode: asRecord(raw).mode, replace: asRecord(raw).replace }; return raw; }
function isFullBlueprint(raw: unknown) { const record = asRecord(raw); return Boolean(record.course && (Array.isArray(record.modules) || Array.isArray(record.lessons))); }
function parseFullBlueprint(raw: unknown, fallback: JsonBlueprint) { const record = asRecord(raw); const courseRaw = asRecord(record.course ?? record.courseSummary ?? record.course_summary); const modulesRaw = Array.isArray(record.modules) ? record.modules : Array.isArray(record.lessons) ? [{ title: 'Imported lessons', lessons: record.lessons }] : []; const assessment = asRecord(record.assessments); return { blueprint: { course: normalizeCourse({ ...fallback.course, ...courseRaw }), modules: modulesRaw.map((module, index) => normalizeModule(module, index)), questions: normalizeQuestions(record.questions ?? assessment.questions ?? assessment.quizzes) }, message: 'Full course JSON imported.' }; }
function mergeById<T extends { id: string }>(current: T[], incoming: T[]) { const next = [...current]; incoming.forEach((item) => { const index = next.findIndex((existing) => existing.id === item.id); if (index >= 0) next[index] = item; else next.push(item); }); return next; }
function mergePartial(current: JsonBlueprint, raw: unknown, location: MergeLocation) { const record = asRecord(raw); const next = cloneBlueprint(current); let message = 'JSON merged.'; if (record.course || record.courseSummary || record.course_summary) { next.course = normalizeCourse({ ...next.course, ...asRecord(record.course ?? record.courseSummary ?? record.course_summary) }); message = 'Course fields merged.'; }
  const modules = getModules(record.modules ?? (record.module ? [record.module] : [])); if (modules.length) { next.modules = mergeById(next.modules, modules); message = `${modules.length} module${modules.length === 1 ? '' : 's'} merged.`; }
  const lessons = getLessons(record.lessons ?? (record.lesson ? [record.lesson] : [])); if (lessons.length) { const module = next.modules[location.moduleIndex] ?? next.modules[0]; module.lessons = mergeById(module.lessons, lessons); message = `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} merged into active module.`; }
  const cards = normalizeCards(record.cards ?? record.blocks ?? (record.card ? [record.card] : [])); if (cards.length) { const lesson = next.modules[location.moduleIndex]?.lessons[location.lessonIndex]; if (!lesson) throw new Error('Select a lesson before adding cards.'); const replace = record.replace === true || record.mode === 'replace'; if (location.cardTarget === 'subLesson' && location.subLessonIndex !== null) { const sub = lesson.subLessons[location.subLessonIndex]; if (!sub) throw new Error('Select a sub-lesson before adding sub-lesson cards.'); sub.cards = replace ? cards : [...sub.cards, ...cards]; } else { lesson.cards = replace ? cards : [...lesson.cards, ...cards]; } message = `${cards.length} card${cards.length === 1 ? '' : 's'} ${replace ? 'replaced' : 'added'}.`; }
  const questions = normalizeQuestions(record.questions ?? record.quiz ?? record.quizzes ?? (record.question ? [record] : [])); if (questions.length) { const replace = record.replace === true || record.mode === 'replace'; next.questions = replace ? questions : [...next.questions, ...questions]; message = `${questions.length} question${questions.length === 1 ? '' : 's'} ${replace ? 'replaced' : 'added'}.`; }
  return { blueprint: next, message };
}
function validateBlueprint(blueprint: JsonBlueprint) { const errors: string[] = []; const warnings: string[] = []; if (!blueprint.course.title.trim()) errors.push('Course title is required.'); if (!blueprint.course.schoolId.trim()) warnings.push('School is not selected.'); if (!blueprint.modules.length) errors.push('At least one module is required.'); blueprint.modules.forEach((module, moduleIndex) => { if (!module.title.trim()) errors.push(`Module ${moduleIndex + 1} needs a title.`); if (!module.lessons.length) errors.push(`Module ${moduleIndex + 1} needs at least one lesson.`); module.lessons.forEach((lesson, lessonIndex) => { if (!lesson.title.trim()) errors.push(`Module ${moduleIndex + 1}, lesson ${lessonIndex + 1} needs a title.`); if (!lesson.cards.length && !lesson.subLessons.some((sub) => sub.cards.length)) warnings.push(`Module ${moduleIndex + 1}, lesson ${lessonIndex + 1} has no cards yet.`); }); }); return { errors, warnings }; }
function flattenLessons(blueprint: JsonBlueprint) { return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => [{ title: lesson.title, summary: lesson.summary, content: lesson.summary, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex, blocks: lesson.cards }, ...lesson.subLessons.map((subLesson, subIndex) => ({ title: `${lesson.title}: ${subLesson.title}`, summary: subLesson.summary, content: subLesson.summary, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1, blocks: subLesson.cards }))])); }
function toDraftPayload(blueprint: JsonBlueprint, status: SaveStatus) { const course = blueprint.course; return { sourceMode: 'new', course: { id: `json-${Date.now()}`, title: course.title, description: course.description, schoolId: course.schoolId, imageId: 'short-course-json', status, level: course.level, durationHours: course.durationHours, price: String(course.entryFee ?? 0), currency: course.currency || 'ZMW', certificateFee: String(course.certificateFee ?? 0), certificateCurrency: course.currency || 'ZMW', modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description })), lessons: flattenLessons(blueprint), outcomes: course.outcomes }, blueprint: { courseSummary: { title: course.title, audience: course.audience, level: course.level, description: course.description, prerequisites: course.prerequisites, totalDurationHours: course.durationHours, outcomes: course.outcomes, finalAssessment: 'Complete all questions and final project.', certificateCriteria: 'Complete the learning path and pass assessment.' }, assessments: { quizzes: blueprint.questions.map((question) => question.question), practicalWork: [], instructorReviewChecklist: [] }, modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description, durationMinutes: Math.max(30, Math.round((course.durationHours * 60) / Math.max(1, blueprint.modules.length))), outcomes: module.outcomes, moduleAssessment: 'Complete all missions in this stage.', lessons: module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: 30, outcomes: lesson.outcomes, activities: [`Cards JSON: ${JSON.stringify(lesson.cards)}`, `Sub-lessons JSON: ${JSON.stringify(lesson.subLessons)}`], assessment: 'Complete practice checks.', blocks: lesson.cards, subLessons: lesson.subLessons.map((subLesson) => ({ title: subLesson.title, summary: subLesson.summary, durationMinutes: 20, outcomes: [], blocks: subLesson.cards, activities: [], assessment: 'Complete side mission.' })) })) })) } }; }
function editorTitle(step: Step) { if (step === 'course') return 'Course JSON'; if (step === 'modules') return 'Module JSON'; if (step === 'lessons') return 'Lesson JSON'; if (step === 'cards') return 'Cards JSON'; if (step === 'questions') return 'Questions JSON'; return 'Full or partial JSON'; }
function editorHint(step: Step) { if (step === 'preview') return 'Paste full JSON to replace, or partial JSON to merge into the current draft.'; if (step === 'cards') return 'Cards append by default. Use { "replace": true, "cards": [...] } to replace.'; if (step === 'questions') return 'Questions append by default. Use { "replace": true, "questions": [...] } to replace.'; return 'Paste one object, an array, or a wrapper object. Matching IDs update; new IDs are added.'; }
