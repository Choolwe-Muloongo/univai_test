'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Eye, FileJson, Plus, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';
import { createShortCourseDraftWithBlueprint, getSchools } from '@/lib/api';
import type { Course, School } from '@/lib/api/types';

type Mode = 'new' | 'edit';
type ImportMode = 'safe_merge' | 'append_modules' | 'append_lessons' | 'append_cards' | 'replace_full_course';
type SaveStatus = 'draft' | 'published';
type Card = Record<string, unknown>;
type CourseJson = { title: string; description: string; schoolId: string; level: string; durationHours: number; entryFee: number; currency: string; certificateFee: number; audience: string; prerequisites: string[]; outcomes: string[] };
type SubLesson = { id: string; title: string; summary: string; cards: Card[] };
type Lesson = { id: string; title: string; summary: string; outcomes: string[]; cards: Card[]; subLessons: SubLesson[] };
type Module = { id: string; title: string; description: string; outcomes: string[]; lessons: Lesson[] };
type Question = { id: string; type: string; difficulty: string; question: string; options?: string[]; answer: string; explanation?: string };
type Blueprint = { course: CourseJson; modules: Module[]; questions: Question[] };
type ExistingCourse = Course & { updatedAt?: string | null; createdAt?: string | null };

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const blankLesson = (i = 0): Lesson => ({ id: uid('lesson'), title: `Lesson ${i + 1}`, summary: 'Describe this lesson.', outcomes: [], cards: [], subLessons: [] });
const blankModule = (i = 0): Module => ({ id: uid('module'), title: `Module ${i + 1}`, description: 'Describe this module.', outcomes: [], lessons: [blankLesson()] });
const initial: Blueprint = { course: { title: 'New Course', description: 'Describe this course.', schoolId: '', level: 'beginner', durationHours: 8, entryFee: 0, currency: 'ZMW', certificateFee: 0, audience: 'Learners', prerequisites: [], outcomes: [] }, modules: [blankModule()], questions: [] };
const importModes: Array<{ id: ImportMode; label: string; help: string }> = [
  { id: 'safe_merge', label: 'Safe merge', help: 'Merge matching IDs and preserve existing content.' },
  { id: 'append_modules', label: 'Append modules', help: 'Add Module 2, Module 3, etc. to this course.' },
  { id: 'append_lessons', label: 'Append lessons', help: 'Add lessons to the selected module.' },
  { id: 'append_cards', label: 'Append cards', help: 'Add cards to the selected lesson.' },
  { id: 'replace_full_course', label: 'Replace full course', help: 'Danger zone. Wipes the current in-memory JSON.' },
];

