'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { BookOpen, Copy, Edit3, Eye, FileJson, Layers3, ListChecks, Loader2, Plus, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';
import { createShortCourseDraftWithBlueprint, getSchools } from '@/lib/api';
import type { Course, School } from '@/lib/api/types';

type BuilderStep = 'course' | 'structure' | 'cards' | 'quiz' | 'preview';
type SaveStatus = 'draft' | 'published';
type LearningCard = Record<string, unknown>;
type ExistingCourse = Course & { status?: string | null; lessonCount?: number | null; updatedAt?: string | null; createdAt?: string | null };

type CourseJson = {
  title: string;
  description: string;
  schoolId: string;
  level: string;
  durationHours: number;
  entryFee: number;
  currency: string;
  certificateFee: number;
  audience: string;
  prerequisites: string[];
  outcomes: string[];
};

type SubLesson = {
  id: string;
  title: string;
  summary: string;
  cards: LearningCard[];
};

type Lesson = {
  id: string;
  title: string;
  summary: string;
  outcomes: string[];
  cards: LearningCard[];
  subLessons: SubLesson[];
};

type Module = {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  lessons: Lesson[];
};

type Question = {
  id: string;
  type: string;
  difficulty: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

type Blueprint = {
  course: CourseJson;
  modules: Module[];
  questions: Question[];
};

const steps: Array<{ id: BuilderStep; label: string; icon: typeof BookOpen }> = [
  { id: 'course', label: 'Course', icon: BookOpen },
  { id: 'structure', label: 'Structure', icon: Layers3 },
  { id: 'cards', label: 'Cards', icon: Edit3 },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'preview', label: 'Preview', icon: Eye },
];

const cardTypes = ['explanation', 'teach', 'example', 'question', 'summary', 'flashcard', 'practice_task', 'case_study', 'fill_blank', 'true_false'];
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const initial: Blueprint = {
  course: {
    title: 'Untitled course',
    description: 'Describe this course.',
    schoolId: '',
    level: 'beginner',
    durationHours: 8,
    entryFee: 0,
    currency: 'ZMW',
    certificateFee: 0,
    audience: 'Learners',
    prerequisites: [],
    outcomes: [],
  },
  modules: [blankModule(0)],
  questions: [],
};

function blankModule(index = 0): Module {
  return {
    id: uid('module'),
    title: `Module ${index + 1}`,
    description: 'Describe this module.',
    outcomes: [],
    lessons: [blankLesson(0)],
  };
}

function blankLesson(index = 0): Lesson {
  return {
    id: uid('lesson'),
    title: `Lesson ${index + 1}`,
    summary: 'Describe this lesson.',
    outcomes: [],
    cards: [blankCard('explanation', 0), blankCard('example', 1), blankCard('question', 2)],
    subLessons: [],
  };
}

function blankCard(type = 'explanation', index = 0): LearningCard {
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

  if (type === 'flashcard') {
    return {
      id: uid('card'),
      type: 'flashcard',
      title: `Flashcard ${index + 1}`,
      front: 'Term or prompt',
      back: 'Answer or explanation',
    };
  }

  if (type === 'fill_blank') {
    return {
      id: uid('card'),
      type: 'fill_blank',
      title: `Fill blank ${index + 1}`,
      text: 'Complete this: ____',
      correctAnswer: 'answer',
      explanation: 'Explain the missing answer.',
    };
  }

  if (type === 'true_false') {
    return {
      id: uid('card'),
      type: 'true_false',
      title: `True or false ${index + 1}`,
      statement: 'Write a statement learners should judge.',
      correctAnswer: true,
      explanation: 'Explain why.',
    };
  }

  return {
    id: uid('card'),
    type: type === 'teach' ? 'explanation' : type,
    title: `${label(type)} ${index + 1}`,
    body: type === 'summary' ? 'Summarize the key takeaways.' : 'Write the card content here.',
  };
}

