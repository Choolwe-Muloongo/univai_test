'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Copy, Edit3, Eye, Layers3, ListChecks, Loader2, Plus, Save, Sparkles, Trash2, Wand2, X } from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { getCourseById, getCourses, getLessonsByCourse, getSchools } from '@/lib/api';
import { saveShortCourseDraftWithBlueprint } from '@/lib/api/safe-short-course-save';
import type { Course, Lesson, School } from '@/lib/api/types';

type BuilderStep = 'course' | 'structure' | 'cards' | 'quiz' | 'preview';
type CardType = 'teach' | 'example' | 'question' | 'summary' | 'flashcard' | 'practice_task' | 'case_study' | 'fill_blank' | 'true_false';
type QuizType = 'mcq' | 'short_answer' | 'true_false' | 'fill_blank';

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

type ManualCard = {
  id: string;
  type: CardType;
  title: string;
  body: string;
  question?: string;
  text?: string;
  statement?: string;
  prompt?: string;
  front?: string;
  back?: string;
  options?: string;
  answer?: string;
  explanation?: string;
  items?: string;
  criteria?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  mathTool?: string;
  equation?: string;
  expression?: string;
  saved: boolean;
};

type ManualLesson = {
  id: string;
  title: string;
  summary: string;
  outcomes: string[];
  cards: ManualCard[];
  saved: boolean;
};

type ManualModule = {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  lessons: ManualLesson[];
  saved: boolean;
};

type QuizQuestion = {
  id: string;
  type: QuizType;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSeconds: string;
  question: string;
  options: string;
  answer: string;
  explanation: string;
};

const AUTOSAVE_KEY = 'univai.mobile-manual-builder.autosave.v1';
const LEGACY_AUTOSAVE_KEY = 'univai.manual-builder.autosave.v2';

const steps: Array<{ id: BuilderStep; label: string; icon: typeof BookOpen }> = [
  { id: 'course', label: 'Course', icon: BookOpen },
  { id: 'structure', label: 'Structure', icon: Layers3 },
  { id: 'cards', label: 'Cards', icon: Edit3 },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'preview', label: 'Preview', icon: Eye },
];

