'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, Copy, FileJson, Layers3, ListChecks, Plus, Save, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getSchools } from '@/lib/api';
import { saveShortCourseDraftWithBlueprint } from '@/lib/api/safe-short-course-save';
import type { School } from '@/lib/api/types';

type Step = 'course' | 'modules' | 'lessons' | 'cards' | 'questions' | 'preview';
type CardTarget = 'lesson' | 'subLesson';
type JsonCard = Record<string, unknown>;
type JsonSubLesson = { id: string; title: string; summary: string; cards: JsonCard[] };
type JsonLesson = { id: string; title: string; summary: string; outcomes: string[]; subLessons: JsonSubLesson[]; cards: JsonCard[] };
type JsonModule = { id: string; title: string; description: string; outcomes: string[]; lessons: JsonLesson[] };
type JsonQuestion = { id: string; type: string; difficulty: string; question: string; options?: string[]; answer: string; explanation?: string };
type JsonCourse = { title: string; description: string; schoolId: string; level: string; durationHours: number; entryFee: number; currency: string; certificateFee: number; outcomes: string[]; audience: string; prerequisites: string[] };
type JsonBlueprint = { course: JsonCourse; modules: JsonModule[]; questions: JsonQuestion[] };

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const steps: Array<{ id: Step; label: string; hint: string }> = [
  { id: 'course', label: 'Course', hint: 'Basics JSON' },
  { id: 'modules', label: 'Modules', hint: 'Stage manager' },
  { id: 'lessons', label: 'Lessons', hint: 'Mission manager' },
  { id: 'cards', label: 'Cards', hint: 'Design JSON' },
  { id: 'questions', label: 'Questions', hint: 'Assessment JSON' },
  { id: 'preview', label: 'Preview', hint: 'Validate & save' },
];

const example: JsonBlueprint = {
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
    outcomes: ['Understand how websites work', 'Create a simple web page', 'Style content with CSS', 'Add basic JavaScript behavior'],
  },
  modules: [
    {
      id: uid('module'),
      title: 'HTML Foundations',
      description: 'Learn the structure of web pages.',
      outcomes: ['Understand HTML tags', 'Create headings and paragraphs'],
      lessons: [
        {
          id: uid('lesson'),
          title: 'What is HTML?',
          summary: 'Understand HTML as the structure of a web page.',
          outcomes: ['Explain what HTML does'],
          subLessons: [{ id: uid('sub'), title: 'HTML tags', summary: 'Learn how tags wrap content.', cards: [] }],
          cards: [
            { type: 'hero', title: 'Welcome to HTML', body: 'HTML is the skeleton of every web page.' },
            { type: 'callout', tone: 'info', title: 'Remember', body: 'HTML structures content. CSS styles it. JavaScript adds behavior.' },
          ],
        },
      ],
    },
  ],
  questions: [
    { id: uid('question'), type: 'mcq', difficulty: 'easy', question: 'What does HTML mainly provide?', options: ['Structure', 'Database storage', 'Internet speed'], answer: 'Structure', explanation: 'HTML describes the structure and meaning of page content.' },
  ],
};

const cardTemplates: Array<{ label: string; card: JsonCard }> = [
  { label: 'Hero', card: { type: 'hero', title: 'Big idea', body: 'Introduce the mission with a strong opening.' } },
  { label: 'Callout', card: { type: 'callout', tone: 'info', title: 'Remember', body: 'Highlight an important idea.' } },
  { label: 'Checklist', card: { type: 'checklist', title: 'Mission checklist', items: ['Read the concept', 'Try the example', 'Answer the question'] } },
  { label: 'Quiz', card: { type: 'quiz', question: 'What is the answer?', options: ['A', 'B', 'C'], answer: 'A', explanation: 'Explain why.' } },
  { label: 'Code', card: { type: 'code', language: 'html', title: 'Example', code: '<h1>Hello UnivAI</h1>' } },
  { label: 'Image', card: { type: 'image', title: 'Visual example', imageUrl: 'https://example.com/image.png', caption: 'Explain the image.' } },
];