function blankQuestion(index = 0): Question {
  return {
    id: uid('question'),
    type: 'mcq',
    difficulty: 'easy',
    question: `Question ${index + 1}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 'Option A',
    explanation: 'Explain the answer.',
  };
}

export function MobileFirstManualCourseBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<ExistingCourse[]>([]);
  const [blueprint, setBlueprint] = useState<Blueprint>(initial);
  const [step, setStep] = useState<BuilderStep>('course');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showExisting, setShowExisting] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const [previewingCard, setPreviewingCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const activeModule = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  const activeLesson = activeModule?.lessons[lessonIndex] ?? activeModule?.lessons[0];
  const activeCard = activeLesson?.cards[cardIndex] ?? activeLesson?.cards[0];
  const activeQuestion = blueprint.questions[quizIndex] ?? blueprint.questions[0];

  const stats = useMemo(() => {
    const lessonCount = blueprint.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const cardCount = blueprint.modules.reduce((sum, module) => sum + module.lessons.reduce((total, lesson) => total + lesson.cards.length + lesson.subLessons.reduce((subTotal, sub) => subTotal + sub.cards.length, 0), 0), 0);
    return { modules: blueprint.modules.length, lessons: lessonCount, cards: cardCount, quiz: blueprint.questions.length };
  }, [blueprint]);

  const validation = useMemo(() => validate(blueprint), [blueprint]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), refreshCourses(false)])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        setSelectedCourseId(courseData[0]?.id || '');
        if (schoolData[0]) {
          setBlueprint((current) => current.course.schoolId ? current : { ...current, course: { ...current.course, schoolId: schoolData[0].id } });
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load builder data.'))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function refreshCourses(updateState = true) {
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

  function patchCourse(patch: Partial<CourseJson>) {
    setBlueprint((current) => ({ ...current, course: { ...current.course, ...patch } }));
  }

  function setNext(next: Blueprint, msg?: string) {
    setBlueprint(ensureBlueprint(next, blueprint));
    setMessage(msg ?? null);
    setError(null);
  }

  function startNewCourse() {
    const schoolId = schools[0]?.id || '';
    setNext({ ...initial, course: { ...initial.course, schoolId } }, 'Started a new course.');
    setEditingCourseId(null);
    setSelectedCourseId(courses[0]?.id || '');
    setModuleIndex(0);
    setLessonIndex(0);
    setCardIndex(0);
    setQuizIndex(0);
    setStep('course');
    setShowExisting(false);
  }

  async function loadExistingCourse(courseId = selectedCourseId) {
    if (!courseId) {
      setError('Select a course first.');
      return;
    }

    setLoadingCourse(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<Record<string, unknown>>(`/admin/short-courses/drafts/${encodeURIComponent(courseId)}/blueprint`);
      const loaded = normalizeBlueprint(response.blueprint ?? response, blueprint, response.course as Course | undefined);
      setNext(loaded, 'Existing course loaded from the same blueprint route used by JSON Builder.');
      setEditingCourseId(courseId);
      setSelectedCourseId(courseId);
      setModuleIndex(0);
      setLessonIndex(0);
      setCardIndex(0);
      setQuizIndex(0);
      setStep('structure');
      setShowExisting(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this course from the draft blueprint route.');
    } finally {
      setLoadingCourse(false);
    }
  }

  async function uploadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const raw = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
      setNext(normalizeBlueprint(raw, blueprint), `${file.name} imported into Manual Builder.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import JSON.');
    }
  }

  async function save(status: SaveStatus = 'draft') {
    if (validation.errors.length) {
      setError('Fix validation errors before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = toDraftPayload(blueprint, status, editingCourseId);
      if (editingCourseId) {
        await apiFetch(`/admin/short-courses/drafts/${encodeURIComponent(editingCourseId)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage(status === 'published' ? 'Existing course updated and published.' : 'Existing course draft updated.');
      } else {
        const saved = await createShortCourseDraftWithBlueprint(payload as never);
        const savedId = String(saved?.id || payload.course.id || '');
        setEditingCourseId(savedId || null);
        if (savedId) setSelectedCourseId(savedId);
        setMessage(status === 'published' ? 'Course published.' : 'New draft saved.');
      }
      setStep('preview');
      void refreshCourses();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save course.');
    } finally {
      setSaving(false);
    }
  }

  function addModule() {
    const next = clone(blueprint);
    next.modules.push(blankModule(next.modules.length));
    setNext(next, 'Module added.');
    setModuleIndex(next.modules.length - 1);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function deleteModule(index = moduleIndex) {
    if (blueprint.modules.length <= 1) {
      setError('Keep at least one module.');
      return;
    }
    const next = clone(blueprint);
    next.modules.splice(index, 1);
    setNext(next, 'Module deleted.');
    setModuleIndex(0);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function updateModule(index: number, patch: Partial<Module>) {
    const next = clone(blueprint);
    next.modules[index] = { ...next.modules[index], ...patch };
    setNext(next);
  }

  function moveModule(from: number, direction: -1 | 1) {
    const to = from + direction;
    if (to < 0 || to >= blueprint.modules.length) return;
    const next = clone(blueprint);
    next.modules = moveItem(next.modules, from, to);
    setNext(next, 'Module moved.');
    setModuleIndex(to);
  }

  function addLesson() {
    const next = clone(blueprint);
    const module = next.modules[moduleIndex];
    if (!module) return;
    module.lessons.push(blankLesson(module.lessons.length));
    setNext(next, 'Lesson added.');
    setLessonIndex(module.lessons.length - 1);
    setCardIndex(0);
    setStep('cards');
  }

  function deleteLesson(index = lessonIndex) {
    const next = clone(blueprint);
    const module = next.modules[moduleIndex];
    if (!module || module.lessons.length <= 1) {
      setError('Keep at least one lesson in this module.');
      return;
    }
    module.lessons.splice(index, 1);
    setNext(next, 'Lesson deleted.');
    setLessonIndex(0);
    setCardIndex(0);
  }

  function updateLesson(index: number, patch: Partial<Lesson>) {
    const next = clone(blueprint);
    const module = next.modules[moduleIndex];
    if (!module) return;
    module.lessons[index] = { ...module.lessons[index], ...patch };
    setNext(next);
  }

  function moveLesson(from: number, direction: -1 | 1) {
    const next = clone(blueprint);
    const module = next.modules[moduleIndex];
    if (!module) return;
    const to = from + direction;
    if (to < 0 || to >= module.lessons.length) return;
    module.lessons = moveItem(module.lessons, from, to);
    setNext(next, 'Lesson moved.');
    setLessonIndex(to);
  }

  function addCard(type = 'explanation') {
    const next = clone(blueprint);
    const lesson = next.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    lesson.cards.push(blankCard(type, lesson.cards.length));
    setNext(next, 'Card added.');
    setCardIndex(lesson.cards.length - 1);
    setEditingCard(true);
  }

  function updateCard(index: number, patch: LearningCard) {
    const next = clone(blueprint);
    const lesson = next.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    lesson.cards[index] = { ...lesson.cards[index], ...patch };
    setNext(next);
  }

  function deleteCard(index: number) {
    const next = clone(blueprint);
    const lesson = next.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson || lesson.cards.length <= 1) {
      setError('Keep at least one card in this lesson.');
      return;
    }
    lesson.cards.splice(index, 1);
    setNext(next, 'Card deleted.');
    setCardIndex(0);
  }

  function duplicateCard(index: number) {
    const next = clone(blueprint);
    const lesson = next.modules[moduleIndex]?.lessons[lessonIndex];
    const card = lesson?.cards[index];
    if (!lesson || !card) return;
    lesson.cards.splice(index + 1, 0, { ...card, id: uid('card'), title: `${str(card.title, 'Card')} copy` });
    setNext(next, 'Card duplicated.');
    setCardIndex(index + 1);
  }

  function moveCard(from: number, direction: -1 | 1) {
    const next = clone(blueprint);
    const lesson = next.modules[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    const to = from + direction;
    if (to < 0 || to >= lesson.cards.length) return;
    lesson.cards = moveItem(lesson.cards, from, to);
    setNext(next, 'Card moved.');
    setCardIndex(to);
  }

  function addQuestion() {
    const next = clone(blueprint);
    next.questions.push(blankQuestion(next.questions.length));
    setNext(next, 'Question added.');
    setQuizIndex(next.questions.length - 1);
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    const next = clone(blueprint);
    next.questions[index] = { ...next.questions[index], ...patch };
    setNext(next);
  }

  function deleteQuestion(index: number) {
    const next = clone(blueprint);
    next.questions.splice(index, 1);
    setNext(next, 'Question deleted.');
    setQuizIndex(0);
  }

  if (loading) return <PageLoading message="Loading manual builder..." />;

  if (editingCard && activeCard) {
    return (
      <CardEditorScreen
        card={activeCard}
        index={cardIndex}
        total={activeLesson?.cards.length || 0}
        lesson={activeLesson}
        courseTitle={blueprint.course.title}
        update={(patch) => updateCard(cardIndex, patch)}
        previous={() => setCardIndex((current) => Math.max(0, current - 1))}
        next={() => setCardIndex((current) => Math.min((activeLesson?.cards.length || 1) - 1, current + 1))}
        close={() => setEditingCard(false)}
        previewing={previewingCard}
        setPreviewing={setPreviewingCard}
      />
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <input ref={uploadRef} type="file" accept="application/json,.json" className="hidden" onChange={uploadJson} />
      <Card className="sticky top-0 z-40 rounded-2xl border-primary/20 bg-background/95 shadow-sm backdrop-blur">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">Manual Builder</p>
              <h2 className="truncate text-lg font-bold">{blueprint.course.title || 'Untitled course'}</h2>
              <p className="text-xs text-muted-foreground">{editingCourseId ? 'Editing existing course' : 'Creating new course'} • JSON Builder draft route</p>
            </div>
            <Button type="button" size="sm" onClick={() => save('draft')} disabled={saving}>
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
        <ExistingCoursePanel
          courses={courses}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          loadExistingCourse={loadExistingCourse}
          refreshCourses={() => refreshCourses(true)}
          loadingCourse={loadingCourse}
        />
      ) : null}

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <Stat label="Modules" value={stats.modules} />
        <Stat label="Lessons" value={stats.lessons} />
        <Stat label="Cards" value={stats.cards} />
        <Stat label="Quiz" value={stats.quiz} />
      </div>

      <div className="sticky top-[6.25rem] z-30 flex gap-2 overflow-x-auto rounded-2xl border bg-background/95 p-2 backdrop-blur">
        {steps.map((item) => {
          const Icon = item.icon;
          return <Button key={item.id} type="button" size="sm" variant={step === item.id ? 'default' : 'outline'} onClick={() => setStep(item.id)} className="shrink-0"><Icon className="mr-2 size-4" />{item.label}</Button>;
        })}
      </div>

      {step === 'course' ? <CourseStep blueprint={blueprint} patchCourse={patchCourse} schools={schools} next={() => setStep('structure')} uploadJson={() => uploadRef.current?.click()} /> : null}
      {step === 'structure' ? <StructureStep blueprint={blueprint} moduleIndex={moduleIndex} lessonIndex={lessonIndex} setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); setCardIndex(0); }} setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }} updateModule={updateModule} updateLesson={updateLesson} addModule={addModule} deleteModule={deleteModule} moveModule={moveModule} addLesson={addLesson} deleteLesson={deleteLesson} moveLesson={moveLesson} goCards={() => setStep('cards')} /> : null}
      {step === 'cards' ? <CardsStep blueprint={blueprint} moduleIndex={moduleIndex} lessonIndex={lessonIndex} cardIndex={cardIndex} setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); setCardIndex(0); }} setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }} setCardIndex={setCardIndex} openCard={() => setEditingCard(true)} addCard={addCard} duplicateCard={duplicateCard} deleteCard={deleteCard} moveCard={moveCard} /> : null}
      {step === 'quiz' ? <QuizStep questions={blueprint.questions} activeQuestion={activeQuestion} quizIndex={quizIndex} setQuizIndex={setQuizIndex} addQuestion={addQuestion} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} /> : null}
      {step === 'preview' ? <PreviewStep blueprint={blueprint} moduleIndex={moduleIndex} lessonIndex={lessonIndex} setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); }} setLessonIndex={setLessonIndex} validation={validation} save={() => save('draft')} saving={saving} editingCourseId={editingCourseId} /> : null}
    </div>
  );
}

function ExistingCoursePanel(props: { courses: ExistingCourse[]; selectedCourseId: string; setSelectedCourseId: (id: string) => void; loadExistingCourse: () => void; refreshCourses: () => void; loadingCourse: boolean }) {
  const { courses, selectedCourseId, setSelectedCourseId, loadExistingCourse, refreshCourses, loadingCourse } = props;
  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5">
      <CardHeader className="p-4">
        <CardTitle>Edit existing course</CardTitle>
        <CardDescription>This uses the same draft blueprint route as JSON Builder.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
          <option value="">Select course to edit</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title} {course.status ? `(${course.status})` : ''}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={refreshCourses}><RefreshCw className="mr-2 size-4" />Refresh</Button>
          <Button type="button" onClick={loadExistingCourse} disabled={!selectedCourseId || loadingCourse}>{loadingCourse ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Edit3 className="mr-2 size-4" />}{loadingCourse ? 'Loading...' : 'Load'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseStep({ blueprint, patchCourse, schools, next, uploadJson }: { blueprint: Blueprint; patchCourse: (patch: Partial<CourseJson>) => void; schools: School[]; next: () => void; uploadJson: () => void }) {
  const course = blueprint.course;
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4">
        <CardTitle>Course details</CardTitle>
        <CardDescription>Edit the same blueprint format used by JSON Builder.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <Field label="Course title"><Input value={course.title} onChange={(event) => patchCourse({ title: event.target.value })} /></Field>
        <Field label="Description"><Textarea rows={5} value={course.description} onChange={(event) => patchCourse({ description: event.target.value })} /></Field>
        <Field label="School / Faculty"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={course.schoolId} onChange={(event) => patchCourse({ schoolId: event.target.value })}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name || school.title || school.id}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Level"><Input value={course.level} onChange={(event) => patchCourse({ level: event.target.value })} /></Field><Field label="Hours"><Input inputMode="numeric" value={String(course.durationHours)} onChange={(event) => patchCourse({ durationHours: num(event.target.value, 8) })} /></Field></div>
        <div className="grid grid-cols-3 gap-3"><Field label="Entry fee"><Input inputMode="decimal" value={String(course.entryFee)} onChange={(event) => patchCourse({ entryFee: num(event.target.value, 0) })} /></Field><Field label="Cert fee"><Input inputMode="decimal" value={String(course.certificateFee)} onChange={(event) => patchCourse({ certificateFee: num(event.target.value, 0) })} /></Field><Field label="Currency"><Input value={course.currency} onChange={(event) => patchCourse({ currency: event.target.value.toUpperCase().slice(0, 3) })} /></Field></div>
        <Field label="Outcomes, one per line"><Textarea rows={4} value={course.outcomes.join('\n')} onChange={(event) => patchCourse({ outcomes: arr(event.target.value) })} /></Field>
        <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={uploadJson}><Upload className="mr-2 size-4" />Import JSON</Button><Button type="button" onClick={next}>Next: Structure</Button></div>
      </CardContent>
    </Card>
  );
}

function StructureStep(props: { blueprint: Blueprint; moduleIndex: number; lessonIndex: number; setModuleIndex: (index: number) => void; setLessonIndex: (index: number) => void; updateModule: (index: number, patch: Partial<Module>) => void; updateLesson: (index: number, patch: Partial<Lesson>) => void; addModule: () => void; deleteModule: (index?: number) => void; moveModule: (index: number, direction: -1 | 1) => void; addLesson: () => void; deleteLesson: (index?: number) => void; moveLesson: (index: number, direction: -1 | 1) => void; goCards: () => void }) {
  const { blueprint, moduleIndex, lessonIndex, setModuleIndex, setLessonIndex, updateModule, updateLesson, addModule, deleteModule, moveModule, addLesson, deleteLesson, moveLesson, goCards } = props;
  const activeModule = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={addModule}><Plus className="mr-2 size-4" />Add module</Button><Button type="button" variant="outline" onClick={addLesson}><Plus className="mr-2 size-4" />Add lesson</Button></div>
      {blueprint.modules.map((module, index) => (
        <Card key={module.id} className={`rounded-2xl ${index === moduleIndex ? 'border-primary/50 bg-primary/5' : ''}`}>
          <CardHeader className="p-4"><button type="button" className="text-left" onClick={() => setModuleIndex(index)}><CardTitle>{module.title}</CardTitle><CardDescription>{module.lessons.length} lessons</CardDescription></button></CardHeader>
          {index === moduleIndex ? <CardContent className="space-y-3 p-4 pt-0"><Field label="Module title"><Input value={module.title} onChange={(event) => updateModule(index, { title: event.target.value })} /></Field><Field label="Description"><Textarea rows={3} value={module.description} onChange={(event) => updateModule(index, { description: event.target.value })} /></Field><Field label="Outcomes, one per line"><Textarea rows={3} value={module.outcomes.join('\n')} onChange={(event) => updateModule(index, { outcomes: arr(event.target.value) })} /></Field><div className="grid grid-cols-3 gap-2"><Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveModule(index, -1)}>Up</Button><Button size="sm" variant="outline" disabled={index === blueprint.modules.length - 1} onClick={() => moveModule(index, 1)}>Down</Button><Button size="sm" variant="outline" className="text-destructive" disabled={blueprint.modules.length <= 1} onClick={() => deleteModule(index)}>Delete</Button></div></CardContent> : null}
        </Card>
      ))}
      <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>{activeModule?.title || 'Lessons'}</CardTitle></CardHeader><CardContent className="space-y-2 p-4 pt-0">{activeModule?.lessons.map((lesson, index) => <div key={lesson.id} className={`rounded-xl border p-3 ${index === lessonIndex ? 'border-primary bg-primary/5' : ''}`}><button type="button" className="w-full text-left" onClick={() => setLessonIndex(index)}><p className="font-semibold">{lesson.title}</p><p className="text-xs text-muted-foreground">{lesson.cards.length} cards</p></button>{index === lessonIndex ? <div className="mt-3 space-y-3"><Field label="Lesson title"><Input value={lesson.title} onChange={(event) => updateLesson(index, { title: event.target.value })} /></Field><Field label="Summary"><Textarea rows={3} value={lesson.summary} onChange={(event) => updateLesson(index, { summary: event.target.value })} /></Field><Field label="Outcomes, one per line"><Textarea rows={3} value={lesson.outcomes.join('\n')} onChange={(event) => updateLesson(index, { outcomes: arr(event.target.value) })} /></Field><div className="grid grid-cols-2 gap-2"><Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveLesson(index, -1)}>Up</Button><Button size="sm" variant="outline" disabled={index === activeModule.lessons.length - 1} onClick={() => moveLesson(index, 1)}>Down</Button><Button size="sm" variant="outline" className="text-destructive" disabled={activeModule.lessons.length <= 1} onClick={() => deleteLesson(index)}>Delete</Button><Button size="sm" onClick={goCards}>Edit cards</Button></div></div> : null}</div>)}</CardContent></Card>
    </div>
  );
}

function CardsStep(props: { blueprint: Blueprint; moduleIndex: number; lessonIndex: number; cardIndex: number; setModuleIndex: (index: number) => void; setLessonIndex: (index: number) => void; setCardIndex: (index: number) => void; openCard: () => void; addCard: (type?: string) => void; duplicateCard: (index: number) => void; deleteCard: (index: number) => void; moveCard: (index: number, direction: -1 | 1) => void }) {
  const { blueprint, moduleIndex, lessonIndex, cardIndex, setModuleIndex, setLessonIndex, setCardIndex, openCard, addCard, duplicateCard, deleteCard, moveCard } = props;
  const module = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  const lesson = module?.lessons[lessonIndex] ?? module?.lessons[0];
  const [newType, setNewType] = useState('explanation');
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="space-y-3 p-4"><Field label="Module"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={moduleIndex} onChange={(event) => setModuleIndex(Number(event.target.value))}>{blueprint.modules.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></Field><Field label="Lesson"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={lessonIndex} onChange={(event) => setLessonIndex(Number(event.target.value))}>{module?.lessons.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></Field><div className="grid grid-cols-[1fr_auto] gap-2"><select className="h-11 rounded-md border bg-background px-3 text-sm" value={newType} onChange={(event) => setNewType(event.target.value)}>{cardTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select><Button type="button" onClick={() => addCard(newType)}><Plus className="mr-2 size-4" />Add</Button></div></CardContent></Card>
      <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>{lesson?.title || 'Cards'}</CardTitle><CardDescription>Tap a card to edit full screen.</CardDescription></CardHeader><CardContent className="space-y-2 p-4 pt-0">{lesson?.cards.map((card, index) => <div key={str(card.id, String(index))} className={`rounded-xl border p-3 ${index === cardIndex ? 'border-primary bg-primary/5' : ''}`}><button type="button" className="w-full text-left" onClick={() => { setCardIndex(index); openCard(); }}><div className="flex gap-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">{index + 1}</span><div className="min-w-0"><p className="truncate font-semibold">{str(card.title, `Card ${index + 1}`)}</p><p className="text-xs text-muted-foreground">{label(str(card.type, 'explanation'))} • {previewText(card).slice(0, 90)}</p></div></div></button><div className="mt-3 grid grid-cols-4 gap-2"><Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveCard(index, -1)}>Up</Button><Button size="sm" variant="outline" disabled={index === lesson.cards.length - 1} onClick={() => moveCard(index, 1)}>Down</Button><Button size="sm" variant="outline" onClick={() => duplicateCard(index)}><Copy className="size-3" /></Button><Button size="sm" variant="outline" className="text-destructive" disabled={lesson.cards.length <= 1} onClick={() => deleteCard(index)}><Trash2 className="size-3" /></Button></div></div>)}</CardContent></Card>
    </div>
  );
}

function CardEditorScreen(props: { card: LearningCard; index: number; total: number; lesson?: Lesson; courseTitle: string; update: (patch: LearningCard) => void; previous: () => void; next: () => void; close: () => void; previewing: boolean; setPreviewing: (value: boolean) => void }) {
  const { card, index, total, lesson, courseTitle, update, previous, next, close, previewing, setPreviewing } = props;
  if (previewing && lesson) {
    return <div className="space-y-3 pb-24"><div className="sticky top-0 z-40 flex items-center justify-between rounded-2xl border bg-background/95 p-3 backdrop-blur"><div><p className="text-xs text-muted-foreground">Preview</p><p className="font-semibold">{lesson.title}</p></div><Button variant="outline" size="sm" onClick={() => setPreviewing(false)}><X className="mr-2 size-4" />Close</Button></div><LessonPlayer lesson={lessonForPlayer(lesson)} courseTitle={courseTitle} completed={false} completeLabel="Preview complete" /></div>;
  }
  return <div className="space-y-4 pb-24"><Card className="sticky top-0 z-40 rounded-2xl border-primary/20 bg-background/95 backdrop-blur"><CardContent className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">Card {index + 1} of {total}</p><h2 className="truncate text-lg font-bold">{str(card.title, 'Untitled card')}</h2></div><Button variant="outline" size="sm" onClick={close}><X className="mr-2 size-4" />Done</Button></CardContent></Card><Card className="rounded-2xl"><CardContent className="space-y-4 p-4"><Field label="Type"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={str(card.type, 'explanation')} onChange={(event) => update({ type: event.target.value })}>{cardTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select></Field><Field label="Title"><Input value={str(card.title)} onChange={(event) => update({ title: event.target.value })} /></Field><CardFields card={card} update={update} /><Button variant="outline" className="w-full" onClick={() => setPreviewing(true)}><Eye className="mr-2 size-4" />Preview lesson</Button></CardContent></Card><div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 gap-2 border-t bg-background/95 p-3 backdrop-blur"><Button variant="outline" disabled={index === 0} onClick={previous}>Previous</Button><Button onClick={close}>Save</Button><Button variant="outline" disabled={index >= total - 1} onClick={next}>Next</Button></div></div>;
}

function CardFields({ card, update }: { card: LearningCard; update: (patch: LearningCard) => void }) {
  const type = str(card.type, 'explanation');
  if (type === 'question') return <><Field label="Question"><Textarea rows={4} value={str(card.question)} onChange={(event) => update({ question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={5} value={arr(card.options).join('\n')} onChange={(event) => update({ options: arr(event.target.value) })} /></Field><Field label="Correct answer"><Input value={str(card.correctAnswer ?? card.answer)} onChange={(event) => update({ correctAnswer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={str(card.explanation)} onChange={(event) => update({ explanation: event.target.value })} /></Field></>;
  if (type === 'flashcard') return <><Field label="Front"><Textarea rows={4} value={str(card.front)} onChange={(event) => update({ front: event.target.value })} /></Field><Field label="Back"><Textarea rows={4} value={str(card.back)} onChange={(event) => update({ back: event.target.value })} /></Field></>;
  if (type === 'fill_blank') return <><Field label="Text"><Textarea rows={4} value={str(card.text)} onChange={(event) => update({ text: event.target.value })} /></Field><Field label="Correct answer"><Input value={str(card.correctAnswer ?? card.answer)} onChange={(event) => update({ correctAnswer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={str(card.explanation)} onChange={(event) => update({ explanation: event.target.value })} /></Field></>;
  if (type === 'true_false') return <><Field label="Statement"><Textarea rows={4} value={str(card.statement)} onChange={(event) => update({ statement: event.target.value })} /></Field><Field label="Correct answer"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={String(card.correctAnswer ?? true)} onChange={(event) => update({ correctAnswer: event.target.value === 'true' })}><option value="true">True</option><option value="false">False</option></select></Field><Field label="Explanation"><Textarea rows={3} value={str(card.explanation)} onChange={(event) => update({ explanation: event.target.value })} /></Field></>;
  return <><Field label="Body"><Textarea rows={8} value={str(card.body)} onChange={(event) => update({ body: event.target.value })} /></Field><details className="rounded-xl border p-3"><summary className="font-semibold">Advanced</summary><div className="mt-3 space-y-3"><Field label="Image URL"><Input value={str(card.imageUrl ?? card.image_url)} onChange={(event) => update({ imageUrl: event.target.value })} /></Field><Field label="Equation"><Input value={str(card.equation)} onChange={(event) => update({ equation: event.target.value })} /></Field></div></details></>;
}

function QuizStep({ questions, activeQuestion, quizIndex, setQuizIndex, addQuestion, updateQuestion, deleteQuestion }: { questions: Question[]; activeQuestion?: Question; quizIndex: number; setQuizIndex: (index: number) => void; addQuestion: () => void; updateQuestion: (index: number, patch: Partial<Question>) => void; deleteQuestion: (index: number) => void }) {
  return <div className="space-y-4"><Button onClick={addQuestion} className="w-full"><Plus className="mr-2 size-4" />Add question</Button>{questions.length ? <Card className="rounded-2xl"><CardContent className="space-y-3 p-4"><div className="flex gap-2 overflow-x-auto">{questions.map((question, index) => <Button key={question.id} size="sm" variant={index === quizIndex ? 'default' : 'outline'} onClick={() => setQuizIndex(index)} className="shrink-0">Q{index + 1}</Button>)}</div>{activeQuestion ? <><Field label="Question"><Textarea rows={4} value={activeQuestion.question} onChange={(event) => updateQuestion(quizIndex, { question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={5} value={(activeQuestion.options || []).join('\n')} onChange={(event) => updateQuestion(quizIndex, { options: arr(event.target.value) })} /></Field><Field label="Answer"><Input value={activeQuestion.answer} onChange={(event) => updateQuestion(quizIndex, { answer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={activeQuestion.explanation || ''} onChange={(event) => updateQuestion(quizIndex, { explanation: event.target.value })} /></Field><Button variant="outline" className="w-full text-destructive" onClick={() => deleteQuestion(quizIndex)}>Delete question</Button></> : null}</CardContent></Card> : <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">No quiz questions yet.</div>}</div>;
}

function PreviewStep({ blueprint, moduleIndex, lessonIndex, setModuleIndex, setLessonIndex, validation, save, saving, editingCourseId }: { blueprint: Blueprint; moduleIndex: number; lessonIndex: number; setModuleIndex: (index: number) => void; setLessonIndex: (index: number) => void; validation: { errors: string[]; warnings: string[] }; save: () => void; saving: boolean; editingCourseId: string | null }) {
  const module = blueprint.modules[moduleIndex] ?? blueprint.modules[0];
  const lesson = module?.lessons[lessonIndex] ?? module?.lessons[0];
  return <div className="space-y-4"><Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Review & save</CardTitle><CardDescription>{editingCourseId ? 'This will PATCH the existing draft like JSON Builder.' : 'This will create a new draft.'}</CardDescription></CardHeader><CardContent className="space-y-3 p-4 pt-0">{validation.errors.map((item) => <p key={item} className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{item}</p>)}{validation.warnings.map((item) => <p key={item} className="rounded-xl border bg-muted/40 p-3 text-sm">{item}</p>)}{!validation.errors.length && !validation.warnings.length ? <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">No issues found.</p> : null}<Button className="w-full" disabled={saving} onClick={save}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{editingCourseId ? 'Update existing draft' : 'Save new draft'}</Button></CardContent></Card>{lesson ? <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Student preview</CardTitle></CardHeader><CardContent className="space-y-3 p-4 pt-0"><div className="grid grid-cols-2 gap-2"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={moduleIndex} onChange={(event) => { setModuleIndex(Number(event.target.value)); setLessonIndex(0); }}>{blueprint.modules.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select><select className="h-10 rounded-md border bg-background px-3 text-sm" value={lessonIndex} onChange={(event) => setLessonIndex(Number(event.target.value))}>{module?.lessons.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></div><LessonPlayer lesson={lessonForPlayer(lesson)} courseTitle={blueprint.course.title} completed={false} completeLabel="Preview complete" /></CardContent></Card> : null}</div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border bg-muted/20 p-2"><p className="font-bold">{value}</p><p className="text-muted-foreground">{label}</p></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function str(value: unknown, fallback = '') { return typeof value === 'string' ? value : value == null ? fallback : String(value); }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function arr(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => str(item).trim()).filter(Boolean) : typeof value === 'string' ? value.split('\n').map((item) => item.trim()).filter(Boolean) : []; }
function cards(value: unknown): LearningCard[] { const record = rec(value); const source = Array.isArray(value) ? value : Array.isArray(record.cards) ? record.cards : Array.isArray(record.blocks) ? record.blocks : value && typeof value === 'object' ? [value] : []; return source.filter((item): item is LearningCard => Boolean(item) && typeof item === 'object' && !Array.isArray(item)); }
function label(value: unknown) { return str(value, 'Card').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function previewText(card: LearningCard) { return str(card.body ?? card.question ?? card.text ?? card.statement ?? card.front ?? card.back ?? card.explanation, 'No content yet.'); }
function moveItem<T>(items: T[], from: number, to: number) { const copy = [...items]; const [item] = copy.splice(from, 1); if (typeof item === 'undefined') return items; copy.splice(to, 0, item); return copy; }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `manual-${Date.now()}`; }

function courseFrom(value: Record<string, unknown>): CourseJson {
  return {
    title: str(value.title, 'Untitled course'),
    description: str(value.description ?? value.summary, 'Describe this course.'),
    schoolId: str(value.schoolId ?? value.school_id),
    level: str(value.level, 'beginner'),
    durationHours: num(value.durationHours ?? value.duration_hours ?? value.totalDurationHours ?? value.duration, 8),
    entryFee: num(value.entryFee ?? value.entry_fee ?? value.price, 0),
    currency: str(value.currency, 'ZMW'),
    certificateFee: num(value.certificateFee ?? value.certificate_fee, 0),
    audience: str(value.audience, 'Learners'),
    prerequisites: arr(value.prerequisites),
    outcomes: arr(value.outcomes),
  };
}

function lessonFrom(value: unknown, index: number): Lesson {
  const record = rec(value);
  const subLessons = Array.isArray(record.subLessons) ? record.subLessons : Array.isArray(record.sub_lessons) ? record.sub_lessons : [];
  return {
    id: str(record.id, uid('lesson')),
    title: str(record.title ?? record.name, `Lesson ${index + 1}`),
    summary: str(record.summary ?? record.description ?? record.content, 'Describe this lesson.'),
    outcomes: arr(record.outcomes),
    cards: cards(record.cards ?? record.blocks ?? record.learningObjects ?? record.learning_cards),
    subLessons: subLessons.map((item, subIndex) => subLessonFrom(item, subIndex)),
  };
}

function subLessonFrom(value: unknown, index: number): SubLesson {
  const record = rec(value);
  return { id: str(record.id, uid('sub')), title: str(record.title ?? record.name, `Sub-lesson ${index + 1}`), summary: str(record.summary ?? record.description, 'Describe this sub-lesson.'), cards: cards(record.cards ?? record.blocks) };
}

function moduleFrom(value: unknown, index: number): Module {
  const record = rec(value);
  const lessonSource = Array.isArray(record.lessons) ? record.lessons : [];
  return {
    id: str(record.id, uid('module')),
    title: str(record.title ?? record.name, `Module ${index + 1}`),
    description: str(record.description ?? record.summary, 'Describe this module.'),
    outcomes: arr(record.outcomes),
    lessons: lessonSource.length ? lessonSource.map(lessonFrom) : [blankLesson(0)],
  };
}

function questionFrom(value: unknown, index: number): Question {
  const record = rec(value);
  const options = arr(record.options);
  return { id: str(record.id, uid('question')), type: str(record.type, 'mcq'), difficulty: str(record.difficulty, 'easy'), question: str(record.question ?? record.prompt, `Question ${index + 1}`), options: options.length ? options : undefined, answer: str(record.answer ?? record.correctAnswer ?? record.correct_answer), explanation: str(record.explanation) };
}

function normalizeBlueprint(raw: unknown, fallback: Blueprint, apiCourse?: Course): Blueprint {
  const record = rec(raw);
  const summary = rec(record.course ?? record.courseSummary ?? record.course_summary);
  const apiSeed = apiCourse ? { title: apiCourse.title, description: apiCourse.description, schoolId: apiCourse.schoolId, level: apiCourse.level, durationHours: apiCourse.durationHours, price: apiCourse.price, currency: apiCourse.currency, certificateFee: apiCourse.certificateFee } : {};
  const sourceModules = Array.isArray(record.modules) ? record.modules : Array.isArray(record.lessons) ? [{ title: 'Imported lessons', lessons: record.lessons }] : fallback.modules;
  const assessments = rec(record.assessments);
  const questionsSource = record.questions ?? assessments.questions ?? assessments.quizzes;
  return ensureBlueprint({ course: courseFrom({ ...fallback.course, ...apiSeed, ...summary }), modules: sourceModules.map(moduleFrom), questions: Array.isArray(questionsSource) ? questionsSource.map(questionFrom) : [] }, fallback);
}

function ensureBlueprint(value: Blueprint, fallback: Blueprint): Blueprint {
  return {
    course: { ...fallback.course, ...value.course },
    modules: value.modules.length ? value.modules.map((module, index) => ({ ...module, lessons: module.lessons.length ? module.lessons.map((lesson, lessonIndex) => ({ ...lesson, cards: lesson.cards.length ? lesson.cards : [blankCard('explanation', 0)] })) : [blankLesson(index)] })) : [blankModule(0)],
    questions: Array.isArray(value.questions) ? value.questions : [],
  };
}

function validate(blueprint: Blueprint) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!blueprint.course.title.trim()) errors.push('Course title is required.');
  if (!blueprint.course.schoolId.trim()) warnings.push('School is not selected.');
  if (!blueprint.modules.length) errors.push('At least one module is required.');
  blueprint.modules.forEach((module, moduleIndex) => {
    if (!module.title.trim()) errors.push(`Module ${moduleIndex + 1} needs a title.`);
    if (!module.lessons.length) errors.push(`Module ${moduleIndex + 1} needs at least one lesson.`);
    module.lessons.forEach((lesson, lessonIndex) => {
      if (!lesson.title.trim()) errors.push(`Module ${moduleIndex + 1}, lesson ${lessonIndex + 1} needs a title.`);
      if (!lesson.cards.length && !lesson.subLessons.some((sub) => sub.cards.length)) warnings.push(`Module ${moduleIndex + 1}, lesson ${lessonIndex + 1} has no cards.`);
    });
  });
  return { errors, warnings };
}

function lessonForPlayer(lesson: Lesson) {
  return { id: lesson.id, courseId: 'manual-builder-preview', title: lesson.title, summary: lesson.summary, content: JSON.stringify({ blocks: lesson.cards, subLessons: lesson.subLessons }), estimatedMinutes: Math.max(5, Math.ceil((lesson.cards.length + lesson.subLessons.reduce((sum, sub) => sum + sub.cards.length, 0)) * 1.2)), difficulty: 'builder-preview' } as never;
}

function flattenLessons(blueprint: Blueprint) {
  return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, content: JSON.stringify({ blocks: lesson.cards, subLessons: lesson.subLessons }), moduleTitle: module.title, moduleIndex, lessonIndex, sortOrder: moduleIndex * 100 + lessonIndex, blocks: lesson.cards })));
}

function toDraftPayload(blueprint: Blueprint, status: SaveStatus, editingCourseId: string | null) {
  const course = blueprint.course;
  const courseId = editingCourseId || `manual-${slugify(course.title)}-${Date.now()}`;
  return {
    sourceMode: 'new',
    course: {
      id: courseId,
      title: course.title,
      description: course.description,
      schoolId: course.schoolId,
      imageId: 'short-course-manual',
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
      courseSummary: { title: course.title, audience: course.audience, level: course.level, description: course.description, prerequisites: course.prerequisites, totalDurationHours: course.durationHours, outcomes: course.outcomes, finalAssessment: 'Complete all assessments.', certificateCriteria: 'Complete the learning path.' },
      assessments: { quizzes: blueprint.questions.map((question) => question.question), practicalWork: [], instructorReviewChecklist: [] },
      modules: blueprint.modules.map((module) => ({ id: module.id, title: module.title, description: module.description, durationMinutes: 60, outcomes: module.outcomes, moduleAssessment: 'Complete all lessons.', lessons: module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, summary: lesson.summary, durationMinutes: 30, outcomes: lesson.outcomes, activities: [], assessment: 'Complete practice checks.', blocks: lesson.cards, subLessons: lesson.subLessons.map((sub) => ({ id: sub.id, title: sub.title, summary: sub.summary, durationMinutes: 20, outcomes: [], blocks: sub.cards, activities: [], assessment: 'Complete sub-lesson.' })) })) })),
    },
  };
}
