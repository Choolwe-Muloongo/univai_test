'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, Copy, FileJson, Layers3, ListChecks, Plus, RefreshCw, Save, Sparkles, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getCourses, getLessonsByCourse, getSchools } from '@/lib/api';
import type { Course, Lesson, School } from '@/lib/api/types';

type Step = 'course' | 'modules' | 'lessons' | 'cards' | 'questions' | 'preview';
type CardTarget = 'lesson' | 'subLesson';
type SaveStatus = 'draft' | 'published';
type JsonCard = Record<string, unknown>;
type JsonSubLesson = { id: string; title: string; summary: string; cards: JsonCard[] };
type JsonLesson = { id: string; title: string; summary: string; outcomes: string[]; subLessons: JsonSubLesson[]; cards: JsonCard[] };
type JsonModule = { id: string; title: string; description: string; outcomes: string[]; lessons: JsonLesson[] };
type JsonQuestion = { id: string; type: string; difficulty: string; question: string; options?: string[]; answer: string; explanation?: string };
type JsonCourse = { title: string; description: string; schoolId: string; level: string; durationHours: number; entryFee: number; currency: string; certificateFee: number; outcomes: string[]; audience: string; prerequisites: string[] };
type JsonBlueprint = { course: JsonCourse; modules: JsonModule[]; questions: JsonQuestion[] };
type ValidationResult = { errors: string[]; warnings: string[] };

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const steps: Array<{ id: Step; label: string; hint: string }> = [
  { id: 'course', label: 'Course', hint: 'Basics JSON' },
  { id: 'modules', label: 'Modules', hint: 'Button select' },
  { id: 'lessons', label: 'Lessons', hint: 'Mission JSON' },
  { id: 'cards', label: 'Cards', hint: 'Design JSON' },
  { id: 'questions', label: 'Questions', hint: 'Quiz JSON' },
  { id: 'preview', label: 'Preview', hint: 'Save / publish' },
];

const cardTemplates: Array<{ label: string; card: JsonCard }> = [
  { label: 'Hero', card: { type: 'hero', title: 'Big idea', body: 'Introduce the mission with a strong opening.' } },
  { label: 'Callout', card: { type: 'callout', tone: 'info', title: 'Remember', body: 'Highlight an important idea.' } },
  { label: 'Checklist', card: { type: 'checklist', title: 'Mission checklist', items: ['Read', 'Try', 'Answer'] } },
  { label: 'Quiz', card: { type: 'quiz', question: 'What is the answer?', options: ['A', 'B', 'C'], answer: 'A', explanation: 'Explain why.' } },
  { label: 'Code', card: { type: 'code', language: 'html', title: 'Example', code: '<h1>Hello UnivAI</h1>' } },
  { label: 'Image', card: { type: 'image', title: 'Visual example', imageUrl: 'https://example.com/image.png', caption: 'Explain the image.' } },
  { label: 'Venn', card: { type: 'venn', title: 'A ∩ B', setCount: 2, labels: ['A', 'B'], highlight: 'intersection', description: 'Use this to explain union, intersection, difference, complement, or outside regions.' } },
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
  questions: [{ id: uid('question'), type: 'mcq', difficulty: 'easy', question: 'What does HTML mainly provide?', options: ['Structure', 'Database storage', 'Internet speed'], answer: 'Structure', explanation: 'HTML describes page structure.' }],
};