const cardTypes: Array<{ value: CardType; label: string; help: string }> = [
  { value: 'teach', label: 'Teach', help: 'Explain one idea clearly.' },
  { value: 'example', label: 'Example', help: 'Show one worked example.' },
  { value: 'question', label: 'Question', help: 'Multiple choice checkpoint.' },
  { value: 'summary', label: 'Summary', help: 'Key takeaways.' },
  { value: 'flashcard', label: 'Flashcard', help: 'Front and back recall card.' },
  { value: 'practice_task', label: 'Practice', help: 'Task with success criteria.' },
  { value: 'case_study', label: 'Case', help: 'Applied scenario.' },
  { value: 'fill_blank', label: 'Fill blank', help: 'Fill-in-the-blank question.' },
  { value: 'true_false', label: 'True/False', help: 'Fast judgment question.' },
];

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const lines = (value?: string) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`;

function initialForm(schoolId = ''): CourseForm {
  return {
    title: '',
    description: '',
    schoolId,
    level: 'beginner',
    durationHours: '8',
    entryFee: '0',
    currency: 'ZMW',
    certificateFee: '0',
  };
}

function makeCard(type: CardType = 'teach', index = 1): ManualCard {
  const base = {
    id: uid('card'),
    type,
    title: `${cardLabel(type)} ${index}`,
    body: '',
    mathTool: 'none',
    saved: false,
  } satisfies ManualCard;

  if (type === 'teach') return { ...base, title: `Teaching card ${index}`, body: 'Explain one idea clearly.' };
  if (type === 'example') return { ...base, title: `Example ${index}`, body: 'Show one practical example step by step.' };
  if (type === 'summary') return { ...base, title: `Summary ${index}`, body: 'Summarize the key takeaways.' };
  if (type === 'flashcard') return { ...base, title: `Flashcard ${index}`, front: 'Term or prompt', back: 'Answer or explanation' };
  if (type === 'practice_task') return { ...base, title: `Practice task ${index}`, prompt: 'Describe the task learners should complete.', criteria: 'Clear attempt\nUses the lesson idea\nChecks the answer' };
  if (type === 'case_study') return { ...base, title: `Case study ${index}`, body: 'Describe the scenario.', prompt: 'What should the learner decide, and why?' };
  if (type === 'fill_blank') return { ...base, title: `Fill blank ${index}`, text: 'Complete this: ____', answer: 'answer', explanation: 'Explain the missing answer.' };
  if (type === 'true_false') return { ...base, title: `True or false ${index}`, statement: 'Write a statement learners should judge.', answer: 'true', explanation: 'Explain why.' };
  return { ...base, title: `Question ${index}`, question: 'Write your question here.', options: 'Option A\nOption B\nOption C\nOption D', answer: 'Option A', explanation: 'Explain why this answer is correct.' };
}

function makeLesson(index: number): ManualLesson {
  return {
    id: uid('lesson'),
    title: `Lesson ${index}`,
    summary: 'Describe what this lesson teaches.',
    outcomes: ['Understand the key idea.'],
    cards: [makeCard('teach', 1), makeCard('example', 2), makeCard('question', 3), makeCard('summary', 4)],
    saved: false,
  };
}

function makeModule(index: number): ManualModule {
  return {
    id: uid('module'),
    title: `Module ${index}`,
    description: 'Describe what this module covers.',
    outcomes: ['Complete this module successfully.'],
    lessons: [makeLesson(1)],
    saved: false,
  };
}

function makeQuiz(index = 1): QuizQuestion {
  return {
    id: uid('quiz'),
    type: 'mcq',
    difficulty: 'easy',
    timeSeconds: '60',
    question: `Question ${index}`,
    options: 'Option A\nOption B\nOption C\nOption D',
    answer: 'Option A',
    explanation: 'Explain the answer.',
  };
}

export function MobileFirstManualCourseBuilderClient() {
  const [step, setStep] = useState<BuilderStep>('course');
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(initialForm());
  const [modules, setModules] = useState<ManualModule[]>([makeModule(1)]);
  const [quizBank, setQuizBank] = useState<QuizQuestion[]>([makeQuiz(1)]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [editingCard, setEditingCard] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [quickComposeOpen, setQuickComposeOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Ready');

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        setSelectedCourseId(courseData[0]?.id || '');
        setForm((current) => ({ ...current, schoolId: current.schoolId || schoolData[0]?.id || '' }));
        restoreDraft(schoolData[0]?.id || '');
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load manual builder data.'))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ form, modules, quizBank, editingCourseId }));
        setSaveStatus('Saved locally');
      } catch {
        setSaveStatus('Local save failed');
      }
    }, 500);
    setSaveStatus('Saving locally...');
    return () => window.clearTimeout(handle);
  }, [form, modules, quizBank, editingCourseId]);

  const activeModule = modules[moduleIndex] ?? modules[0];
  const lessons = activeModule?.lessons ?? [];
  const activeLesson = lessons[lessonIndex] ?? lessons[0];
  const activeCards = activeLesson?.cards ?? [];
  const activeCard = activeCards[cardIndex] ?? activeCards[0];
  const activeQuiz = quizBank[quizIndex] ?? quizBank[0];

  const stats = useMemo(() => {
    const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
    const cardCount = modules.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.cards.length, 0), 0);
    return { lessonCount, cardCount, moduleCount: modules.length, quizCount: quizBank.length };
  }, [modules, quizBank.length]);

  const filteredCourses = useMemo(() => {
    const needle = courseSearch.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) => `${course.title || ''} ${course.id || ''} ${course.description || ''}`.toLowerCase().includes(needle));
  }, [courses, courseSearch]);

  function restoreDraft(defaultSchoolId: string) {
    try {
      const mobile = window.localStorage.getItem(AUTOSAVE_KEY);
      const legacy = window.localStorage.getItem(LEGACY_AUTOSAVE_KEY);
      const saved = mobile || legacy;
      if (!saved) return;
      const parsed = JSON.parse(saved) as any;
      if (!parsed?.form || !Array.isArray(parsed.modules)) return;
      setForm({ ...initialForm(defaultSchoolId), ...parsed.form });
      setModules(parsed.modules.length ? normalizeModules(parsed.modules) : [makeModule(1)]);
      setQuizBank(Array.isArray(parsed.quizBank) && parsed.quizBank.length ? parsed.quizBank : [makeQuiz(1)]);
      setEditingCourseId(typeof parsed.editingCourseId === 'string' ? parsed.editingCourseId : null);
      setMessage('Recovered saved builder work. Continue editing or start a new course.');
    } catch {
      // Bad local drafts must not block the builder.
    }
  }

  function startNewCourse() {
    const defaultSchoolId = schools[0]?.id || '';
    setForm(initialForm(defaultSchoolId));
    setModules([makeModule(1)]);
    setQuizBank([makeQuiz(1)]);
    setEditingCourseId(null);
    setModuleIndex(0);
    setLessonIndex(0);
    setCardIndex(0);
    setQuizIndex(0);
    setStep('course');
    setEditingCard(false);
    setMessage('Started a new course.');
    try {
      window.localStorage.removeItem(AUTOSAVE_KEY);
      window.localStorage.removeItem(LEGACY_AUTOSAVE_KEY);
    } catch {
      // ignore
    }
  }

  async function loadExistingCourse(courseId = selectedCourseId) {
    if (!courseId) {
      setError('Choose a course to edit.');
      return;
    }
    setLoadingCourse(true);
    setError(null);
    setMessage(null);
    try {
      const [course, lessonsData] = await Promise.all([
        getCourseById(courseId),
        getLessonsByCourse(courseId).catch(() => []),
      ]);
      if (!course) {
        setError('That course could not be loaded.');
        return;
      }
      setEditingCourseId(courseId);
      setForm(formFromCourse(course, schools[0]?.id || ''));
      setModules(modulesFromLessons(lessonsData));
      setQuizBank(quizFromLessons(lessonsData));
      setModuleIndex(0);
      setLessonIndex(0);
      setCardIndex(0);
      setQuizIndex(0);
      setStep('structure');
      setShowExisting(false);
      setMessage(`Loaded ${course.title || 'course'} for editing.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load this course.');
    } finally {
      setLoadingCourse(false);
    }
  }

  function updateModule(index: number, patch: Partial<ManualModule>) {
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === index ? { ...module, ...patch, saved: false } : module));
  }

  function addModule() {
    setModules((current) => [...current, makeModule(current.length + 1)]);
    setModuleIndex(modules.length);
    setLessonIndex(0);
    setCardIndex(0);
  }

  function removeModule(index: number) {
    if (modules.length <= 1) {
      setError('A course needs at least one module.');
      return;
    }
    setModules((current) => current.filter((_, moduleIdx) => moduleIdx !== index));
    setModuleIndex((current) => Math.max(0, Math.min(current, modules.length - 2)));
    setLessonIndex(0);
    setCardIndex(0);
  }

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    setModules((current) => moveItem(current, index, target));
    setModuleIndex(target);
  }

  function updateLesson(index: number, patch: Partial<ManualLesson>) {
    setModules((current) => current.map((module, moduleIdx) => {
      if (moduleIdx !== moduleIndex) return module;
      return {
        ...module,
        saved: false,
        lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === index ? { ...lesson, ...patch, saved: false } : lesson),
      };
    }));
  }

  function addLesson() {
    const next = makeLesson(lessons.length + 1);
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? { ...module, saved: false, lessons: [...module.lessons, next] } : module));
    setLessonIndex(lessons.length);
    setCardIndex(0);
    setStep('cards');
  }

  function duplicateLesson(index: number) {
    const lesson = lessons[index];
    if (!lesson) return;
    const copy = {
      ...structuredClone(lesson),
      id: uid('lesson'),
      title: `${lesson.title || 'Lesson'} copy`,
      cards: lesson.cards.map((card) => ({ ...card, id: uid('card'), saved: false })),
      saved: false,
    };
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? { ...module, saved: false, lessons: insertAt(module.lessons, index + 1, copy) } : module));
    setLessonIndex(index + 1);
  }

  function removeLesson(index: number) {
    if (lessons.length <= 1) {
      setError('A module needs at least one lesson.');
      return;
    }
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? { ...module, saved: false, lessons: module.lessons.filter((_, lessonIdx) => lessonIdx !== index) } : module));
    setLessonIndex((current) => Math.max(0, Math.min(current, lessons.length - 2)));
    setCardIndex(0);
  }

  function moveLesson(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? { ...module, saved: false, lessons: moveItem(module.lessons, index, target) } : module));
    setLessonIndex(target);
  }

  function moveLessonToModule(index: number, targetModuleIndex: number) {
    if (targetModuleIndex === moduleIndex) return;
    const lesson = lessons[index];
    if (!lesson) return;
    if (lessons.length <= 1) {
      setError('A module needs at least one lesson.');
      return;
    }
    setModules((current) => current.map((module, moduleIdx) => {
      if (moduleIdx === moduleIndex) return { ...module, saved: false, lessons: module.lessons.filter((_, lessonIdx) => lessonIdx !== index) };
      if (moduleIdx === targetModuleIndex) return { ...module, saved: false, lessons: [...module.lessons, { ...lesson, saved: false }] };
      return module;
    }));
    setModuleIndex(targetModuleIndex);
    setLessonIndex(modules[targetModuleIndex]?.lessons.length ?? 0);
    setCardIndex(0);
  }

  function updateCard(index: number, patch: Partial<ManualCard>) {
    setModules((current) => current.map((module, moduleIdx) => {
      if (moduleIdx !== moduleIndex) return module;
      return {
        ...module,
        saved: false,
        lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? {
          ...lesson,
          saved: false,
          cards: lesson.cards.map((card, cardIdx) => cardIdx === index ? { ...card, ...patch, saved: false } : card),
        } : lesson),
      };
    }));
  }

  function addCard(type: CardType) {
    const card = makeCard(type, activeCards.length + 1);
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
      ...module,
      saved: false,
      lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, saved: false, cards: [...lesson.cards, card] } : lesson),
    } : module));
    setCardIndex(activeCards.length);
    setAddCardOpen(false);
    setEditingCard(true);
  }

  function duplicateCard(index: number) {
    const card = activeCards[index];
    if (!card) return;
    const copy = { ...card, id: uid('card'), title: `${card.title || 'Card'} copy`, saved: false };
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
      ...module,
      saved: false,
      lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, saved: false, cards: insertAt(lesson.cards, index + 1, copy) } : lesson),
    } : module));
    setCardIndex(index + 1);
  }

  function removeCard(index: number) {
    if (activeCards.length <= 1) {
      setError('A lesson needs at least one card.');
      return;
    }
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
      ...module,
      saved: false,
      lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, saved: false, cards: lesson.cards.filter((_, cardIdx) => cardIdx !== index) } : lesson),
    } : module));
    setCardIndex((current) => Math.max(0, Math.min(current, activeCards.length - 2)));
  }

  function moveCard(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activeCards.length) return;
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
      ...module,
      saved: false,
      lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, saved: false, cards: moveItem(lesson.cards, index, target) } : lesson),
    } : module));
    setCardIndex(target);
  }

  function runQuickCompose() {
    const cards = cardsFromQuickPrompt(quickPrompt, activeCards.length + 1);
    if (!cards.length) return;
    setModules((current) => current.map((module, moduleIdx) => moduleIdx === moduleIndex ? {
      ...module,
      saved: false,
      lessons: module.lessons.map((lesson, lessonIdx) => lessonIdx === lessonIndex ? { ...lesson, saved: false, cards: [...lesson.cards, ...cards] } : lesson),
    } : module));
    setCardIndex(activeCards.length);
    setQuickPrompt('');
    setQuickComposeOpen(false);
    setMessage(`Added ${cards.length} card${cards.length === 1 ? '' : 's'}.`);
  }

  function updateQuiz(index: number, patch: Partial<QuizQuestion>) {
    setQuizBank((current) => current.map((quiz, quizIdx) => quizIdx === index ? { ...quiz, ...patch } : quiz));
  }

  function addQuiz() {
    setQuizBank((current) => [...current, makeQuiz(current.length + 1)]);
    setQuizIndex(quizBank.length);
  }

  function removeQuiz(index: number) {
    if (quizBank.length <= 1) return;
    setQuizBank((current) => current.filter((_, quizIdx) => quizIdx !== index));
    setQuizIndex((current) => Math.max(0, Math.min(current, quizBank.length - 2)));
  }

  async function saveDraft() {
    const validation = validateCourse(form, modules);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const blueprint = buildBlueprint(form, modules, quizBank);
      const saved = await saveShortCourseDraftWithBlueprint({
        course: {
          id: editingCourseId || slugify(form.title),
          title: form.title,
          description: form.description || blueprint.courseSummary.description,
          schoolId: form.schoolId,
          imageId: 'short-course',
          pricingType: toMoney(form.entryFee) > 0 ? 'paid' : 'free',
          price: toMoney(form.entryFee),
          currency: form.currency || 'ZMW',
          certificateFee: toMoney(form.certificateFee),
          certificateCurrency: form.currency || 'ZMW',
          durationHours: toPositiveInt(form.durationHours, 1),
          level: form.level,
          status: 'draft',
          modules: blueprint.modules.map((module: any) => ({ title: module.title, description: module.description })),
          lessons: flattenLessons(blueprint),
          outcomes: blueprint.courseSummary.outcomes,
        } as any,
        blueprint: blueprint as any,
        sourceMode: 'new',
        programmeTitle: null,
        programmeCourseTitle: null,
      });
      setEditingCourseId(saved.id);
      setCourses(await getCourses());
      setStep('preview');
      setMessage('Draft saved. You can keep editing or review/publish it from the admin flow.');
      try {
        window.localStorage.removeItem(LEGACY_AUTOSAVE_KEY);
      } catch {
        // ignore
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading mobile manual builder..." />;
  if (editingCard && activeCard) {
    return (
      <CardEditorScreen
        card={activeCard}
        index={cardIndex}
        total={activeCards.length}
        lessonTitle={activeLesson?.title || 'Lesson'}
        updateCard={(patch) => updateCard(cardIndex, patch)}
        previous={() => setCardIndex((current) => Math.max(0, current - 1))}
        next={() => setCardIndex((current) => Math.min(activeCards.length - 1, current + 1))}
        close={() => setEditingCard(false)}
        previewLesson={lessonPreview(activeLesson, form)}
        courseTitle={form.title || 'Short course'}
      />
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <MobileHeader
        title={form.title || 'Untitled course'}
        editingCourseId={editingCourseId}
        saveStatus={saveStatus}
        saving={saving}
        saveDraft={saveDraft}
        startNewCourse={startNewCourse}
        showExisting={() => setShowExisting((value) => !value)}
      />

      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border bg-muted/40 p-3 text-sm">{message}</div> : null}

      {showExisting ? (
        <ExistingCoursePanel
          courses={filteredCourses}
          courseSearch={courseSearch}
          setCourseSearch={setCourseSearch}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          loadExistingCourse={loadExistingCourse}
          loadingCourse={loadingCourse}
        />
      ) : null}

      <StatsStrip stats={stats} />
      <StepTabs step={step} setStep={setStep} />

      {step === 'course' ? (
        <CourseStep form={form} setForm={setForm} schools={schools} next={() => setStep('structure')} />
      ) : null}

      {step === 'structure' ? (
        <StructureStep
          modules={modules}
          moduleIndex={moduleIndex}
          setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); setCardIndex(0); }}
          lessonIndex={lessonIndex}
          setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }}
          updateModule={updateModule}
          addModule={addModule}
          removeModule={removeModule}
          moveModule={moveModule}
          updateLesson={updateLesson}
          addLesson={addLesson}
          duplicateLesson={duplicateLesson}
          removeLesson={removeLesson}
          moveLesson={moveLesson}
          moveLessonToModule={moveLessonToModule}
          goCards={() => setStep('cards')}
        />
      ) : null}

      {step === 'cards' ? (
        <CardsStep
          modules={modules}
          moduleIndex={moduleIndex}
          setModuleIndex={(index) => { setModuleIndex(index); setLessonIndex(0); setCardIndex(0); }}
          lessons={lessons}
          lessonIndex={lessonIndex}
          setLessonIndex={(index) => { setLessonIndex(index); setCardIndex(0); }}
          activeLesson={activeLesson}
          activeCards={activeCards}
          cardIndex={cardIndex}
          setCardIndex={setCardIndex}
          openCard={() => setEditingCard(true)}
          addCard={() => setAddCardOpen(true)}
          quickCompose={() => setQuickComposeOpen(true)}
          duplicateCard={duplicateCard}
          removeCard={removeCard}
          moveCard={moveCard}
        />
      ) : null}

      {step === 'quiz' ? (
        <QuizStep quizBank={quizBank} quizIndex={quizIndex} setQuizIndex={setQuizIndex} activeQuiz={activeQuiz} updateQuiz={updateQuiz} addQuiz={addQuiz} removeQuiz={removeQuiz} />
      ) : null}

      {step === 'preview' ? (
        <PreviewStep form={form} modules={modules} quizBank={quizBank} activeLesson={activeLesson} saveDraft={saveDraft} saving={saving} editingCourseId={editingCourseId} />
      ) : null}

      {addCardOpen ? <AddCardSheet close={() => setAddCardOpen(false)} addCard={addCard} /> : null}
      {quickComposeOpen ? <QuickComposeSheet value={quickPrompt} setValue={setQuickPrompt} run={runQuickCompose} close={() => setQuickComposeOpen(false)} /> : null}
    </div>
  );
}