function makeModule(index: number): JsonModule {
  return { id: uid('module'), title: `Module ${index + 1}`, description: 'Describe this module.', outcomes: ['Complete this stage.'], lessons: [makeLesson(0)] };
}
function makeLesson(index: number): JsonLesson {
  return { id: uid('lesson'), title: `Lesson ${index + 1}`, summary: 'Describe this lesson.', outcomes: ['Understand the main idea.'], subLessons: [], cards: [] };
}
function pretty(value: unknown) { return JSON.stringify(value, null, 2); }
function parseJson<T>(text: string): T { return JSON.parse(text) as T; }
function lines(value: string) { return value.split('\n').map((line) => line.trim()).filter(Boolean); }

export function JsonCourseBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [step, setStep] = useState<Step>('course');
  const [blueprint, setBlueprint] = useState<JsonBlueprint>(example);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [subLessonIndex, setSubLessonIndex] = useState<number | null>(null);
  const [cardTarget, setCardTarget] = useState<CardTarget>('lesson');
  const [editor, setEditor] = useState(pretty(example.course));
  const [bulkEditor, setBulkEditor] = useState(pretty(example));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSchools().then(setSchools).catch(() => setSchools([])); }, []);

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
    if (step === 'preview') setBulkEditor(pretty(blueprint));
  }, [step, moduleIndex, lessonIndex, subLessonIndex, cardTarget]);

  function updateCourse(patch: Partial<JsonCourse>) {
    setBlueprint((current) => ({ ...current, course: { ...current.course, ...patch } }));
  }

  function updateModule(index: number, patch: Partial<JsonModule>) {
    setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === index ? { ...module, ...patch } : module) }));
  }

  function addModule() {
    setBlueprint((current) => ({ ...current, modules: [...current.modules, makeModule(current.modules.length)] }));
    setModuleIndex(blueprint.modules.length);
    setLessonIndex(0);
    setSubLessonIndex(null);
  }

  function removeModule(index: number) {
    if (blueprint.modules.length <= 1) return setError('A course must keep at least one module.');
    setBlueprint((current) => ({ ...current, modules: current.modules.filter((_, i) => i !== index) }));
    setModuleIndex(Math.max(0, index - 1));
    setLessonIndex(0);
    setSubLessonIndex(null);
  }

  function addLesson() {
    if (!activeModule) return;
    setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: [...module.lessons, makeLesson(module.lessons.length)] } : module) }));
    setLessonIndex(activeModule.lessons.length);
    setSubLessonIndex(null);
  }

  function removeLesson(index: number) {
    if (!activeModule) return;
    if (activeModule.lessons.length <= 1) return setError('A module must keep at least one lesson.');
    setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.filter((_, l) => l !== index) } : module) }));
    setLessonIndex(Math.max(0, index - 1));
    setSubLessonIndex(null);
  }

  function addSubLesson() {
    if (!activeLesson) return;
    const next: JsonSubLesson = { id: uid('sub'), title: `Sub-lesson ${activeLesson.subLessons.length + 1}`, summary: 'Describe this sub-lesson.', cards: [] };
    setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, l) => l === lessonIndex ? { ...lesson, subLessons: [...lesson.subLessons, next] } : lesson) } : module) }));
    setSubLessonIndex(activeLesson.subLessons.length);
    setCardTarget('subLesson');
  }

  function addCardTemplate(card: JsonCard) {
    const nextCards = [...activeCards, { ...card }];
    applyCards(nextCards);
    setEditor(pretty(nextCards));
  }

  function applyCards(cards: JsonCard[]) {
    setBlueprint((current) => ({
      ...current,
      modules: current.modules.map((module, i) => i === moduleIndex ? {
        ...module,
        lessons: module.lessons.map((lesson, l) => {
          if (l !== lessonIndex) return lesson;
          if (cardTarget === 'subLesson' && subLessonIndex !== null) {
            return { ...lesson, subLessons: lesson.subLessons.map((sub, s) => s === subLessonIndex ? { ...sub, cards } : sub) };
          }
          return { ...lesson, cards };
        }),
      } : module),
    }));
  }

  function applyEditor() {
    try {
      setError(null);
      if (step === 'course') {
        const value = parseJson<Partial<JsonCourse>>(editor);
        setBlueprint((current) => ({ ...current, course: { ...current.course, ...value } }));
      }
      if (step === 'modules') {
        const value = parseJson<Partial<JsonModule>>(editor);
        updateModule(moduleIndex, { ...value, id: activeModule?.id ?? uid('module'), lessons: value.lessons ?? activeModule?.lessons ?? [makeLesson(0)] });
      }
      if (step === 'lessons') {
        const value = parseJson<Partial<JsonLesson>>(editor);
        setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, l) => l === lessonIndex ? { ...lesson, ...value, id: lesson.id, cards: value.cards ?? lesson.cards, subLessons: value.subLessons ?? lesson.subLessons } : lesson) } : module) }));
      }
      if (step === 'cards') applyCards(parseJson<JsonCard[]>(editor));
      if (step === 'questions') setBlueprint((current) => ({ ...current, questions: parseJson<JsonQuestion[]>(editor) }));
      setMessage('JSON applied successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid JSON.');
    }
  }

  function formatEditor() {
    try { setEditor(pretty(JSON.parse(editor))); setError(null); } catch { setError('Cannot format because the JSON is invalid.'); }
  }

  function applyBulkImport() {
    try {
      const value = parseJson<JsonBlueprint>(bulkEditor);
      if (!value.course || !Array.isArray(value.modules)) throw new Error('Bulk JSON must include course and modules.');
      setBlueprint({ ...value, questions: Array.isArray(value.questions) ? value.questions : [] });
      setModuleIndex(0); setLessonIndex(0); setSubLessonIndex(null); setStep('preview');
      setMessage('Bulk JSON imported.'); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid bulk JSON.'); }
  }

  function copyFullJson() {
    void navigator.clipboard?.writeText(pretty(blueprint));
    setMessage('Full course JSON copied.');
  }

  async function saveDraft() {
    if (validation.errors.length) return setError('Fix validation errors before saving.');
    setSaving(true); setError(null); setMessage(null);
    try {
      const payload = toDraftPayload(blueprint);
      await saveShortCourseDraftWithBlueprint(payload as never);
      setMessage('Draft saved from JSON Builder.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /> JSON Builder Studio</CardTitle>
          <CardDescription>Select with buttons, edit with JSON, preview before saving. Fast like a command center, safe like the manual builder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {steps.map((item) => <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`min-w-[130px] rounded-2xl border p-3 text-left text-sm ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background'}`}><b>{item.label}</b><span className="mt-1 block text-xs text-muted-foreground">{item.hint}</span></button>)}
          </div>
          {message ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <StructurePanel blueprint={blueprint} moduleIndex={moduleIndex} lessonIndex={lessonIndex} subLessonIndex={subLessonIndex} setModule={(index) => { setModuleIndex(index); setLessonIndex(0); setSubLessonIndex(null); }} setLesson={(index) => { setLessonIndex(index); setSubLessonIndex(null); }} setSubLesson={setSubLessonIndex} addModule={addModule} removeModule={removeModule} addLesson={addLesson} removeLesson={removeLesson} addSubLesson={addSubLesson} />
          <ValidationPanel validation={validation} />
        </aside>

        <section className="space-y-6">
          {step === 'course' ? <CourseEditor course={blueprint.course} schools={schools} updateCourse={updateCourse} editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'modules' ? <JsonEditor title="Active module JSON" description="Select a module with buttons, then edit this module only." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'lessons' ? <JsonEditor title="Active lesson JSON" description="Select a lesson with buttons, then edit the lesson JSON. Sub-lessons can stay inside this lesson JSON." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'cards' ? <CardsEditor target={cardTarget} setTarget={setCardTarget} subLessonAvailable={Boolean(activeSubLesson)} editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} addCardTemplate={addCardTemplate} /> : null}
          {step === 'questions' ? <JsonEditor title="Question bank JSON" description="Paste an array of quiz questions. Keep it as JSON so it can be generated quickly." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'preview' ? <PreviewPanel blueprint={blueprint} bulkEditor={bulkEditor} setBulkEditor={setBulkEditor} applyBulkImport={applyBulkImport} copyFullJson={copyFullJson} saveDraft={saveDraft} saving={saving} validation={validation} /> : null}
        </section>
      </div>
    </div>
  );
}

function StructurePanel({ blueprint, moduleIndex, lessonIndex, subLessonIndex, setModule, setLesson, setSubLesson, addModule, removeModule, addLesson, removeLesson, addSubLesson }: { blueprint: JsonBlueprint; moduleIndex: number; lessonIndex: number; subLessonIndex: number | null; setModule: (index: number) => void; setLesson: (index: number) => void; setSubLesson: (index: number | null) => void; addModule: () => void; removeModule: (index: number) => void; addLesson: () => void; removeLesson: (index: number) => void; addSubLesson: () => void }) {
  const module = blueprint.modules[moduleIndex];
  const lesson = module?.lessons[lessonIndex];
  return <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-primary" /> Structure</CardTitle><CardDescription>Use buttons to choose what JSON edits.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between"><Label>Modules</Label><Button size="sm" type="button" onClick={addModule}><Plus className="mr-1 h-3 w-3" />Add</Button></div>{blueprint.modules.map((item, index) => <button key={item.id} type="button" onClick={() => setModule(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === moduleIndex ? 'border-primary bg-primary/10' : ''}`}><b>{item.title || `Module ${index + 1}`}</b><span className="block text-xs text-muted-foreground">{item.lessons.length} lessons</span></button>)}<Button size="sm" variant="ghost" disabled={blueprint.modules.length <= 1} onClick={() => removeModule(moduleIndex)} className="text-destructive"><Trash2 className="mr-1 h-3 w-3" /> Delete active module</Button></div><div className="space-y-2"><div className="flex items-center justify-between"><Label>Lessons</Label><Button size="sm" type="button" onClick={addLesson}><Plus className="mr-1 h-3 w-3" />Add</Button></div>{module?.lessons.map((item, index) => <button key={item.id} type="button" onClick={() => setLesson(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === lessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{item.title || `Lesson ${index + 1}`}</b><span className="block text-xs text-muted-foreground">{item.cards.length} cards · {item.subLessons.length} sub-lessons</span></button>)}<Button size="sm" variant="ghost" disabled={(module?.lessons.length ?? 0) <= 1} onClick={() => removeLesson(lessonIndex)} className="text-destructive"><Trash2 className="mr-1 h-3 w-3" /> Delete active lesson</Button></div><div className="space-y-2"><div className="flex items-center justify-between"><Label>Sub-lessons</Label><Button size="sm" type="button" onClick={addSubLesson}><Plus className="mr-1 h-3 w-3" />Add</Button></div><button type="button" onClick={() => setSubLesson(null)} className={`w-full rounded-2xl border p-3 text-left text-sm ${subLessonIndex === null ? 'border-primary bg-primary/10' : ''}`}>Main lesson cards</button>{lesson?.subLessons.map((item, index) => <button key={item.id} type="button" onClick={() => setSubLesson(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === subLessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{item.title}</b><span className="block text-xs text-muted-foreground">{item.cards.length} cards</span></button>)}</div></CardContent></Card>;
}

function CourseEditor({ course, schools, updateCourse, editor, setEditor, applyEditor, formatEditor }: { course: JsonCourse; schools: School[]; updateCourse: (patch: Partial<JsonCourse>) => void; editor: string; setEditor: (value: string) => void; applyEditor: () => void; formatEditor: () => void }) {
  return <div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Course basics</CardTitle><CardDescription>Quick fields for common data. The JSON below stays in sync when you switch steps.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Title"><Input value={course.title} onChange={(e) => updateCourse({ title: e.target.value })} /></Field><Field label="Level"><Input value={course.level} onChange={(e) => updateCourse({ level: e.target.value })} /></Field><Field label="School"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={course.schoolId} onChange={(e) => updateCourse({ schoolId: e.target.value })}><option value="">Select school</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field><Field label="Currency"><Input value={course.currency} onChange={(e) => updateCourse({ currency: e.target.value })} /></Field><Field label="Duration hours"><Input type="number" value={course.durationHours} onChange={(e) => updateCourse({ durationHours: Number(e.target.value) || 0 })} /></Field><Field label="Entry fee"><Input type="number" value={course.entryFee} onChange={(e) => updateCourse({ entryFee: Number(e.target.value) || 0 })} /></Field><Field label="Certificate fee"><Input type="number" value={course.certificateFee} onChange={(e) => updateCourse({ certificateFee: Number(e.target.value) || 0 })} /></Field><Field label="Outcomes, one per line"><Textarea value={course.outcomes.join('\n')} onChange={(e) => updateCourse({ outcomes: lines(e.target.value) })} /></Field><div className="md:col-span-2"><Field label="Description"><Textarea value={course.description} rows={4} onChange={(e) => updateCourse({ description: e.target.value })} /></Field></div></CardContent></Card><JsonEditor title="Course basics JSON" description="Paste or edit only course-level JSON here." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /></div>;
}

function JsonEditor({ title, description, editor, setEditor, applyEditor, formatEditor }: { title: string; description: string; editor: string; setEditor: (value: string) => void; applyEditor: () => void; formatEditor: () => void }) {
  return <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><Clipboard className="h-5 w-5 text-primary" /> {title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={editor} onChange={(e) => setEditor(e.target.value)} rows={18} spellCheck={false} className="min-h-[360px] font-mono text-xs md:text-sm" /><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" onClick={applyEditor} className="w-full sm:w-auto"><CheckCircle2 className="mr-2 h-4 w-4" />Apply JSON</Button><Button type="button" variant="outline" onClick={formatEditor} className="w-full sm:w-auto"><FileJson className="mr-2 h-4 w-4" />Format</Button></div></CardContent></Card>;
}

function CardsEditor({ target, setTarget, subLessonAvailable, editor, setEditor, applyEditor, formatEditor, addCardTemplate }: { target: CardTarget; setTarget: (value: CardTarget) => void; subLessonAvailable: boolean; editor: string; setEditor: (value: string) => void; applyEditor: () => void; formatEditor: () => void; addCardTemplate: (card: JsonCard) => void }) {
  return <div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Card design shortcuts</CardTitle><CardDescription>Borrow design ideas from the manual builder, but insert them as JSON.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><Button variant={target === 'lesson' ? 'default' : 'outline'} onClick={() => setTarget('lesson')}>Main lesson cards</Button><Button variant={target === 'subLesson' ? 'default' : 'outline'} disabled={!subLessonAvailable} onClick={() => setTarget('subLesson')}>Active sub-lesson cards</Button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{cardTemplates.map((item) => <Button key={item.label} type="button" variant="outline" className="justify-start" onClick={() => addCardTemplate(item.card)}><Sparkles className="mr-2 h-4 w-4" />{item.label}</Button>)}</div></CardContent></Card><JsonEditor title="Cards JSON" description="Edit an array of card objects for the selected lesson or sub-lesson." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /></div>;
}

function PreviewPanel({ blueprint, bulkEditor, setBulkEditor, applyBulkImport, copyFullJson, saveDraft, saving, validation }: { blueprint: JsonBlueprint; bulkEditor: string; setBulkEditor: (value: string) => void; applyBulkImport: () => void; copyFullJson: () => void; saveDraft: () => void; saving: boolean; validation: { errors: string[]; warnings: string[] } }) {
  return <div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Live preview</CardTitle><CardDescription>What students will roughly see: stages, missions, side missions, and cards.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Mission Control</p><h2 className="text-2xl font-bold">{blueprint.course.title}</h2><p className="mt-2 text-sm text-muted-foreground">{blueprint.course.description}</p></div>{blueprint.modules.map((module, m) => <div key={module.id} className="rounded-3xl border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Stage {m + 1}</p><h3 className="text-xl font-bold">{module.title}</h3><p className="text-sm text-muted-foreground">{module.description}</p><div className="mt-3 space-y-2">{module.lessons.map((lesson, l) => <div key={lesson.id} className="rounded-2xl border bg-background p-3"><p className="font-semibold">Mission {l + 1}: {lesson.title}</p><p className="text-sm text-muted-foreground">{lesson.summary}</p><p className="mt-1 text-xs text-muted-foreground">{lesson.cards.length} cards · {lesson.subLessons.length} side missions</p></div>)}</div></div>)}</CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Bulk JSON import / export</CardTitle><CardDescription>Paste a full course JSON here when AI generates the whole structure.</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={bulkEditor} onChange={(e) => setBulkEditor(e.target.value)} rows={14} spellCheck={false} className="font-mono text-xs" /><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={applyBulkImport}><FileJson className="mr-2 h-4 w-4" />Import full JSON</Button><Button type="button" variant="outline" onClick={copyFullJson}><Copy className="mr-2 h-4 w-4" />Copy full JSON</Button><Button type="button" onClick={saveDraft} disabled={saving || validation.errors.length > 0}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save draft'}</Button></div></CardContent></Card></div>;
}

function ValidationPanel({ validation }: { validation: { errors: string[]; warnings: string[] } }) {
  return <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Validation</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{validation.errors.length === 0 && validation.warnings.length === 0 ? <p className="rounded-2xl border border-primary/20 bg-primary/5 p-3">No issues found.</p> : null}{validation.errors.map((item) => <p key={item} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive"><AlertTriangle className="mr-2 inline h-4 w-4" />{item}</p>)}{validation.warnings.map((item) => <p key={item} className="rounded-2xl border bg-muted/40 p-3"><AlertTriangle className="mr-2 inline h-4 w-4" />{item}</p>)}</CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }

function validateBlueprint(blueprint: JsonBlueprint) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!blueprint.course.title.trim()) errors.push('Course title is required.');
  if (!blueprint.course.schoolId.trim()) warnings.push('School is not selected. Saving may fail if the backend requires schoolId.');
  if (!blueprint.modules.length) errors.push('At least one module is required.');
  blueprint.modules.forEach((module, m) => {
    if (!module.title.trim()) errors.push(`Module ${m + 1} needs a title.`);
    if (!module.lessons.length) errors.push(`Module ${m + 1} needs at least one lesson.`);
    module.lessons.forEach((lesson, l) => {
      if (!lesson.title.trim()) errors.push(`Module ${m + 1}, lesson ${l + 1} needs a title.`);
      if (!lesson.cards.length && !lesson.subLessons.some((sub) => sub.cards.length)) warnings.push(`Module ${m + 1}, lesson ${l + 1} has no cards yet.`);
    });
  });
  return { errors, warnings };
}

function toDraftPayload(blueprint: JsonBlueprint) {
  const course = blueprint.course;
  return {
    sourceMode: 'new',
    course: {
      id: `json-${Date.now()}`,
      title: course.title,
      description: course.description,
      schoolId: course.schoolId,
      imageId: '',
      status: 'draft',
      level: course.level,
      durationHours: course.durationHours,
      price: String(course.entryFee ?? 0),
      currency: course.currency || 'ZMW',
      certificateFee: String(course.certificateFee ?? 0),
      certificateCurrency: course.currency || 'ZMW',
      modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description })),
      lessons: blueprint.modules.flatMap((module) => module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary }))),
      outcomes: course.outcomes,
    },
    blueprint: {
      courseSummary: { title: course.title, audience: course.audience, level: course.level, description: course.description, prerequisites: course.prerequisites, totalDurationHours: course.durationHours, outcomes: course.outcomes, finalAssessment: 'Complete all questions and final project.', certificateCriteria: 'Complete the learning path and pass assessment.' },
      assessments: { quizzes: blueprint.questions.map((q) => q.question), practicalWork: [], instructorReviewChecklist: [] },
      modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description, durationMinutes: Math.max(30, Math.round((course.durationHours * 60) / Math.max(1, blueprint.modules.length))), outcomes: module.outcomes, moduleAssessment: 'Complete all missions in this stage.', lessons: module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: 30, outcomes: lesson.outcomes, activities: [`Cards JSON: ${JSON.stringify(lesson.cards)}`, `Sub-lessons JSON: ${JSON.stringify(lesson.subLessons)}`], assessment: 'Complete practice checks.' })) })),
    },
  };
}