export function JsonCourseBuilderFlexStudio() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<ExistingCourse[]>([]);
  const [blueprint, setBlueprint] = useState<Blueprint>(initial);
  const [mode, setMode] = useState<Mode>('new');
  const [importMode, setImportMode] = useState<ImportMode>('safe_merge');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [previewModuleIndex, setPreviewModuleIndex] = useState(0);
  const [previewLessonIndex, setPreviewLessonIndex] = useState(0);
  const [editor, setEditor] = useState(format(initial));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const activeModule = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  const activeLesson = activeModule?.lessons[lessonIndex] ?? activeModule?.lessons[0];
  const validation = useMemo(() => validate(blueprint), [blueprint]);

  useEffect(() => { getSchools().then((s) => { setSchools(s); if (s[0]) setBlueprint((b) => b.course.schoolId ? b : { ...b, course: { ...b.course, schoolId: s[0].id } }); }).catch(() => setSchools([])); void refreshCourses(); }, []);
  useEffect(() => { setEditor(format(blueprint)); }, [blueprint]);

  async function refreshCourses() {
    try { const data = await apiFetch<ExistingCourse[]>('/admin/short-courses/drafts'); setCourses(Array.isArray(data) ? data : []); }
    catch { setCourses([]); }
  }

  function setNext(next: Blueprint, msg?: string) { setBlueprint(next); setMessage(msg ?? null); setError(null); }

  async function loadExistingCourse() {
    if (!selectedCourseId) return setError('Select a course first.');
    setLoading(true); setError(null);
    try {
      const response = await apiFetch<Record<string, unknown>>(`/admin/short-courses/drafts/${selectedCourseId}/blueprint`);
      const loaded = normalizeBlueprint(response.blueprint ?? response, blueprint, response.course as Course | undefined);
      setNext(loaded, 'Existing course loaded. Upload Module 2 JSON, choose Append modules, then save changes.');
      setMode('edit'); setModuleIndex(0); setLessonIndex(0); setPreviewModuleIndex(0); setPreviewLessonIndex(0);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load this course. Make sure the backend blueprint route exists.'); }
    finally { setLoading(false); }
  }

  function applyEditor() {
    try {
      const raw = JSON.parse(editor.replace(/^\uFEFF/, ''));
      setNext(applyImport(blueprint, raw, importMode, moduleIndex, lessonIndex), `${importMode.replace(/_/g, ' ')} applied.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Invalid JSON.'); }
  }

  async function uploadJson(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    try { const raw = JSON.parse((await file.text()).replace(/^\uFEFF/, '')); setNext(applyImport(blueprint, raw, importMode, moduleIndex, lessonIndex), `${file.name} imported.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not import JSON.'); }
  }

  async function save(status: SaveStatus) {
    if (validation.errors.length) return setError('Fix validation errors before saving.');
    setSaving(true); setError(null);
    try {
      const payload = toDraftPayload(blueprint, status);
      if (mode === 'edit' && selectedCourseId) {
        await apiFetch(`/admin/short-courses/drafts/${selectedCourseId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setMessage(status === 'published' ? 'Existing course updated and published.' : 'Existing course draft updated.');
      } else {
        await createShortCourseDraftWithBlueprint(payload as never);
        setMessage(status === 'published' ? 'Course published.' : 'Draft saved.');
      }
      void refreshCourses();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); }
    finally { setSaving(false); }
  }

  function addModule() { const next = clone(blueprint); next.modules.push(blankModule(next.modules.length)); setModuleIndex(next.modules.length - 1); setLessonIndex(0); setNext(next, 'Module added.'); }
  function addLesson() { const next = clone(blueprint); const m = next.modules[moduleIndex]; if (!m) return; m.lessons.push(blankLesson(m.lessons.length)); setLessonIndex(m.lessons.length - 1); setNext(next, 'Lesson added.'); }
  function deleteModule() { if (blueprint.modules.length <= 1) return setError('Keep at least one module.'); const next = clone(blueprint); next.modules.splice(moduleIndex, 1); setModuleIndex(0); setLessonIndex(0); setNext(next, 'Module deleted.'); }
  function deleteLesson() { const next = clone(blueprint); const m = next.modules[moduleIndex]; if (!m || m.lessons.length <= 1) return setError('Keep at least one lesson.'); m.lessons.splice(lessonIndex, 1); setLessonIndex(0); setNext(next, 'Lesson deleted.'); }

  return <div className="space-y-6">
    <input ref={uploadRef} type="file" accept="application/json,.json" className="hidden" onChange={uploadJson} />
    <Card className="rounded-3xl border-primary/20"><CardHeader><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" /> Flexible JSON Builder</CardTitle><CardDescription>Edit existing courses, append modules safely, and preview with the real student lesson player.</CardDescription></div><Button onClick={() => uploadRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload JSON</Button></div></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 rounded-3xl border bg-muted/20 p-3 md:grid-cols-[200px_1fr_auto_auto] md:items-end"><Field label="Builder mode"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value as Mode)}><option value="new">Start new course</option><option value="edit">Edit existing course</option></select></Field><Field label="Saved course"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} disabled={mode !== 'edit'}><option value="">Select course to edit</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title} {c.status ? `(${c.status})` : ''}</option>)}</select></Field><Button variant="outline" onClick={refreshCourses}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={loadExistingCourse} disabled={mode !== 'edit' || !selectedCourseId || loading}>{loading ? 'Loading...' : 'Load selected course'}</Button></div>
      {message ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}{error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
    </CardContent></Card>

    <div className="grid gap-6 xl:grid-cols-[340px_1fr]"><aside className="space-y-4 xl:sticky xl:top-20 xl:self-start"><Card className="rounded-3xl"><CardHeader><CardTitle>Structure</CardTitle><CardDescription>Select where Module/Lesson JSON should go.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><Button size="sm" onClick={addModule}><Plus className="mr-1 h-3 w-3" />Module</Button><Button size="sm" variant="outline" onClick={addLesson}><Plus className="mr-1 h-3 w-3" />Lesson</Button></div><div className="space-y-2"><Label>Modules</Label>{blueprint.modules.map((m, i) => <button key={m.id} onClick={() => { setModuleIndex(i); setLessonIndex(0); }} className={`w-full rounded-2xl border p-3 text-left text-sm ${i === moduleIndex ? 'border-primary bg-primary/10' : ''}`}><b>{m.title}</b><span className="block text-xs text-muted-foreground">{m.lessons.length} lessons</span></button>)}<Button size="sm" variant="ghost" className="text-destructive" onClick={deleteModule}><Trash2 className="mr-1 h-3 w-3" />Delete module</Button></div><div className="space-y-2"><Label>Lessons</Label>{activeModule?.lessons.map((l, i) => <button key={l.id} onClick={() => setLessonIndex(i)} className={`w-full rounded-2xl border p-3 text-left text-sm ${i === lessonIndex ? 'border-primary bg-primary/10' : ''}`}><b>{l.title}</b><span className="block text-xs text-muted-foreground">{l.cards.length} cards · {l.subLessons.length} sub-lessons</span></button>)}<Button size="sm" variant="ghost" className="text-destructive" onClick={deleteLesson}><Trash2 className="mr-1 h-3 w-3" />Delete lesson</Button></div></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Validation</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{validation.errors.length === 0 && validation.warnings.length === 0 ? <p className="rounded-2xl border border-primary/20 bg-primary/5 p-3">No issues found.</p> : null}{validation.errors.map((x) => <p key={x} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive"><AlertTriangle className="mr-2 inline h-4 w-4" />{x}</p>)}{validation.warnings.map((x) => <p key={x} className="rounded-2xl border bg-muted/40 p-3"><AlertTriangle className="mr-2 inline h-4 w-4" />{x}</p>)}</CardContent></Card></aside>
      <section className="space-y-6"><Card className="rounded-3xl border-primary/20"><CardHeader><CardTitle>Import mode</CardTitle><CardDescription>Choose how uploaded or pasted JSON affects the current course.</CardDescription></CardHeader><CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{importModes.map((m) => <button key={m.id} onClick={() => setImportMode(m.id)} className={`rounded-2xl border p-3 text-left text-sm ${importMode === m.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background'}`}><span className="font-semibold">{m.label}</span><span className="mt-1 block text-xs text-muted-foreground">{m.help}</span></button>)}</CardContent></Card>
      <Card className="rounded-3xl"><CardHeader><CardTitle>JSON editor</CardTitle><CardDescription>Paste full course JSON, module JSON, lesson JSON, or cards. Use Append modules for Module 2.</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={editor} onChange={(e) => setEditor(e.target.value)} rows={18} spellCheck={false} className="font-mono text-xs md:text-sm" /><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button onClick={applyEditor}><CheckCircle2 className="mr-2 h-4 w-4" />Apply selected mode</Button><Button variant="outline" onClick={() => setEditor(format(JSON.parse(editor)))}><FileJson className="mr-2 h-4 w-4" />Format</Button><Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(format(blueprint)); setMessage('Full JSON copied.'); }}><Copy className="mr-2 h-4 w-4" />Copy full JSON</Button><Button onClick={() => save('draft')} disabled={saving || validation.errors.length > 0}><Save className="mr-2 h-4 w-4" />{mode === 'edit' ? 'Save changes' : 'Save draft'}</Button><Button onClick={() => save('published')} disabled={saving || validation.errors.length > 0}>{mode === 'edit' ? 'Update & publish' : 'Publish'}</Button></div></CardContent></Card>
      <CoursePreview blueprint={blueprint} />
      <PlayerPreview blueprint={blueprint} moduleIndex={previewModuleIndex} setModuleIndex={setPreviewModuleIndex} lessonIndex={previewLessonIndex} setLessonIndex={setPreviewLessonIndex} />
      </section></div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function CoursePreview({ blueprint }: { blueprint: Blueprint }) { return <Card className="rounded-3xl"><CardHeader><CardTitle>Course outline preview</CardTitle><CardDescription>{blueprint.modules.length} modules · {blueprint.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border bg-primary/5 p-4"><h2 className="text-2xl font-bold">{blueprint.course.title}</h2><p className="mt-2 text-sm text-muted-foreground">{blueprint.course.description}</p></div>{blueprint.modules.map((m, i) => <div key={m.id} className="rounded-3xl border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Module {i + 1}</p><h3 className="text-xl font-bold">{m.title}</h3><p className="text-sm text-muted-foreground">{m.description}</p><div className="mt-3 space-y-2">{m.lessons.map((l, j) => <div key={l.id} className="rounded-2xl border bg-background p-3"><p className="font-semibold">Lesson {j + 1}: {l.title}</p><p className="text-sm text-muted-foreground">{l.summary}</p><p className="mt-1 text-xs text-muted-foreground">{l.cards.length} cards · {l.subLessons.length} sub-lessons</p></div>)}</div></div>)}</CardContent></Card>; }
function PlayerPreview({ blueprint, moduleIndex, setModuleIndex, lessonIndex, setLessonIndex }: { blueprint: Blueprint; moduleIndex: number; setModuleIndex: (n: number) => void; lessonIndex: number; setLessonIndex: (n: number) => void }) { const m = blueprint.modules[moduleIndex] ?? blueprint.modules[0]; const l = m?.lessons[lessonIndex] ?? m?.lessons[0]; if (!m || !l) return null; const count = l.cards.length + l.subLessons.reduce((s, sub) => s + sub.cards.length, 0); const lesson = { id: `preview-${l.id}`, courseId: 'builder-preview', title: l.title, summary: l.summary, content: JSON.stringify({ blocks: l.cards, subLessons: l.subLessons }), estimatedMinutes: Math.max(10, Math.ceil(count * 1.2)), difficulty: blueprint.course.level }; return <Card className="rounded-3xl border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Student lesson player preview</CardTitle><CardDescription>This is the same lesson player students use. Check cards before saving.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Preview module"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={moduleIndex} onChange={(e) => { setModuleIndex(Number(e.target.value)); setLessonIndex(0); }}>{blueprint.modules.map((mod, i) => <option key={mod.id} value={i}>{mod.title}</option>)}</select></Field><Field label="Preview lesson"><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={lessonIndex} onChange={(e) => setLessonIndex(Number(e.target.value))}>{m.lessons.map((les, i) => <option key={les.id} value={i}>{les.title}</option>)}</select></Field></div><div className="max-h-[780px] overflow-y-auto rounded-3xl border bg-background"><LessonPlayer lesson={lesson as never} courseTitle={`${blueprint.course.title} · Builder preview`} completed={false} completeLabel="Preview complete" /></div></CardContent></Card>; }

function format(v: unknown) { return JSON.stringify(v, null, 2); }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function rec(v: unknown): Record<string, unknown> { return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}; }
function str(v: unknown, f = '') { return typeof v === 'string' ? v : v == null ? f : String(v); }
function num(v: unknown, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function arr(v: unknown): string[] { return Array.isArray(v) ? v.map((x) => str(x).trim()).filter(Boolean) : typeof v === 'string' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : []; }
function cards(v: unknown): Card[] { const r = rec(v); const source = Array.isArray(v) ? v : Array.isArray(r.cards) ? r.cards : Array.isArray(r.blocks) ? r.blocks : v && typeof v === 'object' ? [v] : []; return source.filter((x): x is Card => Boolean(x) && typeof x === 'object' && !Array.isArray(x)); }
function course(v: Record<string, unknown>): CourseJson { return { title: str(v.title, 'Untitled course'), description: str(v.description ?? v.summary, 'Describe this course.'), schoolId: str(v.schoolId ?? v.school_id), level: str(v.level, 'beginner'), durationHours: num(v.durationHours ?? v.duration_hours ?? v.totalDurationHours ?? v.duration, 8), entryFee: num(v.entryFee ?? v.entry_fee ?? v.price, 0), currency: str(v.currency, 'ZMW'), certificateFee: num(v.certificateFee ?? v.certificate_fee, 0), audience: str(v.audience, 'Learners'), prerequisites: arr(v.prerequisites), outcomes: arr(v.outcomes) }; }
function sub(v: unknown, i: number): SubLesson { const r = rec(v); return { id: str(r.id, uid('sub')), title: str(r.title ?? r.name, `Sub-lesson ${i + 1}`), summary: str(r.summary ?? r.description, 'Describe this sub-lesson.'), cards: cards(r.cards ?? r.blocks) }; }
function lesson(v: unknown, i: number): Lesson { const r = rec(v); const ss = Array.isArray(r.subLessons) ? r.subLessons : Array.isArray(r.sub_lessons) ? r.sub_lessons : []; return { id: str(r.id, uid('lesson')), title: str(r.title ?? r.name, `Lesson ${i + 1}`), summary: str(r.summary ?? r.description ?? r.content, 'Describe this lesson.'), outcomes: arr(r.outcomes), cards: cards(r.cards ?? r.blocks ?? r.learningObjects ?? r.learning_cards), subLessons: ss.map(sub) }; }
function moduleFrom(v: unknown, i: number): Module { const r = rec(v); const source = Array.isArray(r.lessons) ? r.lessons : []; return { id: str(r.id, uid('module')), title: str(r.title ?? r.name, `Module ${i + 1}`), description: str(r.description ?? r.summary, 'Describe this module.'), outcomes: arr(r.outcomes), lessons: source.length ? source.map(lesson) : [blankLesson()] }; }
function question(v: unknown, i: number): Question { const r = rec(v); const options = Array.isArray(r.options) ? r.options.map((o) => str(o)).filter(Boolean) : undefined; const q: Question = { id: str(r.id, uid('question')), type: str(r.type, 'mcq'), difficulty: str(r.difficulty, 'easy'), question: str(r.question ?? r.prompt, `Question ${i + 1}`), answer: str(r.answer ?? r.correctAnswer ?? r.correct_answer), explanation: str(r.explanation) }; if (options?.length) q.options = options; return q; }
function modules(raw: unknown): Module[] { const r = rec(raw); const source = Array.isArray(raw) ? raw : Array.isArray(r.modules) ? r.modules : r.module ? [r.module] : r.title || r.name ? [raw] : []; return source.map(moduleFrom); }
function lessons(raw: unknown): Lesson[] { const r = rec(raw); const source = Array.isArray(raw) ? raw : Array.isArray(r.lessons) ? r.lessons : r.lesson ? [r.lesson] : r.title || r.name ? [raw] : []; return source.map(lesson); }
function questions(raw: unknown): Question[] { const r = rec(raw); const source = Array.isArray(raw) ? raw : Array.isArray(r.questions) ? r.questions : r.question || r.prompt ? [raw] : []; return source.map(question); }
function normalizeBlueprint(raw: unknown, fallback: Blueprint, apiCourse?: Course): Blueprint { const r = rec(raw); const summary = rec(r.course ?? r.courseSummary ?? r.course_summary); const apiSeed = apiCourse ? { title: apiCourse.title, description: apiCourse.description, schoolId: apiCourse.schoolId, level: apiCourse.level, durationHours: apiCourse.durationHours, price: apiCourse.price, currency: apiCourse.currency, certificateFee: apiCourse.certificateFee, outcomes: apiCourse.outcomes } : {}; const sourceModules = Array.isArray(r.modules) ? r.modules : Array.isArray(r.lessons) ? [{ title: 'Imported lessons', lessons: r.lessons }] : fallback.modules; const assessment = rec(r.assessments); return { course: course({ ...fallback.course, ...apiSeed, ...summary }), modules: sourceModules.map(moduleFrom), questions: questions(r.questions ?? assessment.questions ?? assessment.quizzes) }; }
function mergeById<T extends { id: string }>(current: T[], incoming: T[]) { const next = [...current]; incoming.forEach((item) => { const i = next.findIndex((x) => x.id === item.id); if (i >= 0) next[i] = item; else next.push(item); }); return next; }
function appendFresh<T extends { id: string }>(current: T[], incoming: T[], prefix: string) { const ids = new Set(current.map((x) => x.id)); return [...current, ...incoming.map((x) => ids.has(x.id) ? { ...x, id: uid(prefix) } : x)]; }
function applyImport(current: Blueprint, raw: unknown, mode: ImportMode, moduleIndex: number, lessonIndex: number): Blueprint { const r = rec(raw); const next = clone(current); if (mode === 'replace_full_course') return normalizeBlueprint(raw, current); if (mode === 'append_modules') { const ms = modules(r.modules ?? raw); if (!ms.length) throw new Error('No modules found.'); next.modules = appendFresh(next.modules, ms, 'module'); return next; } if (mode === 'append_lessons') { const ls = lessons(r.lessons ?? raw); if (!ls.length) throw new Error('No lessons found.'); const m = next.modules[moduleIndex]; if (!m) throw new Error('Select a module first.'); m.lessons = appendFresh(m.lessons, ls, 'lesson'); return next; } if (mode === 'append_cards') { const cs = cards(r.cards ?? r.blocks ?? raw); if (!cs.length) throw new Error('No cards found.'); const l = next.modules[moduleIndex]?.lessons[lessonIndex]; if (!l) throw new Error('Select a lesson first.'); l.cards = [...l.cards, ...cs]; return next; } if (r.course || r.courseSummary || r.course_summary) next.course = course({ ...next.course, ...rec(r.course ?? r.courseSummary ?? r.course_summary) }); const ms = modules(r.modules ?? (r.module ? [r.module] : [])); if (ms.length) next.modules = mergeById(next.modules, ms); const qs = questions(r.questions ?? r.quiz ?? r.quizzes ?? (r.question ? [r] : [])); if (qs.length) next.questions = mergeById(next.questions, qs); return next; }
function validate(b: Blueprint) { const errors: string[] = []; const warnings: string[] = []; if (!b.course.title.trim()) errors.push('Course title is required.'); if (!b.modules.length) errors.push('At least one module is required.'); if (!b.course.schoolId.trim()) warnings.push('School is not selected.'); b.modules.forEach((m, i) => { if (!m.title.trim()) errors.push(`Module ${i + 1} needs a title.`); if (!m.lessons.length) errors.push(`Module ${i + 1} needs at least one lesson.`); m.lessons.forEach((l, j) => { if (!l.title.trim()) errors.push(`Module ${i + 1}, lesson ${j + 1} needs a title.`); if (!l.cards.length && !l.subLessons.some((s) => s.cards.length)) warnings.push(`Module ${i + 1}, lesson ${j + 1} has no cards.`); }); }); return { errors, warnings }; }
function flattenLessons(b: Blueprint) { return b.modules.flatMap((m, mi) => m.lessons.map((l, li) => ({ title: l.title, summary: l.summary, content: JSON.stringify({ blocks: l.cards, subLessons: l.subLessons }), moduleTitle: m.title, moduleIndex: mi, sortOrder: mi * 100 + li, blocks: l.cards }))); }
function toDraftPayload(b: Blueprint, status: SaveStatus) { const c = b.course; return { sourceMode: 'new', course: { id: `json-${Date.now()}`, title: c.title, description: c.description, schoolId: c.schoolId, imageId: 'short-course-json', status, level: c.level, durationHours: c.durationHours, price: String(c.entryFee ?? 0), currency: c.currency || 'ZMW', certificateFee: String(c.certificateFee ?? 0), certificateCurrency: c.currency || 'ZMW', modules: b.modules.map((m) => ({ title: m.title, description: m.description })), lessons: flattenLessons(b), outcomes: c.outcomes }, blueprint: { courseSummary: { title: c.title, audience: c.audience, level: c.level, description: c.description, prerequisites: c.prerequisites, totalDurationHours: c.durationHours, outcomes: c.outcomes, finalAssessment: 'Complete all assessments.', certificateCriteria: 'Complete the learning path.' }, assessments: { quizzes: b.questions.map((q) => q.question), practicalWork: [], instructorReviewChecklist: [] }, modules: b.modules.map((m) => ({ id: m.id, title: m.title, description: m.description, durationMinutes: 60, outcomes: m.outcomes, moduleAssessment: 'Complete all lessons.', lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, summary: l.summary, durationMinutes: 30, outcomes: l.outcomes, activities: [], assessment: 'Complete practice checks.', blocks: l.cards, subLessons: l.subLessons.map((s) => ({ id: s.id, title: s.title, summary: s.summary, durationMinutes: 20, outcomes: [], blocks: s.cards, activities: [], assessment: 'Complete sub-lesson.' })) })) })) } }; }