export function JsonCourseBuilderStudio() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingExisting, setLoadingExisting] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('draft');
  const [step, setStep] = useState<Step>('preview');
  const [blueprint, setBlueprint] = useState<JsonBlueprint>(initialBlueprint);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [subLessonIndex, setSubLessonIndex] = useState<number | null>(null);
  const [cardTarget, setCardTarget] = useState<CardTarget>('lesson');
  const [editor, setEditor] = useState(pretty(initialBlueprint.course));
  const [bulkEditor, setBulkEditor] = useState(pretty(initialBlueprint));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { void refreshCatalog(); }, []);

  async function refreshCatalog() {
    const [schoolData, courseData] = await Promise.all([getSchools().catch(() => []), getCourses().catch(() => [])]);
    setSchools(schoolData);
    setCourses(courseData);
    if (!blueprint.course.schoolId && schoolData[0]) {
      setBlueprint((current) => withDefaultSchool(current, schoolData));
      setBulkEditor((currentText) => {
        try { return pretty(withDefaultSchool(parseImportedBlueprint(currentText), schoolData)); }
        catch { return currentText; }
      });
    }
  }

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

  function resetSelection() {
    setModuleIndex(0);
    setLessonIndex(0);
    setSubLessonIndex(null);
    setCardTarget('lesson');
  }

  function importBlueprint(nextBlueprint: JsonBlueprint, successMessage: string) {
    const normalized = withDefaultSchool(nextBlueprint, schools);
    setBlueprint(normalized);
    setBulkEditor(pretty(normalized));
    setEditingCourseId(null);
    resetSelection();
    setStep('preview');
    setMessage(successMessage);
    setError(null);
  }

  function updateCourse(patch: Partial<JsonCourse>) {
    setBlueprint((current) => {
      const next = { ...current, course: { ...current.course, ...patch } };
      setBulkEditor(pretty(next));
      return next;
    });
  }
  function updateModule(index: number, patch: Partial<JsonModule>) { setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === index ? { ...module, ...patch } : module) })); }
  function addModule() { setBlueprint((current) => ({ ...current, modules: [...current.modules, makeModule(current.modules.length)] })); setModuleIndex(blueprint.modules.length); setLessonIndex(0); setSubLessonIndex(null); }
  function removeModule(index: number) { if (blueprint.modules.length <= 1) return setError('A course must keep at least one module.'); setBlueprint((current) => ({ ...current, modules: current.modules.filter((_, i) => i !== index) })); setModuleIndex(Math.max(0, index - 1)); setLessonIndex(0); setSubLessonIndex(null); }
  function addLesson() { if (!activeModule) return; setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: [...module.lessons, makeLesson(module.lessons.length)] } : module) })); setLessonIndex(activeModule.lessons.length); setSubLessonIndex(null); }
  function removeLesson(index: number) { if (!activeModule) return; if (activeModule.lessons.length <= 1) return setError('A module must keep at least one lesson.'); setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.filter((_, l) => l !== index) } : module) })); setLessonIndex(Math.max(0, index - 1)); setSubLessonIndex(null); }
  function addSubLesson() { if (!activeLesson) return; const next: JsonSubLesson = { id: uid('sub'), title: `Sub-lesson ${activeLesson.subLessons.length + 1}`, summary: 'Describe this sub-lesson.', cards: [] }; setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, l) => l === lessonIndex ? { ...lesson, subLessons: [...lesson.subLessons, next] } : lesson) } : module) })); setSubLessonIndex(activeLesson.subLessons.length); setCardTarget('subLesson'); }
  function applyCards(cards: JsonCard[]) { setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, l) => { if (l !== lessonIndex) return lesson; if (cardTarget === 'subLesson' && subLessonIndex !== null) return { ...lesson, subLessons: lesson.subLessons.map((sub, s) => s === subLessonIndex ? { ...sub, cards } : sub) }; return { ...lesson, cards }; }) } : module) })); }
  function addCardTemplate(card: JsonCard) { const nextCards = [...activeCards, { ...card }]; applyCards(nextCards); setEditor(pretty(nextCards)); }

  function applyEditor() {
    try {
      setError(null);
      if (step === 'course') {
        const value = normalizeCourse(parseJson<Record<string, unknown>>(editor));
        setBlueprint((current) => ({ ...current, course: { ...current.course, ...value } }));
        setEditor(pretty(value));
      }
      if (step === 'modules') {
        const value = normalizeModule(parseJson<Record<string, unknown>>(editor), moduleIndex);
        updateModule(moduleIndex, { ...value, id: activeModule?.id ?? value.id, lessons: value.lessons.length ? value.lessons : activeModule?.lessons ?? [makeLesson(0)] });
        setEditor(pretty(value));
      }
      if (step === 'lessons') {
        const value = normalizeLesson(parseJson<Record<string, unknown>>(editor), lessonIndex);
        setBlueprint((current) => ({ ...current, modules: current.modules.map((module, i) => i === moduleIndex ? { ...module, lessons: module.lessons.map((lesson, l) => l === lessonIndex ? { ...lesson, ...value, id: lesson.id } : lesson) } : module) }));
        setEditor(pretty(value));
      }
      if (step === 'cards') {
        const value = normalizeCards(parseJson<unknown>(editor));
        applyCards(value);
        setEditor(pretty(value));
      }
      if (step === 'questions') {
        const value = normalizeQuestions(parseJson<unknown>(editor));
        setBlueprint((current) => ({ ...current, questions: value }));
        setEditor(pretty(value));
      }
      setMessage('JSON applied successfully.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid JSON.'); }
  }

  function formatEditor() { try { setEditor(pretty(JSON.parse(editor))); setError(null); } catch { setError('Cannot format because the JSON is invalid.'); } }
  function formatBulkEditor() { try { setBulkEditor(pretty(parseImportedBlueprint(bulkEditor))); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Cannot format because the JSON is invalid.'); } }
  function applyBulkImport() {
    try { importBlueprint(parseImportedBlueprint(bulkEditor), 'Full JSON imported and normalized.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid bulk JSON.'); }
  }

  async function handleJsonFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json') && file.type && file.type !== 'application/json') {
      setError('Please upload a .json file.');
      return;
    }
    try {
      const text = await file.text();
      importBlueprint(parseImportedBlueprint(text), `${file.name} imported and normalized. You can now review, fix, save, or publish.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not import this JSON file.'); }
  }

  function copyFullJson() { void navigator.clipboard?.writeText(pretty(blueprint)); setMessage('Full course JSON copied.'); }
  async function loadExistingCourse(course: Course) { setLoadingExisting(course.id); setError(null); setMessage(null); try { const lessons = await getLessonsByCourse(course.id); const next = jsonFromExistingCourse(course, lessons); setBlueprint(next); setBulkEditor(pretty(next)); setEditingCourseId(course.id); setSaveStatus(course.status === 'published' ? 'published' : 'draft'); resetSelection(); setStep('preview'); setMessage(`Loaded ${course.title} into JSON Builder.`); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load this course into JSON Builder.'); } finally { setLoadingExisting(null); } }
  async function saveCourse(status: SaveStatus = saveStatus) { if (validation.errors.length) return setError('Fix validation errors before saving.'); setSaving(true); setError(null); setMessage(null); try { await createShortCourseDraftWithBlueprint(toDraftPayload(blueprint, status, editingCourseId) as never); setSaveStatus(status); setMessage(status === 'published' ? 'Course published from JSON Builder.' : 'Draft saved from JSON Builder.'); await refreshCatalog(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save this course.'); } finally { setSaving(false); } }

  return (
    <div className="space-y-6">
      <input ref={uploadInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleJsonFileUpload} />
      <Header step={step} setStep={setStep} message={message} error={error} editingCourseId={editingCourseId} onUploadClick={() => uploadInputRef.current?.click()} />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <StructurePanel blueprint={blueprint} moduleIndex={moduleIndex} lessonIndex={lessonIndex} subLessonIndex={subLessonIndex} setModule={(index) => { setModuleIndex(index); setLessonIndex(0); setSubLessonIndex(null); }} setLesson={(index) => { setLessonIndex(index); setSubLessonIndex(null); }} setSubLesson={setSubLessonIndex} addModule={addModule} removeModule={removeModule} addLesson={addLesson} removeLesson={removeLesson} addSubLesson={addSubLesson} />
          <ValidationPanel validation={validation} />
          <ExistingCoursesPanel courses={courses} loadingExisting={loadingExisting} onRefresh={refreshCatalog} onLoad={loadExistingCourse} />
        </aside>
        <section className="space-y-6">
          {step === 'course' ? <CourseEditor course={blueprint.course} schools={schools} updateCourse={updateCourse} editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'modules' ? <JsonEditor title="Active module JSON" description="Select a module with buttons, then edit this module only." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'lessons' ? <JsonEditor title="Active lesson JSON" description="Select a lesson with buttons, then edit the lesson JSON. Sub-lessons can stay inside this lesson JSON." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'cards' ? <CardsEditor target={cardTarget} setTarget={setCardTarget} subLessonAvailable={Boolean(activeSubLesson)} editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} addCardTemplate={addCardTemplate} /> : null}
          {step === 'questions' ? <JsonEditor title="Question bank JSON" description="Paste an array of quiz questions. Keep it as JSON so it can be generated quickly." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /> : null}
          {step === 'preview' ? <PreviewPanel blueprint={blueprint} bulkEditor={bulkEditor} setBulkEditor={setBulkEditor} applyBulkImport={applyBulkImport} formatBulkEditor={formatBulkEditor} handleJsonFileUpload={handleJsonFileUpload} copyFullJson={copyFullJson} saveCourse={saveCourse} saveStatus={saveStatus} setSaveStatus={setSaveStatus} saving={saving} validation={validation} editingCourseId={editingCourseId} onUploadClick={() => uploadInputRef.current?.click()} /> : null}
        </section>
      </div>
    </div>
  );
}

function Header({ step, setStep, message, error, editingCourseId, onUploadClick }: { step: Step; setStep: (step: Step) => void; message: string | null; error: string | null; editingCourseId: string | null; onUploadClick: () => void }) { return <Card className="rounded-3xl border-primary/20"><CardHeader><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /> JSON Builder Studio</CardTitle><CardDescription>Select with buttons, edit with JSON, preview before saving. {editingCourseId ? `Editing course ID: ${editingCourseId}` : 'Create new courses or load existing saved/published courses.'}</CardDescription></div><Button type="button" onClick={onUploadClick}><Upload className="mr-2 h-4 w-4" />Upload JSON</Button></div></CardHeader><CardContent className="space-y-4"><div className="flex gap-2 overflow-x-auto pb-2">{steps.map((item) => <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`min-w-[130px] rounded-2xl border p-3 text-left text-sm ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background'}`}><b>{item.label}</b><span className="mt-1 block text-xs text-muted-foreground">{item.hint}</span></button>)}</div>{message ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}{error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}</CardContent></Card>; }
function StructurePanel({ blueprint, moduleIndex, lessonIndex, subLessonIndex, setModule, setLesson, setSubLesson, addModule, removeModule, addLesson, removeLesson, addSubLesson }: { blueprint: JsonBlueprint; moduleIndex: number; lessonIndex: number; subLessonIndex: number | null; setModule: (index: number) => void; setLesson: (index: number) => void; setSubLesson: (index: number | null) => void; addModule: () => void; removeModule: (index: number) => void; addLesson: () => void; removeLesson: (index: number) => void; addSubLesson: () => void }) { const module = blueprint.modules[moduleIndex]; const lesson = module?.lessons[lessonIndex]; return <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-primary" /> Structure</CardTitle><CardDescription>Use buttons to choose what JSON edits.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between"><Label>Modules</Label><Button size="sm" type="button" onClick={addModule}><Plus className="mr-1 h-3 w-3" />Add</Button></div>{blueprint.modules.map((item, index) => <button key={item.id} type="button" onClick={() => setModule(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === moduleIndex ? 'border-primary bg-primary/10' : ''}`}><b>{item.title || `Module ${index + 1}`}</b><span className="block text-xs text-muted-foreground">{item.lessons.length} lessons</span></button>)}<Button size="sm" variant="ghost" disabled={blueprint.modules.length <= 1} onClick={() => removeModule(moduleIndex)} className="text-destructive"><Trash2 className="mr-1 h-3 w-3" /> Delete active module</Button></div><div className="space-y-2"><div className="flex items-center justify-between"><Label>Lessons</Label><Button size="sm" type="button" onClick={addLesson}><Plus className="mr-1 h-3 w-3" />Add</Button></div>{module?.lessons.map((item, index) => <button key={item.id} type="button" onClick={() => setLesson(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === lessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{item.title || `Lesson ${index + 1}`}</b><span className="block text-xs text-muted-foreground">{item.cards.length} cards · {item.subLessons.length} sub-lessons</span></button>)}<Button size="sm" variant="ghost" disabled={(module?.lessons.length ?? 0) <= 1} onClick={() => removeLesson(lessonIndex)} className="text-destructive"><Trash2 className="mr-1 h-3 w-3" /> Delete active lesson</Button></div><div className="space-y-2"><div className="flex items-center justify-between"><Label>Sub-lessons</Label><Button size="sm" type="button" onClick={addSubLesson}><Plus className="mr-1 h-3 w-3" />Add</Button></div><button type="button" onClick={() => setSubLesson(null)} className={`w-full rounded-2xl border p-3 text-left text-sm ${subLessonIndex === null ? 'border-primary bg-primary/10' : ''}`}>Main lesson cards</button>{lesson?.subLessons.map((item, index) => <button key={item.id} type="button" onClick={() => setSubLesson(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === subLessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{item.title}</b><span className="block text-xs text-muted-foreground">{item.cards.length} cards</span></button>)}</div></CardContent></Card>; }
function ExistingCoursesPanel({ courses, loadingExisting, onRefresh, onLoad }: { courses: Course[]; loadingExisting: string | null; onRefresh: () => void; onLoad: (course: Course) => void }) { return <Card className="rounded-3xl"><CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>Existing courses</CardTitle><CardDescription>Load draft, unpublished, or published courses into JSON.</CardDescription></div><Button size="sm" type="button" variant="outline" onClick={onRefresh}><RefreshCw className="h-3 w-3" /></Button></div></CardHeader><CardContent className="max-h-[420px] space-y-2 overflow-y-auto">{courses.length ? courses.map((course) => <div key={course.id} className="rounded-2xl border p-3 text-sm"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{course.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{course.description}</p><p className="mt-1 text-xs text-muted-foreground">Status: {course.status || 'draft'}</p></div><Button size="sm" type="button" variant="outline" disabled={loadingExisting === course.id} onClick={() => onLoad(course)}>{loadingExisting === course.id ? 'Loading...' : 'Edit'}</Button></div></div>) : <p className="text-sm text-muted-foreground">No existing courses found.</p>}</CardContent></Card>; }
function CourseEditor({ course, schools, updateCourse, editor, setEditor, applyEditor, formatEditor }: { course: JsonCourse; schools: School[]; updateCourse: (patch: Partial<JsonCourse>) => void; editor: string; setEditor: (value: string) => void; applyEditor: () => void; formatEditor: () => void }) { return <div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Course basics</CardTitle><CardDescription>Quick fields for common data. The JSON below is for course-level data only.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Title"><Input value={course.title} onChange={(e) => updateCourse({ title: e.target.value })} /></Field><Field label="Level"><Input value={course.level} onChange={(e) => updateCourse({ level: e.target.value })} /></Field><Field label="School"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={course.schoolId} onChange={(e) => updateCourse({ schoolId: e.target.value })}><option value="">Select school</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field><Field label="Currency"><Input value={course.currency} onChange={(e) => updateCourse({ currency: e.target.value })} /></Field><Field label="Duration hours"><Input type="number" value={course.durationHours} onChange={(e) => updateCourse({ durationHours: Number(e.target.value) || 0 })} /></Field><Field label="Entry fee"><Input type="number" value={course.entryFee} onChange={(e) => updateCourse({ entryFee: Number(e.target.value) || 0 })} /></Field><Field label="Certificate fee"><Input type="number" value={course.certificateFee} onChange={(e) => updateCourse({ certificateFee: Number(e.target.value) || 0 })} /></Field><Field label="Outcomes, one per line"><Textarea value={course.outcomes.join('\n')} onChange={(e) => updateCourse({ outcomes: lines(e.target.value) })} /></Field><div className="md:col-span-2"><Field label="Description"><Textarea value={course.description} rows={4} onChange={(e) => updateCourse({ description: e.target.value })} /></Field></div></CardContent></Card><JsonEditor title="Course basics JSON" description="Paste or edit only course-level JSON here." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /></div>; }
function JsonEditor({ title, description, editor, setEditor, applyEditor, formatEditor }: { title: string; description: string; editor: string; setEditor: (value: string) => void; applyEditor: () => void; formatEditor: () => void }) { return <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><Clipboard className="h-5 w-5 text-primary" /> {title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={editor} onChange={(e) => setEditor(e.target.value)} rows={18} spellCheck={false} className="min-h-[360px] font-mono text-xs md:text-sm" /><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" onClick={applyEditor} className="w-full sm:w-auto"><CheckCircle2 className="mr-2 h-4 w-4" />Apply JSON</Button><Button type="button" variant="outline" onClick={formatEditor} className="w-full sm:w-auto"><FileJson className="mr-2 h-4 w-4" />Format</Button></div></CardContent></Card>; }
function CardsEditor({ target, setTarget, subLessonAvailable, editor, setEditor, applyEditor, formatEditor, addCardTemplate }: { target: CardTarget; setTarget: (value: CardTarget) => void; subLessonAvailable: boolean; editor: string; setEditor: (value: string) => void; applyEditor: () => void; formatEditor: () => void; addCardTemplate: (card: JsonCard) => void }) { return <div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Card design shortcuts</CardTitle><CardDescription>Borrow design ideas from the manual builder, but insert them as JSON.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><Button variant={target === 'lesson' ? 'default' : 'outline'} onClick={() => setTarget('lesson')}>Main lesson cards</Button><Button variant={target === 'subLesson' ? 'default' : 'outline'} disabled={!subLessonAvailable} onClick={() => setTarget('subLesson')}>Active sub-lesson cards</Button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{cardTemplates.map((item) => <Button key={item.label} type="button" variant="outline" className="justify-start" onClick={() => addCardTemplate(item.card)}><Sparkles className="mr-2 h-4 w-4" />{item.label}</Button>)}</div></CardContent></Card><JsonEditor title="Cards JSON" description="Edit an array of card objects for the selected lesson or sub-lesson." editor={editor} setEditor={setEditor} applyEditor={applyEditor} formatEditor={formatEditor} /></div>; }
function PreviewPanel({ blueprint, bulkEditor, setBulkEditor, applyBulkImport, formatBulkEditor, handleJsonFileUpload, copyFullJson, saveCourse, saveStatus, setSaveStatus, saving, validation, editingCourseId, onUploadClick }: { blueprint: JsonBlueprint; bulkEditor: string; setBulkEditor: (value: string) => void; applyBulkImport: () => void; formatBulkEditor: () => void; handleJsonFileUpload: (event: ChangeEvent<HTMLInputElement>) => void; copyFullJson: () => void; saveCourse: (status?: SaveStatus) => void; saveStatus: SaveStatus; setSaveStatus: (status: SaveStatus) => void; saving: boolean; validation: ValidationResult; editingCourseId: string | null; onUploadClick: () => void }) { return <div className="space-y-6"><Card className="rounded-3xl"><CardHeader><CardTitle>Live preview</CardTitle><CardDescription>{editingCourseId ? 'Loaded course preview.' : 'New course preview.'} Stages, missions, side missions, and cards.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Mission Control</p><h2 className="text-2xl font-bold">{blueprint.course.title}</h2><p className="mt-2 text-sm text-muted-foreground">{blueprint.course.description}</p></div>{blueprint.modules.map((module, m) => <div key={module.id} className="rounded-3xl border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Stage {m + 1}</p><h3 className="text-xl font-bold">{module.title}</h3><p className="text-sm text-muted-foreground">{module.description}</p><div className="mt-3 space-y-2">{module.lessons.map((lesson, l) => <div key={lesson.id} className="rounded-2xl border bg-background p-3"><p className="font-semibold">Mission {l + 1}: {lesson.title}</p><p className="text-sm text-muted-foreground">{lesson.summary}</p><p className="mt-1 text-xs text-muted-foreground">{lesson.cards.length} cards · {lesson.subLessons.length} side missions</p></div>)}</div></div>)}</CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Save, publish, import, export</CardTitle><CardDescription>Upload a full course JSON file, paste a full JSON course, fix anything here, then save or publish.</CardDescription></CardHeader><CardContent className="space-y-3"><Field label="Upload full course JSON file"><label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center text-sm transition hover:border-primary hover:bg-primary/5" onClick={onUploadClick}><Upload className="mb-2 h-5 w-5 text-primary" /><span className="font-medium">Choose .json file</span><span className="text-xs text-muted-foreground">The file will fill the editor below and import into the builder.</span><input type="file" accept="application/json,.json" className="sr-only" onChange={handleJsonFileUpload} /></label></Field><Field label="Save status"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={saveStatus} onChange={(e) => setSaveStatus(e.target.value as SaveStatus)}><option value="draft">Draft / unpublished</option><option value="published">Published</option></select></Field><Textarea value={bulkEditor} onChange={(e) => setBulkEditor(e.target.value)} rows={14} spellCheck={false} className="font-mono text-xs" /><div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={applyBulkImport}><FileJson className="mr-2 h-4 w-4" />Import full JSON</Button><Button type="button" variant="outline" onClick={formatBulkEditor}><Sparkles className="mr-2 h-4 w-4" />Normalize / format</Button><Button type="button" variant="outline" onClick={copyFullJson}><Copy className="mr-2 h-4 w-4" />Copy full JSON</Button><Button type="button" onClick={() => saveCourse('draft')} disabled={saving || validation.errors.length > 0}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save draft'}</Button><Button type="button" onClick={() => saveCourse('published')} disabled={saving || validation.errors.length > 0}>Publish now</Button></div></CardContent></Card></div>; }
function ValidationPanel({ validation }: { validation: ValidationResult }) { return <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Validation</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{validation.errors.length === 0 && validation.warnings.length === 0 ? <p className="rounded-2xl border border-primary/20 bg-primary/5 p-3">No issues found.</p> : null}{validation.errors.map((item) => <p key={item} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive"><AlertTriangle className="mr-2 inline h-4 w-4" />{item}</p>)}{validation.warnings.map((item) => <p key={item} className="rounded-2xl border bg-muted/40 p-3"><AlertTriangle className="mr-2 inline h-4 w-4" />{item}</p>)}</CardContent></Card>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }

function makeLesson(index: number): JsonLesson { return { id: uid('lesson'), title: `Lesson ${index + 1}`, summary: 'Describe this lesson.', outcomes: ['Understand the main idea.'], subLessons: [], cards: [] }; }
function makeModule(index: number): JsonModule { return { id: uid('module'), title: `Module ${index + 1}`, description: 'Describe this module.', outcomes: ['Complete this stage.'], lessons: [makeLesson(0)] }; }
function pretty(value: unknown) { return JSON.stringify(value, null, 2); }
function parseJson<T>(text: string): T { return JSON.parse(text.replace(/^\uFEFF/, '')) as T; }
function lines(value: string) { return value.split('\n').map((line) => line.trim()).filter(Boolean); }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function asString(value: unknown, fallback = '') { return typeof value === 'string' ? value : value == null ? fallback : String(value); }
function asNumber(value: unknown, fallback = 0) { const next = Number(value); return Number.isFinite(next) ? next : fallback; }
function asStringArray(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => asString(item).trim()).filter(Boolean) : typeof value === 'string' ? lines(value) : []; }
function normalizeCards(cards: unknown): JsonCard[] { return Array.isArray(cards) ? cards.filter((card): card is JsonCard => Boolean(card) && typeof card === 'object' && !Array.isArray(card)) : []; }
function normalizeCourse(value: Record<string, unknown>): JsonCourse { return { title: asString(value.title, 'Untitled course'), description: asString(value.description ?? value.summary, 'Describe this course.'), schoolId: asString(value.schoolId ?? value.school_id), level: asString(value.level, 'beginner'), durationHours: asNumber(value.durationHours ?? value.duration_hours ?? value.duration, 8), entryFee: asNumber(value.entryFee ?? value.entry_fee ?? value.price, 0), currency: asString(value.currency, 'ZMW'), certificateFee: asNumber(value.certificateFee ?? value.certificate_fee, 0), outcomes: asStringArray(value.outcomes), audience: asString(value.audience, 'Learners'), prerequisites: asStringArray(value.prerequisites) }; }
function normalizeSubLesson(value: unknown, index: number): JsonSubLesson { const record = asRecord(value); return { id: asString(record.id, uid('sub')), title: asString(record.title ?? record.name, `Sub-lesson ${index + 1}`), summary: asString(record.summary ?? record.description ?? record.content, 'Describe this sub-lesson.'), cards: normalizeCards(record.cards ?? record.blocks ?? record.learningCards) }; }
function normalizeLesson(value: unknown, index: number): JsonLesson { const record = asRecord(value); return { id: asString(record.id, uid('lesson')), title: asString(record.title ?? record.name, `Lesson ${index + 1}`), summary: asString(record.summary ?? record.description ?? record.content, 'Describe this lesson.'), outcomes: asStringArray(record.outcomes), subLessons: Array.isArray(record.subLessons ?? record.sub_lessons) ? (record.subLessons ?? record.sub_lessons as unknown[]).map(normalizeSubLesson) : [], cards: normalizeCards(record.cards ?? record.blocks ?? record.learningObjects ?? record.learning_cards) }; }
function normalizeModule(value: unknown, index: number): JsonModule { const record = asRecord(value); return { id: asString(record.id, uid('module')), title: asString(record.title ?? record.name, `Module ${index + 1}`), description: asString(record.description ?? record.summary, 'Describe this module.'), outcomes: asStringArray(record.outcomes), lessons: Array.isArray(record.lessons) ? record.lessons.map(normalizeLesson) : [makeLesson(0)] }; }
function normalizeQuestions(value: unknown): JsonQuestion[] { const questions = Array.isArray(value) ? value : Array.isArray(asRecord(value).questions) ? asRecord(value).questions as unknown[] : []; return questions.map((question, index) => { const record = asRecord(question); return { id: asString(record.id, uid('question')), type: asString(record.type, 'mcq'), difficulty: asString(record.difficulty, 'easy'), question: asString(record.question ?? record.prompt, `Question ${index + 1}`), options: Array.isArray(record.options) ? record.options.map((option) => asString(option)).filter(Boolean) : undefined, answer: asString(record.answer ?? record.correctAnswer ?? record.correct_answer), explanation: asString(record.explanation) }; }); }
function parseImportedBlueprint(text: string): JsonBlueprint { const raw = parseJson<unknown>(text); const record = asRecord(raw); const courseRecord = asRecord(record.course ?? record.courseSummary ?? record.course_summary); const modulesSource = Array.isArray(record.modules) ? record.modules : Array.isArray(record.lessons) ? [{ title: 'Imported lessons', lessons: record.lessons }] : []; if (!Object.keys(courseRecord).length) throw new Error('JSON must include a course object.'); if (!modulesSource.length) throw new Error('JSON must include modules, or lessons that can be wrapped into a module.'); return { course: normalizeCourse(courseRecord), modules: modulesSource.map(normalizeModule), questions: normalizeQuestions(record.questions ?? asRecord(record.assessments).questions ?? asRecord(record.assessments).quizzes) }; }
function withDefaultSchool(blueprint: JsonBlueprint, schools: School[]): JsonBlueprint { if (blueprint.course.schoolId || !schools[0]) return blueprint; return { ...blueprint, course: { ...blueprint.course, schoolId: schools[0].id } }; }
function validateBlueprint(blueprint: JsonBlueprint) { const errors: string[] = []; const warnings: string[] = []; if (!blueprint.course.title.trim()) errors.push('Course title is required.'); if (!blueprint.course.schoolId.trim()) warnings.push('School is not selected. Saving may fail if the backend requires schoolId.'); if (!blueprint.modules.length) errors.push('At least one module is required.'); blueprint.modules.forEach((module, m) => { if (!module.title.trim()) errors.push(`Module ${m + 1} needs a title.`); if (!module.lessons.length) errors.push(`Module ${m + 1} needs at least one lesson.`); module.lessons.forEach((lesson, l) => { if (!lesson.title.trim()) errors.push(`Module ${m + 1}, lesson ${l + 1} needs a title.`); if (!lesson.cards.length && !lesson.subLessons.some((sub) => sub.cards.length)) warnings.push(`Module ${m + 1}, lesson ${l + 1} has no cards yet.`); }); }); return { errors, warnings }; }
function cardsFromLesson(lesson: Lesson): JsonCard[] { return normalizeCards(lesson.learningObjects?.flatMap((object) => Array.isArray(object.payload?.blocks) ? object.payload.blocks : []) ?? []); }
function jsonFromExistingCourse(course: Course, lessons: Lesson[]): JsonBlueprint { return { course: { title: course.title, description: course.description, schoolId: course.schoolId || '', level: course.level || 'beginner', durationHours: Number(course.durationHours ?? 8), entryFee: Number(course.price ?? 0), currency: course.currency || 'ZMW', certificateFee: Number(course.certificateFee ?? 0), outcomes: course.outcomes ?? [], audience: 'Existing learners', prerequisites: ['Review existing course requirements'] }, modules: [{ id: uid('module'), title: 'Existing course content', description: 'Imported from saved course lessons.', outcomes: course.outcomes ?? [], lessons: lessons.length ? lessons.map((lesson, index) => ({ id: lesson.id || uid('lesson'), title: lesson.title || `Lesson ${index + 1}`, summary: lesson.content || lesson.exercise || 'Imported lesson.', outcomes: [], subLessons: [], cards: cardsFromLesson(lesson) })) : [makeLesson(0)] }], questions: [] }; }
function flattenLessons(blueprint: JsonBlueprint) { return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => { const parent = { title: lesson.title, summary: lesson.summary, content: lesson.summary, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex, blocks: lesson.cards }; const children = lesson.subLessons.map((subLesson, subIndex) => ({ title: `${lesson.title}: ${subLesson.title}`, summary: subLesson.summary, content: subLesson.summary, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1, blocks: subLesson.cards })); return [parent, ...children]; })); }
function toDraftPayload(blueprint: JsonBlueprint, status: SaveStatus, editingCourseId: string | null) { const course = blueprint.course; return { sourceMode: 'new', course: { id: editingCourseId || `json-${Date.now()}`, title: course.title, description: course.description, schoolId: course.schoolId, imageId: 'short-course-json', status, level: course.level, durationHours: course.durationHours, price: String(course.entryFee ?? 0), currency: course.currency || 'ZMW', certificateFee: String(course.certificateFee ?? 0), certificateCurrency: course.currency || 'ZMW', modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description })), lessons: flattenLessons(blueprint), outcomes: course.outcomes }, blueprint: { courseSummary: { title: course.title, audience: course.audience, level: course.level, description: course.description, prerequisites: course.prerequisites, totalDurationHours: course.durationHours, outcomes: course.outcomes, finalAssessment: 'Complete all questions and final project.', certificateCriteria: 'Complete the learning path and pass assessment.' }, assessments: { quizzes: blueprint.questions.map((q) => q.question), practicalWork: [], instructorReviewChecklist: [] }, modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description, durationMinutes: Math.max(30, Math.round((course.durationHours * 60) / Math.max(1, blueprint.modules.length))), outcomes: module.outcomes, moduleAssessment: 'Complete all missions in this stage.', lessons: module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: 30, outcomes: lesson.outcomes, activities: [`Cards JSON: ${JSON.stringify(lesson.cards)}`, `Sub-lessons JSON: ${JSON.stringify(lesson.subLessons)}`], assessment: 'Complete practice checks.', blocks: lesson.cards, subLessons: lesson.subLessons.map((subLesson) => ({ title: subLesson.title, summary: subLesson.summary, durationMinutes: 20, outcomes: [], blocks: subLesson.cards, activities: [], assessment: 'Complete side mission.' })) })) })) } }; }
