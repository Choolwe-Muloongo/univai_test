'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { getSchools } from '@/lib/api';
import type { School } from '@/lib/api/types';

type BuilderMode = 'manual' | 'ai';
type BuilderStep = 'setup' | 'lessons' | 'cards' | 'quiz' | 'preview';

type CourseForm = {
  title: string;
  description: string;
  schoolId: string;
  level: string;
  durationHours: string;
  entryFee: string;
  currency: string;
  certificateFee: string;
};

type SubLesson = {
  id: string;
  title: string;
  summary: string;
  saved: boolean;
};

type ManualLesson = {
  id: string;
  title: string;
  summary: string;
  durationMinutes: string;
  difficulty: string;
  outcomes: string[];
  subLessons: SubLesson[];
  saved: boolean;
};

const manualSteps: Array<{ id: BuilderStep; label: string; description: string }> = [
  { id: 'setup', label: 'Setup', description: 'Course details' },
  { id: 'lessons', label: 'Lessons', description: 'Plan chapters' },
  { id: 'cards', label: 'Cards', description: 'Build content' },
  { id: 'quiz', label: 'Quiz Bank', description: 'Practice questions' },
  { id: 'preview', label: 'Preview', description: 'Student view' },
];

function makeLesson(index: number): ManualLesson {
  return {
    id: `lesson-${Date.now()}-${index}`,
    title: `Lesson ${index}`,
    summary: 'Describe what this lesson teaches.',
    durationMinutes: '20',
    difficulty: 'beginner',
    outcomes: ['Understand the key idea.'],
    subLessons: [],
    saved: false,
  };
}

function makeSubLesson(index: number): SubLesson {
  return {
    id: `sub-lesson-${Date.now()}-${index}`,
    title: `Sub-lesson ${index}`,
    summary: 'Describe this smaller part of the lesson.',
    saved: false,
  };
}