function MobileHeader({ title, editingCourseId, saveStatus, saving, saveDraft, startNewCourse, showExisting }: { title: string; editingCourseId: string | null; saveStatus: string; saving: boolean; saveDraft: () => void; startNewCourse: () => void; showExisting: () => void }) {
  return (
    <Card className="sticky top-0 z-40 rounded-2xl border-primary/20 bg-background/95 shadow-sm backdrop-blur">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-primary">Manual builder</p>
            <h2 className="truncate text-lg font-bold">{title}</h2>
            <p className="text-xs text-muted-foreground">{editingCourseId ? 'Editing existing draft' : 'Creating new course'} • {saveStatus}</p>
          </div>
          <Button type="button" size="sm" onClick={saveDraft} disabled={saving} className="shrink-0">
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={showExisting}><Edit3 className="mr-2 size-4" />Edit existing</Button>
          <Button type="button" variant="outline" onClick={startNewCourse}><Plus className="mr-2 size-4" />New course</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExistingCoursePanel(props: { courses: Course[]; courseSearch: string; setCourseSearch: (value: string) => void; selectedCourseId: string; setSelectedCourseId: (value: string) => void; loadExistingCourse: () => void; loadingCourse: boolean }) {
  const { courses, courseSearch, setCourseSearch, selectedCourseId, setSelectedCourseId, loadExistingCourse, loadingCourse } = props;
  return (
    <Card className="rounded-2xl border-primary/20 bg-primary/5">
      <CardHeader className="p-4"><CardTitle>Edit existing course</CardTitle><CardDescription>Load a saved course into this same phone-first builder.</CardDescription></CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <Input value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder="Search courses..." />
        <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
          {courses.length ? courses.map((course) => <option key={course.id} value={course.id}>{course.title || course.id}</option>) : <option value="">No courses found</option>}
        </select>
        <Button type="button" className="w-full" disabled={!selectedCourseId || loadingCourse} onClick={loadExistingCourse}>
          {loadingCourse ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Edit3 className="mr-2 size-4" />}
          {loadingCourse ? 'Loading course...' : 'Load into builder'}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatsStrip({ stats }: { stats: { moduleCount: number; lessonCount: number; cardCount: number; quizCount: number } }) {
  return <div className="grid grid-cols-4 gap-2 text-center text-xs">{[
    ['Modules', stats.moduleCount], ['Lessons', stats.lessonCount], ['Cards', stats.cardCount], ['Quiz', stats.quizCount],
  ].map(([label, value]) => <div key={label} className="rounded-2xl border bg-muted/20 p-2"><p className="font-bold">{value}</p><p className="text-muted-foreground">{label}</p></div>)}</div>;
}

function StepTabs({ step, setStep }: { step: BuilderStep; setStep: (step: BuilderStep) => void }) {
  return (
    <div className="sticky top-[6.75rem] z-30 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border bg-background/95 p-2 backdrop-blur">
      {steps.map((item) => {
        const Icon = item.icon;
        return <Button key={item.id} type="button" size="sm" variant={step === item.id ? 'default' : 'outline'} onClick={() => setStep(item.id)} className="shrink-0"><Icon className="mr-2 size-4" />{item.label}</Button>;
      })}
    </div>
  );
}

function CourseStep({ form, setForm, schools, next }: { form: CourseForm; setForm: (updater: CourseForm | ((current: CourseForm) => CourseForm)) => void; schools: School[]; next: () => void }) {
  const patch = (value: Partial<CourseForm>) => setForm((current) => ({ ...current, ...value }));
  return (
    <Card className="rounded-2xl">
      <CardHeader className="p-4"><CardTitle>Course details</CardTitle><CardDescription>Only the essentials. Everything else lives in Structure, Cards, and Quiz.</CardDescription></CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <Field label="Course title"><Input value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="e.g. Introduction to Business Accounting" /></Field>
        <Field label="Description"><Textarea rows={5} value={form.description} onChange={(event) => patch({ description: event.target.value })} /></Field>
        <Field label="School / Faculty"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => patch({ schoolId: event.target.value })}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name || school.title || school.id}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level"><Input value={form.level} onChange={(event) => patch({ level: event.target.value })} /></Field>
          <Field label="Hours"><Input value={form.durationHours} onChange={(event) => patch({ durationHours: event.target.value })} inputMode="numeric" /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Entry fee"><Input value={form.entryFee} onChange={(event) => patch({ entryFee: event.target.value })} inputMode="decimal" /></Field>
          <Field label="Cert fee"><Input value={form.certificateFee} onChange={(event) => patch({ certificateFee: event.target.value })} inputMode="decimal" /></Field>
          <Field label="Currency"><Input value={form.currency} onChange={(event) => patch({ currency: event.target.value.toUpperCase().slice(0, 3) })} /></Field>
        </div>
        <Button type="button" className="w-full" onClick={next}>Next: Structure</Button>
      </CardContent>
    </Card>
  );
}

function StructureStep(props: { modules: ManualModule[]; moduleIndex: number; setModuleIndex: (index: number) => void; lessonIndex: number; setLessonIndex: (index: number) => void; updateModule: (index: number, patch: Partial<ManualModule>) => void; addModule: () => void; removeModule: (index: number) => void; moveModule: (index: number, direction: -1 | 1) => void; updateLesson: (index: number, patch: Partial<ManualLesson>) => void; addLesson: () => void; duplicateLesson: (index: number) => void; removeLesson: (index: number) => void; moveLesson: (index: number, direction: -1 | 1) => void; moveLessonToModule: (index: number, targetModuleIndex: number) => void; goCards: () => void }) {
  const { modules, moduleIndex, setModuleIndex, lessonIndex, setLessonIndex, updateModule, addModule, removeModule, moveModule, updateLesson, addLesson, duplicateLesson, removeLesson, moveLesson, moveLessonToModule, goCards } = props;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={addModule}><Plus className="mr-2 size-4" />Add module</Button><Button type="button" variant="outline" onClick={addLesson}><Plus className="mr-2 size-4" />Add lesson</Button></div>
      {modules.map((module, modIdx) => (
        <Card key={module.id} className={`rounded-2xl ${modIdx === moduleIndex ? 'border-primary/50 bg-primary/5' : ''}`}>
          <CardHeader className="p-4">
            <button type="button" className="text-left" onClick={() => setModuleIndex(modIdx)}><CardTitle>{module.title || `Module ${modIdx + 1}`}</CardTitle><CardDescription>{module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}</CardDescription></button>
          </CardHeader>
          {modIdx === moduleIndex ? <CardContent className="space-y-3 p-4 pt-0">
            <Field label="Module title"><Input value={module.title} onChange={(event) => updateModule(modIdx, { title: event.target.value })} /></Field>
            <Field label="Module description"><Textarea rows={3} value={module.description} onChange={(event) => updateModule(modIdx, { description: event.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-2"><Button type="button" size="sm" variant="outline" disabled={modIdx === 0} onClick={() => moveModule(modIdx, -1)}>Up</Button><Button type="button" size="sm" variant="outline" disabled={modIdx === modules.length - 1} onClick={() => moveModule(modIdx, 1)}>Down</Button><Button type="button" size="sm" variant="outline" disabled={modules.length <= 1} onClick={() => removeModule(modIdx)} className="text-destructive">Delete</Button></div>
            <div className="space-y-2">
              {module.lessons.map((lesson, lesIdx) => (
                <div key={lesson.id} className={`rounded-xl border bg-background p-3 ${lesIdx === lessonIndex ? 'border-primary/50' : ''}`}>
                  <button type="button" className="w-full text-left" onClick={() => setLessonIndex(lesIdx)}><p className="font-semibold">{lesson.title || `Lesson ${lesIdx + 1}`}</p><p className="text-xs text-muted-foreground">{lesson.cards.length} cards • {lesson.outcomes.length} outcomes</p></button>
                  {lesIdx === lessonIndex ? <div className="mt-3 space-y-3">
                    <Field label="Lesson title"><Input value={lesson.title} onChange={(event) => updateLesson(lesIdx, { title: event.target.value })} /></Field>
                    <Field label="Summary"><Textarea rows={3} value={lesson.summary} onChange={(event) => updateLesson(lesIdx, { summary: event.target.value })} /></Field>
                    <Field label="Outcomes, one per line"><Textarea rows={3} value={lesson.outcomes.join('\n')} onChange={(event) => updateLesson(lesIdx, { outcomes: lines(event.target.value) })} /></Field>
                    <div className="grid grid-cols-2 gap-2"><Button type="button" size="sm" variant="outline" disabled={lesIdx === 0} onClick={() => moveLesson(lesIdx, -1)}>Move up</Button><Button type="button" size="sm" variant="outline" disabled={lesIdx === module.lessons.length - 1} onClick={() => moveLesson(lesIdx, 1)}>Move down</Button><Button type="button" size="sm" variant="outline" onClick={() => duplicateLesson(lesIdx)}><Copy className="mr-1 size-3" />Copy</Button><Button type="button" size="sm" variant="outline" disabled={module.lessons.length <= 1} onClick={() => removeLesson(lesIdx)} className="text-destructive"><Trash2 className="mr-1 size-3" />Delete</Button></div>
                    <Field label="Move to module"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={modIdx} onChange={(event) => moveLessonToModule(lesIdx, Number(event.target.value))}>{modules.map((target, targetIdx) => <option key={target.id} value={targetIdx} disabled={targetIdx === modIdx}>{target.title || `Module ${targetIdx + 1}`}</option>)}</select></Field>
                    <Button type="button" className="w-full" onClick={goCards}>Edit cards in this lesson</Button>
                  </div> : null}
                </div>
              ))}
            </div>
          </CardContent> : null}
        </Card>
      ))}
    </div>
  );
}

function CardsStep(props: { modules: ManualModule[]; moduleIndex: number; setModuleIndex: (index: number) => void; lessons: ManualLesson[]; lessonIndex: number; setLessonIndex: (index: number) => void; activeLesson: ManualLesson; activeCards: ManualCard[]; cardIndex: number; setCardIndex: (index: number) => void; openCard: () => void; addCard: () => void; quickCompose: () => void; duplicateCard: (index: number) => void; removeCard: (index: number) => void; moveCard: (index: number, direction: -1 | 1) => void }) {
  const { modules, moduleIndex, setModuleIndex, lessons, lessonIndex, setLessonIndex, activeLesson, activeCards, cardIndex, setCardIndex, openCard, addCard, quickCompose, duplicateCard, removeCard, moveCard } = props;
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="space-y-3 p-4">
        <Field label="Module"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={moduleIndex} onChange={(event) => setModuleIndex(Number(event.target.value))}>{modules.map((module, index) => <option key={module.id} value={index}>{module.title || `Module ${index + 1}`}</option>)}</select></Field>
        <Field label="Lesson"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={lessonIndex} onChange={(event) => setLessonIndex(Number(event.target.value))}>{lessons.map((lesson, index) => <option key={lesson.id} value={index}>{lesson.title || `Lesson ${index + 1}`}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={addCard}><Plus className="mr-2 size-4" />Add card</Button><Button type="button" variant="outline" onClick={quickCompose}><Wand2 className="mr-2 size-4" />Quick compose</Button></div>
      </CardContent></Card>
      <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>{activeLesson?.title || 'Lesson cards'}</CardTitle><CardDescription>Tap a card to edit. Use arrows for quick ordering.</CardDescription></CardHeader><CardContent className="space-y-2 p-4 pt-0">
        {activeCards.map((card, index) => <div key={card.id} className={`rounded-xl border p-3 ${index === cardIndex ? 'border-primary bg-primary/5' : 'bg-background'}`}>
          <button type="button" className="w-full text-left" onClick={() => { setCardIndex(index); openCard(); }}><div className="flex items-start gap-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{card.title || `Card ${index + 1}`}</p><p className="text-xs capitalize text-muted-foreground">{cardLabel(card.type)} • {cardPreview(card).slice(0, 90)}</p></div></div></button>
          <div className="mt-3 grid grid-cols-4 gap-2"><Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => moveCard(index, -1)}>Up</Button><Button type="button" size="sm" variant="outline" disabled={index === activeCards.length - 1} onClick={() => moveCard(index, 1)}>Down</Button><Button type="button" size="sm" variant="outline" onClick={() => duplicateCard(index)}>Copy</Button><Button type="button" size="sm" variant="outline" disabled={activeCards.length <= 1} onClick={() => removeCard(index)} className="text-destructive">Del</Button></div>
        </div>)}
      </CardContent></Card>
    </div>
  );
}

function CardEditorScreen(props: { card: ManualCard; index: number; total: number; lessonTitle: string; updateCard: (patch: Partial<ManualCard>) => void; previous: () => void; next: () => void; close: () => void; previewLesson: any; courseTitle: string }) {
  const { card, index, total, lessonTitle, updateCard, previous, next, close, previewLesson, courseTitle } = props;
  const [preview, setPreview] = useState(false);
  if (preview) return <div className="space-y-3 pb-24"><div className="sticky top-0 z-40 flex items-center justify-between rounded-2xl border bg-background/95 p-3 backdrop-blur"><div><p className="text-xs text-muted-foreground">Student preview</p><p className="font-semibold">{lessonTitle}</p></div><Button type="button" variant="outline" size="sm" onClick={() => setPreview(false)}><X className="mr-2 size-4" />Close</Button></div><LessonPlayer lesson={previewLesson} courseTitle={courseTitle} onComplete={() => undefined} completeLabel="Preview complete" /></div>;
  return (
    <div className="space-y-4 pb-24">
      <Card className="sticky top-0 z-40 rounded-2xl border-primary/20 bg-background/95 backdrop-blur"><CardContent className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">{lessonTitle}</p><h2 className="truncate text-lg font-bold">Card {index + 1} of {total}</h2></div><Button type="button" variant="outline" size="sm" onClick={close}><X className="mr-2 size-4" />Done</Button></CardContent></Card>
      <Card className="rounded-2xl"><CardContent className="space-y-4 p-4">
        <Field label="Card type"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={card.type} onChange={(event) => updateCard({ type: event.target.value as CardType })}>{cardTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field>
        <Field label="Title"><Input value={card.title} onChange={(event) => updateCard({ title: event.target.value })} /></Field>
        <CardTypeFields card={card} updateCard={updateCard} />
        <details className="rounded-xl border p-3"><summary className="cursor-pointer font-semibold">Advanced fields</summary><div className="mt-3 space-y-3"><Field label="Image URL"><Input value={card.imageUrl || ''} onChange={(event) => updateCard({ imageUrl: event.target.value })} /></Field><Field label="Image caption"><Input value={card.imageCaption || ''} onChange={(event) => updateCard({ imageCaption: event.target.value })} /></Field><Field label="Math tool"><Input value={card.mathTool || 'none'} onChange={(event) => updateCard({ mathTool: event.target.value })} /></Field><Field label="Equation"><Input value={card.equation || ''} onChange={(event) => updateCard({ equation: event.target.value })} /></Field><Field label="Expression"><Input value={card.expression || ''} onChange={(event) => updateCard({ expression: event.target.value })} /></Field></div></details>
        <Button type="button" variant="outline" className="w-full" onClick={() => setPreview(true)}><Eye className="mr-2 size-4" />Preview lesson</Button>
      </CardContent></Card>
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 gap-2 border-t bg-background/95 p-3 backdrop-blur"><Button type="button" variant="outline" disabled={index === 0} onClick={previous}>Previous</Button><Button type="button" onClick={close}>Save</Button><Button type="button" variant="outline" disabled={index === total - 1} onClick={next}>Next</Button></div>
    </div>
  );
}

function CardTypeFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  if (card.type === 'question') return <><Field label="Question"><Textarea rows={4} value={card.question || ''} onChange={(event) => updateCard({ question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={5} value={card.options || ''} onChange={(event) => updateCard({ options: event.target.value })} /></Field><Field label="Correct answer"><Input value={card.answer || ''} onChange={(event) => updateCard({ answer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field></>;
  if (card.type === 'fill_blank') return <><Field label="Fill blank text"><Textarea rows={4} value={card.text || ''} onChange={(event) => updateCard({ text: event.target.value })} /></Field><Field label="Answer"><Input value={card.answer || ''} onChange={(event) => updateCard({ answer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field></>;
  if (card.type === 'true_false') return <><Field label="Statement"><Textarea rows={4} value={card.statement || ''} onChange={(event) => updateCard({ statement: event.target.value })} /></Field><Field label="Correct answer"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={(card.answer || 'true').toLowerCase()} onChange={(event) => updateCard({ answer: event.target.value })}><option value="true">True</option><option value="false">False</option></select></Field><Field label="Explanation"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field></>;
  if (card.type === 'flashcard') return <><Field label="Front"><Textarea rows={4} value={card.front || ''} onChange={(event) => updateCard({ front: event.target.value })} /></Field><Field label="Back"><Textarea rows={4} value={card.back || ''} onChange={(event) => updateCard({ back: event.target.value })} /></Field></>;
  if (card.type === 'practice_task') return <><Field label="Task prompt"><Textarea rows={5} value={card.prompt || ''} onChange={(event) => updateCard({ prompt: event.target.value })} /></Field><Field label="Criteria, one per line"><Textarea rows={4} value={card.criteria || ''} onChange={(event) => updateCard({ criteria: event.target.value })} /></Field></>;
  if (card.type === 'case_study') return <><Field label="Scenario"><Textarea rows={5} value={card.body} onChange={(event) => updateCard({ body: event.target.value })} /></Field><Field label="Guided prompt"><Textarea rows={3} value={card.prompt || ''} onChange={(event) => updateCard({ prompt: event.target.value })} /></Field></>;
  return <><Field label={card.type === 'summary' ? 'Key takeaways' : card.type === 'example' ? 'Worked example' : 'Main content'}><Textarea rows={7} value={card.body} onChange={(event) => updateCard({ body: event.target.value })} /></Field><Field label="Supporting points, one per line"><Textarea rows={4} value={card.items || ''} onChange={(event) => updateCard({ items: event.target.value })} /></Field></>;
}

function QuizStep({ quizBank, quizIndex, setQuizIndex, activeQuiz, updateQuiz, addQuiz, removeQuiz }: { quizBank: QuizQuestion[]; quizIndex: number; setQuizIndex: (index: number) => void; activeQuiz: QuizQuestion; updateQuiz: (index: number, patch: Partial<QuizQuestion>) => void; addQuiz: () => void; removeQuiz: (index: number) => void }) {
  if (!activeQuiz) return null;
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-2"><Button type="button" onClick={addQuiz}><Plus className="mr-2 size-4" />Add question</Button><Button type="button" variant="outline" disabled={quizBank.length <= 1} onClick={() => removeQuiz(quizIndex)}>Delete current</Button></div><Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Quiz bank</CardTitle><CardDescription>{quizBank.length} question{quizBank.length === 1 ? '' : 's'}</CardDescription></CardHeader><CardContent className="space-y-3 p-4 pt-0"><div className="flex gap-2 overflow-x-auto pb-1">{quizBank.map((quiz, index) => <Button key={quiz.id} type="button" size="sm" variant={index === quizIndex ? 'default' : 'outline'} onClick={() => setQuizIndex(index)} className="shrink-0">Q{index + 1}</Button>)}</div><Field label="Type"><select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={activeQuiz.type} onChange={(event) => updateQuiz(quizIndex, { type: event.target.value as QuizType })}><option value="mcq">MCQ</option><option value="short_answer">Short answer</option><option value="true_false">True/False</option><option value="fill_blank">Fill blank</option></select></Field><Field label="Question"><Textarea rows={4} value={activeQuiz.question} onChange={(event) => updateQuiz(quizIndex, { question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={5} value={activeQuiz.options} onChange={(event) => updateQuiz(quizIndex, { options: event.target.value })} /></Field><Field label="Answer"><Input value={activeQuiz.answer} onChange={(event) => updateQuiz(quizIndex, { answer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={activeQuiz.explanation} onChange={(event) => updateQuiz(quizIndex, { explanation: event.target.value })} /></Field></CardContent></Card></div>;
}

function PreviewStep({ form, modules, quizBank, activeLesson, saveDraft, saving, editingCourseId }: { form: CourseForm; modules: ManualModule[]; quizBank: QuizQuestion[]; activeLesson: ManualLesson; saveDraft: () => void; saving: boolean; editingCourseId: string | null }) {
  const readiness = validateCourse(form, modules);
  return <div className="space-y-4"><Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Review</CardTitle><CardDescription>{editingCourseId ? 'Saving updates this existing draft.' : 'Saving creates a new draft.'}</CardDescription></CardHeader><CardContent className="space-y-3 p-4 pt-0"><div className={`rounded-xl border p-3 text-sm ${readiness ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-primary/30 bg-primary/5'}`}>{readiness || 'Course looks ready to save.'}</div><div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl border p-3"><p className="font-bold">{modules.length}</p><p className="text-muted-foreground">Modules</p></div><div className="rounded-xl border p-3"><p className="font-bold">{modules.flatMap((m) => m.lessons).length}</p><p className="text-muted-foreground">Lessons</p></div><div className="rounded-xl border p-3"><p className="font-bold">{modules.flatMap((m) => m.lessons).flatMap((l) => l.cards).length}</p><p className="text-muted-foreground">Cards</p></div><div className="rounded-xl border p-3"><p className="font-bold">{quizBank.length}</p><p className="text-muted-foreground">Quiz</p></div></div><Button type="button" className="w-full" disabled={saving} onClick={saveDraft}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{saving ? 'Saving...' : editingCourseId ? 'Update draft' : 'Save draft'}</Button></CardContent></Card>{activeLesson ? <Card className="rounded-2xl"><CardHeader className="p-4"><CardTitle>Student preview</CardTitle></CardHeader><CardContent className="p-0"><LessonPlayer lesson={lessonPreview(activeLesson, form)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /></CardContent></Card> : null}</div>;
}

function AddCardSheet({ close, addCard }: { close: () => void; addCard: (type: CardType) => void }) {
  return <BottomSheet title="Add card" close={close}>{cardTypes.map((type) => <button key={type.value} type="button" className="w-full rounded-xl border p-3 text-left" onClick={() => addCard(type.value)}><p className="font-semibold">{type.label}</p><p className="text-sm text-muted-foreground">{type.help}</p></button>)}</BottomSheet>;
}

function QuickComposeSheet({ value, setValue, run, close }: { value: string; setValue: (value: string) => void; run: () => void; close: () => void }) {
  return <BottomSheet title="Quick compose" close={close}><Textarea rows={5} value={value} onChange={(event) => setValue(event.target.value)} placeholder="e.g. teach compound interest with example, practice and checkpoint" /><Button type="button" className="w-full" disabled={!value.trim()} onClick={run}><Sparkles className="mr-2 size-4" />Create cards</Button></BottomSheet>;
}

function BottomSheet({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-black/40" onClick={close}><div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-background p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">{title}</h3><Button type="button" size="sm" variant="ghost" onClick={close}><X className="size-4" /></Button></div><div className="space-y-2">{children}</div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function formFromCourse(course: Course, fallbackSchoolId: string): CourseForm {
  return {
    title: String(course.title || course.name || ''),
    description: String(course.description || course.summary || ''),
    schoolId: String(course.schoolId || course.school_id || fallbackSchoolId || ''),
    level: String(course.level || course.difficulty || 'beginner'),
    durationHours: String(course.durationHours ?? course.duration_hours ?? 8),
    entryFee: String(course.price ?? course.entryFee ?? course.entry_fee ?? 0),
    currency: String(course.currency || 'ZMW'),
    certificateFee: String(course.certificateFee ?? course.certificate_fee ?? 0),
  };
}

function modulesFromLessons(lessons: Lesson[]): ManualModule[] {
  if (!lessons.length) return [makeModule(1)];
  const map = new Map<number, ManualModule>();
  [...lessons].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)).forEach((lesson, index) => {
    const moduleIndex = Number.isFinite(Number(lesson.moduleIndex)) ? Number(lesson.moduleIndex) : 0;
    const moduleTitle = String(lesson.moduleTitle || `Module ${moduleIndex + 1}`);
    if (!map.has(moduleIndex)) map.set(moduleIndex, { id: uid('module'), title: moduleTitle, description: 'Imported module', outcomes: [], lessons: [], saved: true });
    map.get(moduleIndex)!.lessons.push({ id: String(lesson.id || uid('lesson')), title: String(lesson.title || `Lesson ${index + 1}`), summary: stripHtml(String(lesson.summary || lesson.content || '')), outcomes: lesson.exercise ? [stripHtml(String(lesson.exercise))] : ['Understand the main idea.'], cards: cardsFromLesson(lesson), saved: true });
  });
  return [...map.entries()].sort(([a], [b]) => a - b).map(([, module]) => module);
}

function cardsFromLesson(lesson: Lesson): ManualCard[] {
  const blocks = extractBlocksFromLesson(lesson);
  if (blocks.length) return blocks.map((block, index) => cardFromBlock(block, index + 1));
  return [{ ...makeCard('teach', 1), title: String(lesson.title || 'Lesson overview'), body: stripHtml(String(lesson.content || lesson.summary || 'Edit this lesson.')), saved: true }];
}

function extractBlocksFromLesson(lesson: Lesson): any[] {
  const direct = [lesson.blocks, lesson.cards, lesson.contentBlocks, lesson.lessonBlocks].filter(Array.isArray).flat();
  const fromObjects = Array.isArray(lesson.learningObjects) ? lesson.learningObjects.flatMap((object: any) => extractBlocksFromPayload(object.payload ?? parseMaybeJson(object.body))) : [];
  return [...direct, ...fromObjects].filter(Boolean);
}

function extractBlocksFromPayload(payload: unknown): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  return [record.blocks, record.cards, record.items, record.steps].filter(Array.isArray).flat();
}

function cardFromBlock(block: any, index: number): ManualCard {
  const type = normalizeCardType(block.type || block.cardType || block.kind || 'teach');
  const visual = block.visual && typeof block.visual === 'object' ? block.visual : null;
  return {
    ...makeCard(type, index),
    id: String(block.id || uid('card')),
    title: String(block.title || block.heading || block.label || `${cardLabel(type)} ${index}`),
    body: String(block.body || block.content || block.description || ''),
    question: block.question || block.prompt,
    text: block.text,
    statement: block.statement,
    prompt: block.prompt,
    front: block.front,
    back: block.back,
    options: Array.isArray(block.options) ? block.options.join('\n') : String(block.options || ''),
    answer: String(block.answer ?? block.correctAnswer ?? block.correct_answer ?? ''),
    explanation: block.explanation,
    items: Array.isArray(block.items) ? block.items.join('\n') : String(block.items || ''),
    criteria: Array.isArray(block.criteria) ? block.criteria.join('\n') : String(block.criteria || ''),
    imageUrl: block.imageUrl || block.image_url,
    imageAlt: block.imageAlt || block.image_alt,
    imageCaption: block.imageCaption || block.image_caption,
    mathTool: block.mathTool || block.math_tool || visual?.type || 'none',
    equation: block.equation || visual?.equation,
    expression: block.expression || visual?.expression || visual?.functions?.[0]?.expression,
    saved: true,
  };
}

function quizFromLessons(lessons: Lesson[]): QuizQuestion[] {
  const quizzes = lessons.flatMap((lesson) => (lesson.quiz?.questions ?? []).map((question: any, index: number) => ({ id: uid('quiz'), type: (question.options?.length ? 'mcq' : 'short_answer') as QuizType, difficulty: 'easy' as const, timeSeconds: '60', question: question.question || `Question ${index + 1}`, options: Array.isArray(question.options) ? question.options.join('\n') : '', answer: String(question.answer || question.options?.[0] || ''), explanation: question.explanation || 'Review the lesson before answering.' })));
  return quizzes.length ? quizzes : [makeQuiz(1)];
}

function normalizeModules(value: any[]): ManualModule[] {
  return value.map((module, index) => ({ ...makeModule(index + 1), ...module, lessons: Array.isArray(module.lessons) && module.lessons.length ? module.lessons.map((lesson: any, lessonIndex: number) => ({ ...makeLesson(lessonIndex + 1), ...lesson, outcomes: Array.isArray(lesson.outcomes) ? lesson.outcomes : lines(lesson.outcomes), cards: Array.isArray(lesson.cards) && lesson.cards.length ? lesson.cards.map((card: any, cardIndex: number) => ({ ...makeCard(normalizeCardType(card.type), cardIndex + 1), ...card, type: normalizeCardType(card.type) })) : [makeCard('teach', 1)] })) : [makeLesson(1)] }));
}

function buildBlueprint(form: CourseForm, modules: ManualModule[], quizBank: QuizQuestion[]): any {
  const totalMinutes = toPositiveInt(form.durationHours, 1) * 60;
  const lessonCount = Math.max(1, modules.reduce((count, module) => count + module.lessons.length, 0));
  const lessonMinutes = Math.max(5, Math.round(totalMinutes / lessonCount));
  const outcomes = modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.outcomes)).filter(Boolean).slice(0, 12);
  return { schemaVersion: 'short-course-v1', generatedAt: new Date().toISOString(), courseSummary: { title: form.title, audience: 'Short-course learners', level: form.level, description: form.description || 'Manual course draft.', prerequisites: [], totalDurationHours: toPositiveInt(form.durationHours, 1), outcomes: outcomes.length ? outcomes : ['Understand the key ideas.'], finalAssessment: 'Practice exam from quiz bank.', certificateCriteria: 'Complete lessons and pass the final assessment.' }, assessments: { quizzes: quizBank.map((q) => `${q.difficulty.toUpperCase()} | ${q.type} | ${q.timeSeconds}s | ${q.question} | Answer: ${q.answer} | ${q.explanation}`), practicalWork: [], instructorReviewChecklist: ['Check lesson accuracy.', 'Check card order.', 'Check quiz answers.'] }, modules: modules.map((module, moduleIndex) => ({ title: module.title || `Module ${moduleIndex + 1}`, description: module.description || 'Manual module.', durationMinutes: Math.max(30, lessonMinutes * module.lessons.length), outcomes: module.outcomes, moduleAssessment: 'Quiz bank practice.', lessons: module.lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: lessonMinutes, difficulty: form.level, outcomes: lesson.outcomes, blocks: lesson.cards.map(blockFromCard), activities: [], assessment: 'Complete all cards.' })) })) };
}

function blockFromCard(card: ManualCard): any {
  const shared = { title: card.title, body: card.body, items: lines(card.items), criteria: lines(card.criteria), imageUrl: card.imageUrl, imageAlt: card.imageAlt, imageCaption: card.imageCaption, visual: mathVisual(card) };
  if (card.type === 'question') return compact({ ...shared, type: 'question', question: card.question, options: lines(card.options), correctAnswer: card.answer, explanation: card.explanation });
  if (card.type === 'fill_blank') return compact({ ...shared, type: 'fill_blank', text: card.text, correctAnswer: card.answer, explanation: card.explanation });
  if (card.type === 'true_false') return compact({ ...shared, type: 'true_false', statement: card.statement, correctAnswer: String(card.answer || '').toLowerCase() === 'true', explanation: card.explanation });
  if (card.type === 'flashcard') return compact({ ...shared, type: 'flashcard', front: card.front, back: card.back });
  if (card.type === 'practice_task') return compact({ ...shared, type: 'practice_task', prompt: card.prompt });
  if (card.type === 'case_study') return compact({ ...shared, type: 'case_study', prompt: card.prompt });
  if (card.type === 'teach') return compact({ ...shared, type: 'explanation' });
  return compact({ ...shared, type: card.type });
}

function mathVisual(card: ManualCard) {
  if (!card.mathTool || card.mathTool === 'none') return undefined;
  if (card.mathTool === 'equation') return compact({ type: 'equation', equation: card.equation });
  if (card.mathTool === 'graph') return compact({ type: 'graph', functions: card.expression ? [{ expression: card.expression }] : [] });
  return compact({ type: card.mathTool, equation: card.equation, expression: card.expression });
}

function flattenLessons(blueprint: any) {
  return blueprint.modules.flatMap((module: any, moduleIndex: number) => module.lessons.map((lesson: any, lessonIndex: number) => ({ ...lesson, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex })));
}

function lessonPreview(lesson: ManualLesson, form: CourseForm) {
  return { id: lesson?.id || 'preview', title: lesson?.title || 'Preview lesson', summary: lesson?.summary || '', estimatedMinutes: Math.max(5, Math.round((toPositiveInt(form.durationHours, 1) * 60) / 4)), difficulty: form.level, learningObjects: [{ id: 'preview-object', type: 'content', title: lesson?.title || 'Preview', body: JSON.stringify({ blocks: lesson?.cards?.map(blockFromCard) ?? [] }), payload: { blocks: lesson?.cards?.map(blockFromCard) ?? [] } }] } as any;
}

function cardsFromQuickPrompt(prompt: string, startIndex: number): ManualCard[] {
  const value = prompt.trim().toLowerCase();
  if (!value) return [];
  const topic = prompt.replace(/\b(teach|explain|with|and|then|add|make|create|card|cards|example|checkpoint|quiz|question|summary|practice|case|flashcard)\b/gi, ' ').replace(/\s+/g, ' ').trim() || 'the lesson idea';
  const types: CardType[] = [];
  if (/teach|explain|intro|concept/.test(value)) types.push('teach');
  if (/example|worked|sample/.test(value)) types.push('example');
  if (/practice|task|exercise/.test(value)) types.push('practice_task');
  if (/case|scenario/.test(value)) types.push('case_study');
  if (/flash|recall/.test(value)) types.push('flashcard');
  if (/question|quiz|checkpoint|mcq|test/.test(value)) types.push('question');
  if (/summary|recap|wrap/.test(value)) types.push('summary');
  const selected = types.length ? [...new Set(types)] : ['teach', 'example', 'question'] as CardType[];
  return selected.map((type, index) => seedCard(type, topic, startIndex + index));
}

function seedCard(type: CardType, topic: string, index: number): ManualCard {
  const card = makeCard(type, index);
  const titleTopic = topic.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  if (type === 'teach') return { ...card, title: titleTopic, body: `Explain ${topic} in one focused learner card.` };
  if (type === 'example') return { ...card, title: `${titleTopic} example`, body: `Show one practical example of ${topic}.` };
  if (type === 'question') return { ...card, title: `${titleTopic} checkpoint`, question: `Which option best matches ${topic}?`, options: `A clear match\nA distracting option\nAn unrelated option\nA common mistake`, answer: 'A clear match', explanation: `The correct option directly uses ${topic}.` };
  if (type === 'summary') return { ...card, title: `${titleTopic} summary`, body: `Summarize the most important points about ${topic}.` };
  if (type === 'practice_task') return { ...card, title: `${titleTopic} practice`, prompt: `Apply ${topic} to a short task.`, criteria: 'Uses the key idea\nShows the working\nChecks the answer' };
  if (type === 'case_study') return { ...card, title: `${titleTopic} scenario`, body: `A learner faces a realistic situation involving ${topic}.`, prompt: 'What should they decide, and why?' };
  return { ...card, title: `${titleTopic} flashcard`, front: `What is the key idea in ${topic}?`, back: 'State the idea clearly, then give one short example.' };
}

function validateCourse(form: CourseForm, modules: ManualModule[]) {
  if (!form.title.trim()) return 'Course title is required.';
  if (!form.schoolId) return 'School / Faculty is required.';
  if ((form.currency || 'ZMW').trim().length !== 3) return 'Currency must be 3 letters, for example ZMW.';
  if (!modules.length) return 'Add at least one module.';
  const lessons = modules.flatMap((module) => module.lessons);
  if (!lessons.length) return 'Add at least one lesson.';
  if (lessons.some((lesson) => !lesson.title.trim())) return 'Every lesson needs a title.';
  if (lessons.some((lesson) => !lesson.cards.length)) return 'Every lesson needs at least one card.';
  return null;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  if (typeof item === 'undefined') return items;
  copy.splice(toIndex, 0, item);
  return copy;
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  return [...items.slice(0, index), item, ...items.slice(index)];
}

function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '' && (!Array.isArray(item) || item.length > 0))) as Partial<T>;
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toPositiveInt(value: string | number | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.round(parsed));
}

function toMoney(value: string | number | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(2));
}

function normalizeCardType(value: unknown): CardType {
  const type = String(value || 'teach');
  if (type === 'explanation') return 'teach';
  if (cardTypes.some((item) => item.value === type)) return type as CardType;
  return 'teach';
}

function cardLabel(type: CardType) {
  return cardTypes.find((item) => item.value === type)?.label || 'Card';
}

function cardPreview(card: ManualCard) {
  return card.question || card.text || card.statement || card.prompt || card.front || card.body || card.back || card.explanation || 'No content yet.';
}
