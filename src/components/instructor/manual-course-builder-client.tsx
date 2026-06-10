'use client';

import { Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react';
import { BookOpen, FileQuestion, Layers3, Plus, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createCourse, getCourseById, getCourses, getLessonsByCourse, updateCourse } from '@/lib/api';
import type { Course, Lesson } from '@/lib/api/types';

type BuilderMode = 'create' | 'edit';

type CourseDraft = {
  title: string;
  description: string;
  modules: string;
  lessons: string;
  cards: string;
  questions: string;
};

const emptyDraft: CourseDraft = {
  title: '',
  description: '',
  modules: '[\n  { "title": "Module 1", "lessons": [] }\n]',
  lessons: '[\n  { "title": "Lesson 1", "summary": "" }\n]',
  cards: '[\n  { "lessonTitle": "Lesson 1", "type": "text", "content": "" }\n]',
  questions: '[\n  { "lessonTitle": "Lesson 1", "question": "", "choices": [], "answer": "" }\n]',
};

export function ManualCourseBuilderClient() {
  const [mode, setMode] = useState<BuilderMode>('create');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [draft, setDraft] = useState<CourseDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCourses()
      .then((items) => {
        if (!mounted) return;
        setCourses(items);
        if (items[0]) setSelectedCourseId(String(items[0].id));
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load courses.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !selectedCourseId) {
      setSelectedCourse(null);
      setLessons([]);
      if (mode === 'create') setDraft(emptyDraft);
      return;
    }

    let mounted = true;
    setLoading(true);
    Promise.all([getCourseById(selectedCourseId), getLessonsByCourse(selectedCourseId)])
      .then(([course, lessonItems]) => {
        if (!mounted) return;
        setSelectedCourse(course);
        setLessons(lessonItems);
        setDraft(toDraft(course, lessonItems));
        setError(null);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load course structure.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [mode, selectedCourseId]);

  const structureCounts = useMemo(() => [
    { label: 'Modules', value: countJsonRows(draft.modules), icon: Layers3 },
    { label: 'Lessons', value: countJsonRows(draft.lessons), icon: BookOpen },
    { label: 'Questions', value: countJsonRows(draft.questions), icon: FileQuestion },
  ], [draft]);

  async function saveCourse(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = buildPayload(draft, selectedCourse);
      if (mode === 'edit') {
        if (!selectedCourseId) throw new Error('Select an existing course before saving changes.');
        const updated = await updateCourse(selectedCourseId, payload);
        setSelectedCourse(updated);
        setCourses((current) => current.map((course) => String(course.id) === selectedCourseId ? { ...course, ...updated } : course));
        setNotice('Course updated successfully without replacing the existing structure.');
      } else {
        const created = await createCourse(payload);
        setCourses((current) => [created, ...current]);
        setSelectedCourseId(String(created.id));
        setMode('edit');
        setNotice('Course created successfully. You can now keep editing it here.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the course.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && mode === 'create' && courses.length === 0) return <PageLoading message="Loading manual builder..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Course Builder</p>
        <h1 className="text-3xl font-bold">Manual course production</h1>
        <p className="max-w-3xl text-muted-foreground">
          Create a new course or load an existing course so modules, lessons, cards, and questions can be edited without destroying the current structure.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}
      {notice ? <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Builder mode</CardTitle>
          <CardDescription>Start from a blank course or edit an existing course first.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value as BuilderMode)}>
            <option value="create">Create New Course</option>
            <option value="edit">Edit Existing Course</option>
          </select>
          {mode === 'edit' ? (
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              {courses.map((course) => <option key={String(course.id)} value={String(course.id)}>{String(course.title ?? course.name ?? `Course ${course.id}`)}</option>)}
            </select>
          ) : <p className="self-center text-sm text-muted-foreground">Create a course draft and save it to make it available for future edits.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {structureCounts.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <form className="grid gap-6 xl:grid-cols-2" onSubmit={saveCourse}>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Course details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Course title"><Input required value={draft.title} onChange={(event) => updateField(setDraft, 'title', event.target.value)} /></Field>
            <Field label="Description"><Textarea rows={3} value={draft.description} onChange={(event) => updateField(setDraft, 'description', event.target.value)} /></Field>
          </CardContent>
        </Card>

        <JsonEditor label="Modules" value={draft.modules} onChange={(value) => updateField(setDraft, 'modules', value)} />
        <JsonEditor label="Lessons" value={draft.lessons} onChange={(value) => updateField(setDraft, 'lessons', value)} />
        <JsonEditor label="Cards" value={draft.cards} onChange={(value) => updateField(setDraft, 'cards', value)} />
        <JsonEditor label="Questions" value={draft.questions} onChange={(value) => updateField(setDraft, 'questions', value)} />

        <div className="xl:col-span-2">
          <Button disabled={saving || (mode === 'edit' && !selectedCourseId)}>
            {mode === 'edit' ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : mode === 'edit' ? 'Save changes to existing course' : 'Create new course'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function JsonEditor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>{label}</CardTitle><CardDescription>Edit as JSON to preserve nested structure exactly.</CardDescription></CardHeader>
      <CardContent><Textarea rows={12} className="font-mono text-xs" value={value} onChange={(event) => onChange(event.target.value)} /></CardContent>
    </Card>
  );
}

function updateField(setDraft: Dispatch<SetStateAction<CourseDraft>>, key: keyof CourseDraft, value: string) {
  setDraft((current) => ({ ...current, [key]: value }));
}

function toDraft(course: Course | null, lessons: Lesson[]): CourseDraft {
  const modules = course?.modules ?? course?.courseModules ?? [];
  const cards = course?.cards ?? course?.contentCards ?? lessons.flatMap((lesson) => lesson.cards ?? lesson.contentCards ?? []);
  const questions = course?.questions ?? course?.quizQuestions ?? lessons.flatMap((lesson) => lesson.questions ?? lesson.quizQuestions ?? []);
  return {
    title: String(course?.title ?? course?.name ?? ''),
    description: String(course?.description ?? course?.summary ?? ''),
    modules: JSON.stringify(modules, null, 2),
    lessons: JSON.stringify(lessons, null, 2),
    cards: JSON.stringify(cards, null, 2),
    questions: JSON.stringify(questions, null, 2),
  };
}

function buildPayload(draft: CourseDraft, existing: Course | null): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    title: draft.title.trim(),
    description: draft.description.trim(),
    modules: parseJsonArray(draft.modules, 'Modules'),
    lessons: parseJsonArray(draft.lessons, 'Lessons'),
    cards: parseJsonArray(draft.cards, 'Cards'),
    questions: parseJsonArray(draft.questions, 'Questions'),
    status: existing?.status ?? 'draft',
  };
}

function parseJsonArray(value: string, label: string) {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
    return parsed;
  } catch (cause) {
    if (cause instanceof SyntaxError) throw new Error(`${label} JSON is invalid: ${cause.message}`);
    throw cause;
  }
}

function countJsonRows(value: string) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