export function DedicatedManualCourseBuilderClient() {
  const [mode, setMode] = useState<BuilderMode>('manual');
  const [step, setStep] = useState<BuilderStep>('setup');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeSubLessonIndex, setActiveSubLessonIndex] = useState<number | null>(null);
  const [lessons, setLessons] = useState<ManualLesson[]>([makeLesson(1)]);
  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    schoolId: '',
    level: 'beginner',
    durationHours: '8',
    entryFee: '0',
    currency: 'ZMW',
    certificateFee: '0',
  });

  useEffect(() => {
    let mounted = true;
    getSchools()
      .then((data) => {
        if (!mounted) return;
        setSchools(data);
        if (data[0]) setForm((value) => ({ ...value, schoolId: data[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load schools.'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const activeLesson = lessons[activeLessonIndex] ?? lessons[0];
  const activeSubLesson = activeSubLessonIndex !== null ? activeLesson?.subLessons[activeSubLessonIndex] : null;

  function updateLesson(patch: Partial<ManualLesson>) {
    setLessons((current) => current.map((lesson, index) => index === activeLessonIndex ? { ...lesson, ...patch, saved: false } : lesson));
  }

  function saveLesson() {
    setLessons((current) => current.map((lesson, index) => index === activeLessonIndex ? { ...lesson, saved: true } : lesson));
    setMessage(`${activeLesson.title || 'Lesson'} saved. You can continue to the next lesson or finish the course.`);
  }

  function addLesson() {
    const nextLesson = makeLesson(lessons.length + 1);
    setLessons((current) => [...current, nextLesson]);
    setActiveLessonIndex(lessons.length);
    setActiveSubLessonIndex(null);
    setMessage('New lesson added. Fill it in, then save the lesson.');
  }

  function goNextLesson() {
    if (activeLessonIndex < lessons.length - 1) {
      setActiveLessonIndex((value) => value + 1);
      setActiveSubLessonIndex(null);
      return;
    }
    addLesson();
  }

  function finishCoursePlanning() {
    saveLesson();
    setStep('cards');
  }

  function addSubLesson() {
    const subLesson = makeSubLesson(activeLesson.subLessons.length + 1);
    setLessons((current) => current.map((lesson, index) => index === activeLessonIndex ? { ...lesson, subLessons: [...lesson.subLessons, subLesson], saved: false } : lesson));
    setActiveSubLessonIndex(activeLesson.subLessons.length);
  }

  function updateSubLesson(patch: Partial<SubLesson>) {
    if (activeSubLessonIndex === null) return;
    setLessons((current) => current.map((lesson, lessonIndex) => {
      if (lessonIndex !== activeLessonIndex) return lesson;
      return {
        ...lesson,
        saved: false,
        subLessons: lesson.subLessons.map((subLesson, subIndex) => subIndex === activeSubLessonIndex ? { ...subLesson, ...patch, saved: false } : subLesson),
      };
    }));
  }

  function saveSubLesson() {
    if (activeSubLessonIndex === null) return;
    setLessons((current) => current.map((lesson, lessonIndex) => {
      if (lessonIndex !== activeLessonIndex) return lesson;
      return {
        ...lesson,
        subLessons: lesson.subLessons.map((subLesson, subIndex) => subIndex === activeSubLessonIndex ? { ...subLesson, saved: true } : subLesson),
      };
    }));
    setMessage('Sub-lesson saved.');
  }

  if (loading) return <PageLoading message="Loading manual studio..." />;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-primary/20 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-primary">Dedicated manual course studio</p>
              <h2 className="text-2xl font-bold">Create courses visually without JSON.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manual tools stay clean. AI tools stay separate. Switch only when you want AI help.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={mode === 'manual' ? 'default' : 'outline'} onClick={() => setMode('manual')}>
                Manual builder
              </Button>
              <Button type="button" variant={mode === 'ai' ? 'default' : 'outline'} onClick={() => setMode('ai')}>
                AI helper
              </Button>
            </div>
          </div>

          {mode === 'manual' ? (
            <div className="grid gap-2 md:grid-cols-5">
              {manualSteps.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`rounded-2xl border p-3 text-left transition ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}
                >
                  <p className="text-sm font-semibold">{index + 1}. {item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {mode === 'ai' ? (
        <AiHelperPlaceholder />
      ) : (
        <ManualStep
          step={step}
          form={form}
          setForm={setForm}
          schools={schools}
          goNext={() => setStep('lessons')}
          lessons={lessons}
          activeLessonIndex={activeLessonIndex}
          setActiveLessonIndex={setActiveLessonIndex}
          activeLesson={activeLesson}
          updateLesson={updateLesson}
          saveLesson={saveLesson}
          addLesson={addLesson}
          goNextLesson={goNextLesson}
          finishCoursePlanning={finishCoursePlanning}
          activeSubLessonIndex={activeSubLessonIndex}
          setActiveSubLessonIndex={setActiveSubLessonIndex}
          activeSubLesson={activeSubLesson}
          addSubLesson={addSubLesson}
          updateSubLesson={updateSubLesson}
          saveSubLesson={saveSubLesson}
        />
      )}
    </div>
  );
}

function ManualStep({
  step,
  form,
  setForm,
  schools,
  goNext,
  lessons,
  activeLessonIndex,
  setActiveLessonIndex,
  activeLesson,
  updateLesson,
  saveLesson,
  addLesson,
  goNextLesson,
  finishCoursePlanning,
  activeSubLessonIndex,
  setActiveSubLessonIndex,
  activeSubLesson,
  addSubLesson,
  updateSubLesson,
  saveSubLesson,
}: {
  step: BuilderStep;
  form: CourseForm;
  setForm: React.Dispatch<React.SetStateAction<CourseForm>>;
  schools: School[];
  goNext: () => void;
  lessons: ManualLesson[];
  activeLessonIndex: number;
  setActiveLessonIndex: (index: number) => void;
  activeLesson: ManualLesson;
  updateLesson: (patch: Partial<ManualLesson>) => void;
  saveLesson: () => void;
  addLesson: () => void;
  goNextLesson: () => void;
  finishCoursePlanning: () => void;
  activeSubLessonIndex: number | null;
  setActiveSubLessonIndex: (index: number | null) => void;
  activeSubLesson: SubLesson | null;
  addSubLesson: () => void;
  updateSubLesson: (patch: Partial<SubLesson>) => void;
  saveSubLesson: () => void;
}) {
  if (step === 'setup') return <SetupStep form={form} setForm={setForm} schools={schools} goNext={goNext} />;
  if (step === 'lessons') {
    return (
      <LessonsStep
        lessons={lessons}
        activeLessonIndex={activeLessonIndex}
        setActiveLessonIndex={setActiveLessonIndex}
        activeLesson={activeLesson}
        updateLesson={updateLesson}
        saveLesson={saveLesson}
        addLesson={addLesson}
        goNextLesson={goNextLesson}
        finishCoursePlanning={finishCoursePlanning}
        activeSubLessonIndex={activeSubLessonIndex}
        setActiveSubLessonIndex={setActiveSubLessonIndex}
        activeSubLesson={activeSubLesson}
        addSubLesson={addSubLesson}
        updateSubLesson={updateSubLesson}
        saveSubLesson={saveSubLesson}
      />
    );
  }
  return <ManualStepPlaceholder step={step} />;
}

function SetupStep({ form, setForm, schools, goNext }: { form: CourseForm; setForm: React.Dispatch<React.SetStateAction<CourseForm>>; schools: School[]; goNext: () => void }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Course setup</CardTitle>
        <CardDescription>Manual setup only. No AI prompt, no document upload, no JSON.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field label="Course title">
          <Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Example: Software Development Fundamentals" />
        </Field>
        <Field label="Course description">
          <Textarea rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="Explain what learners will learn and why the course matters." />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="School / Faculty">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </Field>
          <Field label="Course level">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <Field label="Total hours">
            <Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} />
          </Field>
          <Field label="Entry fee">
            <Input type="number" min={0} value={form.entryFee} onChange={(event) => setForm((value) => ({ ...value, entryFee: event.target.value }))} />
          </Field>
          <Field label="Currency">
            <Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Certificate fee">
            <Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} />
          </Field>
        </div>
        <Button type="button" onClick={goNext}>Continue to lessons</Button>
      </CardContent>
    </Card>
  );
}

function LessonsStep({
  lessons,
  activeLessonIndex,
  setActiveLessonIndex,
  activeLesson,
  updateLesson,
  saveLesson,
  addLesson,
  goNextLesson,
  finishCoursePlanning,
  activeSubLessonIndex,
  setActiveSubLessonIndex,
  activeSubLesson,
  addSubLesson,
  updateSubLesson,
  saveSubLesson,
}: {
  lessons: ManualLesson[];
  activeLessonIndex: number;
  setActiveLessonIndex: (index: number) => void;
  activeLesson: ManualLesson;
  updateLesson: (patch: Partial<ManualLesson>) => void;
  saveLesson: () => void;
  addLesson: () => void;
  goNextLesson: () => void;
  finishCoursePlanning: () => void;
  activeSubLessonIndex: number | null;
  setActiveSubLessonIndex: (index: number | null) => void;
  activeSubLesson: SubLesson | null;
  addSubLesson: () => void;
  updateSubLesson: (patch: Partial<SubLesson>) => void;
  saveSubLesson: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
          <CardDescription>Create a lesson, save it, then move to the next one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => {
                setActiveLessonIndex(index);
                setActiveSubLessonIndex(null);
              }}
              className={`w-full rounded-2xl border p-3 text-left text-sm transition ${index === activeLessonIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{lesson.title}</p>
                <span className={`rounded-full px-2 py-1 text-[11px] ${lesson.saved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {lesson.saved ? 'saved' : 'draft'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{lesson.subLessons.length} sub-lesson(s)</p>
            </button>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={addLesson}>+ Add new lesson</Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Edit lesson</CardTitle>
          <CardDescription>Save each lesson when you are done. Then move to the next lesson or start card building.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Lesson title">
              <Input value={activeLesson.title} onChange={(event) => updateLesson({ title: event.target.value })} />
            </Field>
            <Field label="Difficulty">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeLesson.difficulty} onChange={(event) => updateLesson({ difficulty: event.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
          </div>
          <Field label="Lesson summary">
            <Textarea rows={4} value={activeLesson.summary} onChange={(event) => updateLesson({ summary: event.target.value })} />
          </Field>
          <Field label="Duration in minutes">
            <Input type="number" min={1} value={activeLesson.durationMinutes} onChange={(event) => updateLesson({ durationMinutes: event.target.value })} />
          </Field>
          <Field label="Learning outcomes, one per line">
            <Textarea rows={4} value={activeLesson.outcomes.join('\n')} onChange={(event) => updateLesson({ outcomes: event.target.value.split('\n').filter(Boolean) })} />
          </Field>

          <div className="rounded-2xl border p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Sub-lessons</p>
                <p className="text-sm text-muted-foreground">Optional smaller parts inside this lesson.</p>
              </div>
              <Button type="button" variant="outline" onClick={addSubLesson}>+ Add sub-lesson</Button>
            </div>

            {activeLesson.subLessons.length ? (
              <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
                <div className="space-y-2">
                  {activeLesson.subLessons.map((subLesson, index) => (
                    <button
                      key={subLesson.id}
                      type="button"
                      onClick={() => setActiveSubLessonIndex(index)}
                      className={`w-full rounded-xl border p-3 text-left text-sm ${index === activeSubLessonIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40'}`}
                    >
                      <p className="font-medium">{subLesson.title}</p>
                      <p className="text-xs text-muted-foreground">{subLesson.saved ? 'saved' : 'draft'}</p>
                    </button>
                  ))}
                </div>

                {activeSubLesson ? (
                  <div className="space-y-3">
                    <Field label="Sub-lesson title">
                      <Input value={activeSubLesson.title} onChange={(event) => updateSubLesson({ title: event.target.value })} />
                    </Field>
                    <Field label="Sub-lesson summary">
                      <Textarea rows={3} value={activeSubLesson.summary} onChange={(event) => updateSubLesson({ summary: event.target.value })} />
                    </Field>
                    <Button type="button" onClick={saveSubLesson}>Save sub-lesson</Button>
                  </div>
                ) : (
                  <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Select a sub-lesson to edit it.</p>
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">No sub-lessons yet. Add one if this lesson needs smaller sections.</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" onClick={saveLesson}>Save lesson</Button>
            <Button type="button" variant="outline" onClick={goNextLesson}>Save later / next lesson</Button>
            <Button type="button" variant="secondary" onClick={finishCoursePlanning}>Finish lessons & build cards</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ManualStepPlaceholder({ step }: { step: BuilderStep }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>{manualSteps.find((item) => item.id === step)?.label}</CardTitle>
        <CardDescription>This section will be upgraded in the next commits.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Next commit will add the card editor. Math will be inserted inside the card currently being edited.
      </CardContent>
    </Card>
  );
}

function AiHelperPlaceholder() {
  return (
    <Card className="rounded-3xl border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>AI helper</CardTitle>
        <CardDescription>AI tools live here only. After AI generates a draft, admins edit it manually.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Prompt and document upload tools will be added here, away from the manual builder.
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
