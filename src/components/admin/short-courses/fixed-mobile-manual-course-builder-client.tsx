'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, Layers3, ListChecks, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getSchools } from '@/lib/api';
import { apiFetch } from '@/lib/api/client';
import type { Course, School } from '@/lib/api/types';

type Step = 'course' | 'structure' | 'cards' | 'quiz' | 'preview';
type Block = Record<string, unknown>;
type ExistingCourse = Course & { status?: string | null; lessonCount?: number | null };

type CourseForm = {
  title: string;
  description: string;
  schoolId: string;
  level: string;
  durationHours: number;
  entryFee: number;
  currency: string;
  certificateFee: number;
  outcomes: string[];
};

type LessonForm = {
  id: string;
  title: string;
  summary: string;
  outcomes: string[];
  cards: Block[];
};

type ModuleForm = {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  lessons: LessonForm[];
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type ManualState = {
  course: CourseForm;
  modules: ModuleForm[];
  questions: QuizQuestion[];
};

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const emptyCourse = (schoolId = ''): CourseForm => ({
  title: 'Untitled course',
  description: 'Describe this course.',
  schoolId,
  level: 'beginner',
  durationHours: 8,
  entryFee: 0,
  currency: 'ZMW',
  certificateFee: 0,
  outcomes: [],
});

const emptyCard = (type = 'explanation', index = 0): Block => {
  if (type === 'question') {
    return {
      id: uid('card'),
      type: 'question',
      title: `Question ${index + 1}`,
      question: 'Write your question here.',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Explain why the answer is correct.',
    };
  }

  return {
    id: uid('card'),
    type,
    title: `${label(type)} ${index + 1}`,
    body: type === 'summary' ? 'Summarize the key takeaways.' : 'Write the card content here.',
  };
};

const emptyLesson = (index = 0): LessonForm => ({
  id: uid('lesson'),
  title: `Lesson ${index + 1}`,
  summary: 'Describe this lesson.',
  outcomes: [],
  cards: [emptyCard('explanation', 0), emptyCard('example', 1), emptyCard('question', 2)],
});

const emptyModule = (index = 0): ModuleForm => ({
  id: uid('module'),
  title: `Module ${index + 1}`,
  description: 'Describe this module.',
  outcomes: [],
  lessons: [emptyLesson(0)],
});

const initialState = (schoolId = ''): ManualState => ({
  course: emptyCourse(schoolId),
  modules: [emptyModule(0)],
  questions: [],
});

export function FixedMobileManualCourseBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<ExistingCourse[]>([]);
  const [state, setState] = useState<ManualState>(initialState());
  const [step, setStep] = useState<Step>('course');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showExisting, setShowExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeModule = state.modules[moduleIndex] ?? state.modules[0];
  const activeLesson = activeModule?.lessons[lessonIndex] ?? activeModule?.lessons[0];
  const activeCard = activeLesson?.cards[cardIndex] ?? activeLesson?.cards[0];
  const activeQuestion = state.questions[questionIndex] ?? state.questions[0];

  const stats = useMemo(() => {
    const lessons = state.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const cards = state.modules.reduce((sum, module) => sum + module.lessons.reduce((count, lesson) => count + lesson.cards.length, 0), 0);
    return { modules: state.modules.length, lessons, cards, quiz: state.questions.length };
  }, [state]);

  useEffect(() => {
    let alive = true;

    Promise.all([getSchools(), fetchDraftCourses(false)])
      .then(([schoolData, courseData]) => {
        if (!alive) return;
        setSchools(schoolData);
        setCourses(courseData);
        setSelectedCourseId(courseData[0]?.id || '');
        setState((current) => current.course.schoolId ? current : { ...current, course: { ...current.course, schoolId: schoolData[0]?.id || '' } });
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load manual builder.'))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  async function fetchDraftCourses(updateState = true) {
    try {
      const data = await apiFetch<ExistingCourse[]>('/admin/short-courses/drafts');
      const list = Array.isArray(data) ? data : [];
      if (updateState) {
        setCourses(list);
        setSelectedCourseId((current) => current || list[0]?.id || '');
      }
      return list;
    } catch {
      if (updateState) setCourses([]);
      return [];
    }
  }

  async function loadExistingCourse() {
    const id = typeof selectedCourseId === 'string' ? selectedCourseId.trim() : '';

    if (!id) {
      setError('Select a course first.');
      return;
    }

    setLoadingCourse(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<Record<string, unknown>>(`/admin/short-courses/drafts/${encodeURIComponent(id)}/blueprint`);
      const next = manualStateFromBlueprint(response.blueprint ?? response, response.course as Course | undefined, state);

      setState(next);
      setEditingCourseId(id);
      setSelectedCourseId(id);
      setModuleIndex(0);
      setLessonIndex(0);
      setCardIndex(0);
      setQuestionIndex(0);
      setStep('structure');
      setShowExisting(false);
      setMessage('Existing course loaded into Manual Builder.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this course.');
    } finally {
      setLoadingCourse(false);
    }
  }

  function startNewCourse() {
    setState(initialState(schools[0]?.id || ''));
    setEditingCourseId(null);
    setModuleIndex(0);
    setLessonIndex(0);
    setCardIndex(0);
    setQuestionIndex(0);
    setStep('course');
    setShowExisting(false);
    setMessage('Started a new course.');
    setError(null);
  }

  function updateCourse(patch: Partial<CourseForm>) {
    setState((current) => ({ ...current, course: { ...current.course, ...patch } }));
  }

  function updateModule(index: number, patch: Partial<ModuleForm>) {
    setState((current) => ({ ...current, modules: current.modules.map((module, moduleIdx) => moduleIdx === index ? { ...module, ...patch } : module) }));
  }

  function addModule() {
    setState((current) => ({ ...current, modules: [...current.modules, emptyModule(current.modules.length)] }));
    setModuleIndex(state.modules.length);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function deleteModule(index: number) {
    if (state.modules.length <= 1) return setError('Keep at least one module.');
    setState((current) => ({ ...current, modules: current.modules.filter((_, moduleIdx) => moduleIdx !== index) }));
    setModuleIndex(0);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function updateLesson(index: number, patch: Partial<LessonForm>) {
    setState((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
        ...module,
        lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === index ? { ...lesson, ...patch } : lesson),
      } : module),
    }));
  }

  function addLesson() {
    setState((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIdx) => moduleIdx === moduleIndex ? { ...module, lessons: [...module.lessons, emptyLesson(module.lessons.length)] } : module),
    }));
    setLessonIndex(activeModule?.lessons.length || 0);
    setCardIndex(0);
    setStep('cards');
  }

  function deleteLesson(index: number) {
    if (!activeModule || activeModule.lessons.length <= 1) return setError('Keep at least one lesson.');
    setState((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIdx) => moduleIdx === moduleIndex ? { ...module, lessons: module.lessons.filter((_, lessonIdx) => lessonIdx !== index) } : module),
    }));
    setLessonIndex(0);
    setCardIndex(0);
  }

  function addCard(type = 'explanation') {
    setState((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
        ...module,
        lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, cards: [...lesson.cards, emptyCard(type, lesson.cards.length)] } : lesson),
      } : module),
    }));
    setCardIndex(activeLesson?.cards.length || 0);
  }

  function updateCard(index: number, patch: Block) {
    setState((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
        ...module,
        lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, cards: lesson.cards.map((card, cardIdx) => cardIdx === index ? { ...card, ...patch } : card) } : lesson),
      } : module),
    }));
  }

  function deleteCard(index: number) {
    if (!activeLesson || activeLesson.cards.length <= 1) return setError('Keep at least one card.');
    setState((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
        ...module,
        lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, cards: lesson.cards.filter((_, cardIdx) => cardIdx !== index) } : lesson),
      } : module),
    }));
    setCardIndex(0);
  }

  function addQuestion() {
    setState((current) => ({ ...current, questions: [...current.questions, emptyQuestion(current.questions.length)] }));
    setQuestionIndex(state.questions.length);
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    setState((current) => ({ ...current, questions: current.questions.map((question, questionIdx) => questionIdx === index ? { ...question, ...patch } : question) }));
  }

  function deleteQuestion(index: number) {
    setState((current) => ({ ...current, questions: current.questions.filter((_, questionIdx) => questionIdx !== index) }));
    setQuestionIndex(0);
  }

  async function saveDraft() {
    if (!state.course.title.trim()) return setError('Course title is required.');
    if (!state.course.schoolId) return setError('School / Faculty is required.');

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = draftPayloadFromManualState(state, editingCourseId);

      if (editingCourseId) {
        await apiFetch(`/admin/short-courses/drafts/${encodeURIComponent(editingCourseId)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage('Existing course draft updated.');
      } else {
        const saved = await createShortCourseDraftWithBlueprint(payload as never);
        const savedId = String(saved?.id || payload.course.id || '');
        setEditingCourseId(savedId || null);
        setSelectedCourseId(savedId);
        setMessage('New course draft saved.');
      }

      setStep('preview');
      void fetchDraftCourses();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading manual builder..." />;

  return (
    <div className="space-y-4 pb-24">
      <Card className="sticky top-0 z-40 rounded-2xl border-primary/20 bg-background/95 shadow-sm backdrop-blur">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">Manual Builder</p>
              <h2 className="truncate text-lg font-bold">{state.course.title || 'Untitled course'}</h2>
              <p className="text-xs text-muted-foreground">{editingCourseId ? 'Editing existing course' : 'Creating new course'} • visual editor</p>
            </div>
            <Button type="button" size="sm" onClick={saveDraft} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setShowExisting((value) => !value)}><Edit3 className="mr-2 size-4" />Edit existing</Button>
            <Button type="button" variant="outline" onClick={startNewCourse}><Plus className="mr-2 size-4" />New course</Button>
          </div>
        </CardContent>
      </Card>

      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}

      {showExisting ? (
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardHeader className="p-4">
            <CardTitle>Edit existing course</CardTitle>
            <CardDescription>Loads the saved blueprint, then converts it into Manual Builder fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              <option value="">Select course to edit</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title} {course.status ? `(${course.status})` : ''}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => void fetchDraftCourses(true)}><RefreshCw className="mr-2 size-4" />Refresh</Button>
              <Button type="button" onClick={() => void loadExistingCourse()} disabled={!selectedCourseId || loadingCourse}>{loadingCourse ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Edit3 className="mr-2 size-4" />}{loadingCourse ? 'Loading...' : 'Load'}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <Stat label="Modules" value={stats.modules} />
        <Stat label="Lessons" value={stats.lessons} />
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Quiz" value={stats.quiz} />
      </div>

      <div className="sticky top-[6.25rem] z-30 flex gap-2 overflow-x-auto rounded-2xl border bg-background/95 p-2 backdrop-blur">
        {(['course', 'structure', 'cards', 'quiz', 'preview'] as Step[]).map((item) => <Button key={item} type="button" size="sm" variant={step === item ? 'default' : 'outline'} onClick={() => setStep(item)} className="shrink-0">{label(item)}</Button>)}
      </div>

      {step === 'course' ? <CourseStep course={state.course} schools={schools} updateCourse={updateCourse} next={() => setStep('structure')} /> : null}
      {step === 'structure' ? <StructureStep modules={state.modules} moduleIndex={moduleIndex} lessonIndex={lessonIndex} setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); setCardIndex(0); }} setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }} updateModule={updateModule} addModule={addModule} deleteModule={deleteModule} updateLesson={updateLesson} addLesson={addLesson} deleteLesson={deleteLesson} goCards={() => setStep('cards')} /> : null}
      {step === 'cards' ? <CardsStep modules={state.modules} moduleIndex={moduleIndex} lessonIndex={lessonIndex} cardIndex={cardIndex} setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); setCardIndex(0); }} setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }} setCardIndex={setCardIndex} activeCard={activeCard} updateCard={updateCard} addCard={addCard} deleteCard={deleteCard} /> : null}
      {step === 'quiz' ? <QuizStep questions={state.questions} activeQuestion={activeQuestion} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} addQuestion={addQuestion} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} /> : null}
      {step === 'preview' ? <PreviewStep state={state} moduleIndex={moduleIndex} lessonIndex={lessonIndex} setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); }} setLessonIndex={setLessonIndex} saveDraft={saveDraft} saving={saving} editingCourseId={editingCourseId} /> : null}
    </div>
  );
}

function CourseStep({ course, schools, updateCourse, next }: { course: CourseForm; schools: School[]; updateCourse: (patch: Partial<CourseForm>) => void; next: () => void }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4"><CardTitle>Course details</CardTitle><CardDescription>Manual visual editing. No raw JSON needed.</CardDescription></CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <Field label="Course title"><Input value={course.title} onChange={(event) => updateCourse({ title: event.target.value })} /></Field>
        <Field label="Description"><Textarea rows={5} value={course.description} onChange={(event) => updateCourse({ description: event.target.value })} /></Field>
        <Field label="School / Faculty"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={course.schoolId} onChange={(event) => updateCourse({ schoolId: event.target.value })}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name || school.title || school.id}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Level"><Input value={course.level} onChange={(event) => updateCourse({ level: event.target.value })} /></Field><Field label="Hours"><Input inputMode="numeric" value={String(course.durationHours)} onChange={(event) => updateCourse({ durationHours: toNumber(event.target.value, 8) })} /></Field></div>
        <div className="grid grid-cols-3 gap-3"><Field label="Entry fee"><Input inputMode="decimal" value={String(course.entryFee)} onChange={(event) => updateCourse({ entryFee: toNumber(event.target.value, 0) })} /></Field><Field label="Cert fee"><Input inputMode="decimal" value={String(course.certificateFee)} onChange={(event) => updateCourse({ certificateFee: toNumber(event.target.value, 0) })} /></Field><Field label="Currency"><Input value={course.currency} onChange={(event) => updateCourse({ currency: event.target.value.toUpperCase().slice(0, 3) })} /></Field></div>
        <Field label="Outcomes, one per line"><Textarea rows={4} value={course.outcomes.join('\n')} onChange={(event) => updateCourse({ outcomes: lines(event.target.value) })} /></Field>
        <Button type="button" className="w-full" onClick={next}>Next: Structure</Button>
      </CardContent>
    </Card>
  );
}

function StructureStep(props: { modules: ModuleForm[]; moduleIndex: number; lessonIndex: number; setModuleIndex: (index: number) => void; setLessonIndex: (index: number) => void; updateModule: (index: number, patch: Partial<ModuleForm>) => void; addModule: () => void; deleteModule: (index: number) => void; updateLesson: (index: number, patch: Partial<LessonForm>) => void; addLesson: () => void; deleteLesson: (index: number) => void; goCards: () => void }) {
  const { modules, moduleIndex, lessonIndex, setModuleIndex, setLessonIndex, updateModule, addModule, deleteModule, updateLesson, addLesson, deleteLesson, goCards } = props;
  const activeModule = modules[moduleIndex] ?? modules[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2"><Button onClick={addModule}><Plus className="mr-2 size-4" />Add module</Button><Button variant="outline" onClick={addLesson}><Plus className="mr-2 size-4" />Add lesson</Button></div>
      {modules.map((module, index) => <Card key={module.id} className={`rounded-2xl ${index === moduleIndex ? 'border-primary/50 bg-primary/5' : ''}`}><CardHeader className="p-4"><button className="text-left" onClick={() => setModuleIndex(index)}><CardTitle>{module.title}</CardTitle><CardDescription>{module.lessons.length} lessons</CardDescription></button></CardHeader>{index === moduleIndex ? <CardContent className="space-y-3 p-4 pt-0"><Field label="Module title"><Input value={module.title} onChange={(event) => updateModule(index, { title: event.target.value })} /></Field><Field label="Description"><Textarea rows={3} value={module.description} onChange={(event) => updateModule(index, { description: event.target.value })} /></Field><Button variant="outline" className="w-full text-destructive" disabled={modules.length <= 1} onClick={() => deleteModule(index)}><Trash2 className="mr-2 size-4" />Delete module</Button></CardContent> : null}</Card>)}
      <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>{activeModule?.title || 'Lessons'}</CardTitle></CardHeader><CardContent className="space-y-2 p-4 pt-0">{activeModule?.lessons.map((lesson, index) => <div key={lesson.id} className={`rounded-xl border p-3 ${index === lessonIndex ? 'border-primary bg-primary/5' : ''}`}><button className="w-full text-left" onClick={() => setLessonIndex(index)}><p className="font-semibold">{lesson.title}</p><p className="text-xs text-muted-foreground">{lesson.cards.length} cards</p></button>{index === lessonIndex ? <div className="mt-3 space-y-3"><Field label="Lesson title"><Input value={lesson.title} onChange={(event) => updateLesson(index, { title: event.target.value })} /></Field><Field label="Summary"><Textarea rows={3} value={lesson.summary} onChange={(event) => updateLesson(index, { summary: event.target.value })} /></Field><div className="grid grid-cols-2 gap-2"><Button variant="outline" disabled={activeModule.lessons.length <= 1} onClick={() => deleteLesson(index)} className="text-destructive">Delete</Button><Button onClick={goCards}>Edit cards</Button></div></div> : null}</div>)}</CardContent></Card>
    </div>
  );
}

function CardsStep(props: { modules: ModuleForm[]; moduleIndex: number; lessonIndex: number; cardIndex: number; setModuleIndex: (index: number) => void; setLessonIndex: (index: number) => void; setCardIndex: (index: number) => void; activeCard?: Block; updateCard: (index: number, patch: Block) => void; addCard: (type?: string) => void; deleteCard: (index: number) => void }) {
  const { modules, moduleIndex, lessonIndex, cardIndex, setModuleIndex, setLessonIndex, setCardIndex, activeCard, updateCard, addCard, deleteCard } = props;
  const module = modules[moduleIndex] ?? modules[0];
  const lesson = module?.lessons[lessonIndex] ?? module?.lessons[0];
  const cardType = String(activeCard?.type || 'explanation');
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="space-y-3 p-4"><Field label="Module"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={moduleIndex} onChange={(event) => setModuleIndex(Number(event.target.value))}>{modules.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></Field><Field label="Lesson"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={lessonIndex} onChange={(event) => setLessonIndex(Number(event.target.value))}>{module?.lessons.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></Field><div className="grid grid-cols-3 gap-2"><Button onClick={() => addCard('explanation')}>Teach</Button><Button variant="outline" onClick={() => addCard('example')}>Example</Button><Button variant="outline" onClick={() => addCard('question')}>Question</Button></div></CardContent></Card>
      <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>{lesson?.title || 'Cards'}</CardTitle></CardHeader><CardContent className="space-y-2 p-4 pt-0">{lesson?.cards.map((card, index) => <button key={String(card.id || index)} className={`w-full rounded-xl border p-3 text-left ${index === cardIndex ? 'border-primary bg-primary/5' : ''}`} onClick={() => setCardIndex(index)}><p className="font-semibold">{String(card.title || `Card ${index + 1}`)}</p><p className="text-xs text-muted-foreground">{label(String(card.type || 'explanation'))} • {previewText(card).slice(0, 80)}</p></button>)}</CardContent></Card>
      {activeCard ? <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Edit card</CardTitle><CardDescription>Card {cardIndex + 1}</CardDescription></CardHeader><CardContent className="space-y-3 p-4 pt-0"><Field label="Type"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={cardType} onChange={(event) => updateCard(cardIndex, { type: event.target.value })}><option value="explanation">Teach</option><option value="example">Example</option><option value="summary">Summary</option><option value="question">Question</option></select></Field><Field label="Title"><Input value={String(activeCard.title || '')} onChange={(event) => updateCard(cardIndex, { title: event.target.value })} /></Field>{cardType === 'question' ? <><Field label="Question"><Textarea rows={4} value={String(activeCard.question || '')} onChange={(event) => updateCard(cardIndex, { question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={4} value={asStringList(activeCard.options).join('\n')} onChange={(event) => updateCard(cardIndex, { options: lines(event.target.value) })} /></Field><Field label="Correct answer"><Input value={String(activeCard.correctAnswer || activeCard.answer || '')} onChange={(event) => updateCard(cardIndex, { correctAnswer: event.target.value })} /></Field></> : <Field label="Body"><Textarea rows={7} value={String(activeCard.body || '')} onChange={(event) => updateCard(cardIndex, { body: event.target.value })} /></Field>}<Button variant="outline" className="w-full text-destructive" disabled={(lesson?.cards.length || 0) <= 1} onClick={() => deleteCard(cardIndex)}>Delete card</Button></CardContent></Card> : null}
    </div>
  );
}

function QuizStep(props: { questions: QuizQuestion[]; activeQuestion?: QuizQuestion; questionIndex: number; setQuestionIndex: (index: number) => void; addQuestion: () => void; updateQuestion: (index: number, patch: Partial<QuizQuestion>) => void; deleteQuestion: (index: number) => void }) {
  const { questions, activeQuestion, questionIndex, setQuestionIndex, addQuestion, updateQuestion, deleteQuestion } = props;
  return <div className="space-y-4"><Button className="w-full" onClick={addQuestion}><Plus className="mr-2 size-4" />Add question</Button>{questions.length ? <Card className="rounded-2xl"><CardContent className="space-y-3 p-4"><div className="flex gap-2 overflow-x-auto">{questions.map((question, index) => <Button key={question.id} size="sm" variant={index === questionIndex ? 'default' : 'outline'} onClick={() => setQuestionIndex(index)} className="shrink-0">Q{index + 1}</Button>)}</div>{activeQuestion ? <><Field label="Question"><Textarea rows={4} value={activeQuestion.question} onChange={(event) => updateQuestion(questionIndex, { question: event.target.value })} /></Field><Field label="Options"><Textarea rows={4} value={activeQuestion.options.join('\n')} onChange={(event) => updateQuestion(questionIndex, { options: lines(event.target.value) })} /></Field><Field label="Answer"><Input value={activeQuestion.answer} onChange={(event) => updateQuestion(questionIndex, { answer: event.target.value })} /></Field><Button variant="outline" className="w-full text-destructive" onClick={() => deleteQuestion(questionIndex)}>Delete question</Button></> : null}</CardContent></Card> : <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">No quiz questions yet.</div>}</div>;
}

function PreviewStep({ state, moduleIndex, lessonIndex, setModuleIndex, setLessonIndex, saveDraft, saving, editingCourseId }: { state: ManualState; moduleIndex: number; lessonIndex: number; setModuleIndex: (index: number) => void; setLessonIndex: (index: number) => void; saveDraft: () => void; saving: boolean; editingCourseId: string | null }) {
  const module = state.modules[moduleIndex] ?? state.modules[0];
  const lesson = module?.lessons[lessonIndex] ?? module?.lessons[0];
  return <div className="space-y-4"><Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Review & save</CardTitle><CardDescription>{editingCourseId ? 'This updates the existing draft.' : 'This creates a new draft.'}</CardDescription></CardHeader><CardContent className="p-4 pt-0"><Button className="w-full" disabled={saving} onClick={saveDraft}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{editingCourseId ? 'Update existing draft' : 'Save new draft'}</Button></CardContent></Card>{lesson ? <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle className="flex items-center gap-2"><Eye className="size-5 text-primary" />Student preview</CardTitle></CardHeader><CardContent className="space-y-3 p-4 pt-0"><div className="grid grid-cols-2 gap-2"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={moduleIndex} onChange={(event) => { setModuleIndex(Number(event.target.value)); setLessonIndex(0); }}>{state.modules.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select><select className="h-10 rounded-md border bg-background px-3 text-sm" value={lessonIndex} onChange={(event) => setLessonIndex(Number(event.target.value))}>{module?.lessons.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></div><LessonPlayer lesson={lessonForPlayer(lesson)} courseTitle={state.course.title} completed={false} completeLabel="Preview complete" /></CardContent></Card> : null}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border bg-muted/20 p-2"><p className="font-bold">{value}</p><p className="text-muted-foreground">{label}</p></div>;
}

function emptyQuestion(index = 0): QuizQuestion {
  return { id: uid('question'), question: `Question ${index + 1}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option A', explanation: 'Explain the answer.' };
}

function manualStateFromBlueprint(raw: unknown, apiCourse: Course | undefined, fallback: ManualState): ManualState {
  const record = asRecord(raw);
  const summary = asRecord(record.course ?? record.courseSummary ?? record.course_summary);
  const modulesRaw = Array.isArray(record.modules) ? record.modules : Array.isArray(record.lessons) ? [{ title: 'Imported lessons', lessons: record.lessons }] : fallback.modules;
  const assessments = asRecord(record.assessments);
  const questionsRaw = record.questions ?? assessments.questions ?? assessments.quizzes;

  return {
    course: {
      ...fallback.course,
      title: stringValue(apiCourse?.title ?? summary.title, fallback.course.title),
      description: stringValue(apiCourse?.description ?? summary.description, fallback.course.description),
      schoolId: stringValue(apiCourse?.schoolId ?? summary.schoolId ?? summary.school_id, fallback.course.schoolId),
      level: stringValue(apiCourse?.level ?? summary.level, fallback.course.level),
      durationHours: toNumber(apiCourse?.durationHours ?? summary.durationHours ?? summary.totalDurationHours, fallback.course.durationHours),
      entryFee: toNumber(apiCourse?.price ?? summary.entryFee ?? summary.price, fallback.course.entryFee),
      currency: stringValue(apiCourse?.currency ?? summary.currency, fallback.course.currency),
      certificateFee: toNumber(apiCourse?.certificateFee ?? summary.certificateFee, fallback.course.certificateFee),
      outcomes: asStringList(summary.outcomes),
    },
    modules: modulesRaw.map(moduleFromRaw).filter(Boolean),
    questions: Array.isArray(questionsRaw) ? questionsRaw.map(questionFromRaw) : [],
  };
}

function moduleFromRaw(value: unknown, index: number): ModuleForm {
  const record = asRecord(value);
  const lessonsRaw = Array.isArray(record.lessons) ? record.lessons : [];
  return { id: stringValue(record.id, uid('module')), title: stringValue(record.title ?? record.name, `Module ${index + 1}`), description: stringValue(record.description ?? record.summary, 'Describe this module.'), outcomes: asStringList(record.outcomes), lessons: lessonsRaw.length ? lessonsRaw.map(lessonFromRaw) : [emptyLesson(0)] };
}

function lessonFromRaw(value: unknown, index: number): LessonForm {
  const record = asRecord(value);
  return { id: stringValue(record.id, uid('lesson')), title: stringValue(record.title ?? record.name, `Lesson ${index + 1}`), summary: stringValue(record.summary ?? record.description ?? record.content, 'Describe this lesson.'), outcomes: asStringList(record.outcomes), cards: cardList(record.cards ?? record.blocks ?? record.learningObjects) };
}

function questionFromRaw(value: unknown, index: number): QuizQuestion {
  const record = asRecord(value);
  return { id: stringValue(record.id, uid('question')), question: stringValue(record.question ?? record.prompt, `Question ${index + 1}`), options: asStringList(record.options), answer: stringValue(record.answer ?? record.correctAnswer ?? record.correct_answer, ''), explanation: stringValue(record.explanation, '') };
}

function draftPayloadFromManualState(state: ManualState, editingCourseId: string | null) {
  const id = editingCourseId || `manual-${slug(state.course.title)}-${Date.now()}`;
  const modules = state.modules.map((module) => ({ title: module.title, description: module.description }));
  const lessons = state.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, content: JSON.stringify({ blocks: lesson.cards }), moduleTitle: module.title, moduleIndex, lessonIndex, sortOrder: moduleIndex * 100 + lessonIndex, blocks: lesson.cards })));

  return {
    sourceMode: 'manual',
    course: { id, title: state.course.title, description: state.course.description, schoolId: state.course.schoolId, imageId: 'short-course-manual', status: 'draft', level: state.course.level, durationHours: state.course.durationHours, price: String(state.course.entryFee), currency: state.course.currency || 'ZMW', certificateFee: String(state.course.certificateFee), certificateCurrency: state.course.currency || 'ZMW', modules, lessons, outcomes: state.course.outcomes },
    blueprint: { courseSummary: { title: state.course.title, audience: 'Learners', level: state.course.level, description: state.course.description, prerequisites: [], totalDurationHours: state.course.durationHours, outcomes: state.course.outcomes, finalAssessment: 'Complete all assessments.', certificateCriteria: 'Complete the learning path.' }, assessments: { quizzes: state.questions.map((question) => question.question), practicalWork: [], instructorReviewChecklist: [] }, modules: state.modules.map((module) => ({ id: module.id, title: module.title, description: module.description, durationMinutes: 60, outcomes: module.outcomes, moduleAssessment: 'Complete all lessons.', lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, durationMinutes: 30, outcomes: lesson.outcomes, activities: [], assessment: 'Complete practice checks.', blocks: lesson.cards })) })) },
  };
}

function lessonForPlayer(lesson: LessonForm) {
  return { id: lesson.id, courseId: 'manual-builder-preview', title: lesson.title, summary: lesson.summary, content: JSON.stringify({ blocks: lesson.cards }), estimatedMinutes: Math.max(5, Math.ceil(lesson.cards.length * 1.2)), difficulty: 'builder-preview' } as never;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cardList(value: unknown): Block[] {
  const record = asRecord(value);
  const source = Array.isArray(value) ? value : Array.isArray(record.cards) ? record.cards : Array.isArray(record.blocks) ? record.blocks : [];
  const cards = source.filter((item): item is Block => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  return cards.length ? cards : [emptyCard('explanation', 0)];
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return lines(value);
  return [];
}

function lines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function toNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function label(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function previewText(card: Block): string {
  return String(card.body ?? card.question ?? card.text ?? card.statement ?? card.front ?? card.back ?? card.explanation ?? 'No content yet.');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'manual-course';
}
