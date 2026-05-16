'use client';

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getCourses, getSchools } from '@/lib/api';
import { generateShortCourseContent } from '@/lib/api/short-course-generation';
import type { Course, School } from '@/lib/api/types';
import { extractDocumentText, type DocumentExtractionProgress } from '@/lib/document-text-extractor';

type Mode = 'manual' | 'ai';
type Step = 'setup' | 'lessons' | 'cards' | 'quiz' | 'preview';
type CardType = 'teach' | 'example' | 'question' | 'summary';
type MathTool = 'none' | 'equation' | 'graph' | 'table' | 'formula_sheet' | 'number_line';
type QuestionType = 'mcq' | 'short_answer' | 'true_false' | 'fill_blank';
type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

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

type SourceDoc = { name: string; text: string; warning?: string };
type SubLesson = { id: string; title: string; summary: string; saved: boolean };
type ManualLesson = { id: string; title: string; summary: string; outcomes: string[]; subLessons: SubLesson[]; cards: ManualCard[]; saved: boolean };
type ManualCard = {
  id: string;
  type: CardType;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  question?: string;
  options?: string;
  answer?: string;
  explanation?: string;
  mathTool: MathTool;
  equation?: string;
  expression?: string;
  xMin?: string;
  xMax?: string;
  columns?: string;
  rows?: string;
  formulas?: string;
  min?: string;
  max?: string;
  points?: string;
  saved: boolean;
};

type QuizQuestion = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  timeSeconds: string;
  question: string;
  options: string;
  answer: string;
  explanation: string;
};

const steps: Array<{ id: Step; label: string; description: string }> = [
  { id: 'setup', label: 'Setup', description: 'Course data' },
  { id: 'lessons', label: 'Lessons', description: 'Plan lessons' },
  { id: 'cards', label: 'Cards', description: 'Build content' },
  { id: 'quiz', label: 'Quiz bank', description: 'Practice' },
  { id: 'preview', label: 'Preview', description: 'Check & save' },
];

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`;
const lines = (value?: string) => (value || '').split('\n').map((item) => item.trim()).filter(Boolean);
const comma = (value?: string) => (value || '').split(',').map((item) => item.trim()).filter(Boolean);
const tableRows = (value?: string) => lines(value).map((line) => comma(line));

function makeCard(type: CardType = 'teach', index = 1): ManualCard {
  if (type === 'question') {
    return {
      id: uid('card'),
      type,
      title: `Question card ${index}`,
      body: '',
      question: 'Write your question here.',
      options: 'Option A\nOption B\nOption C\nOption D',
      answer: 'Option A',
      explanation: 'Explain the answer.',
      mathTool: 'none',
      saved: false,
    };
  }

  if (type === 'summary') {
    return { id: uid('card'), type, title: `Summary ${index}`, body: 'Summarize what learners should remember.', mathTool: 'none', saved: false };
  }

  if (type === 'example') {
    return { id: uid('card'), type, title: `Example ${index}`, body: 'Show one practical example.', mathTool: 'none', saved: false };
  }

  return { id: uid('card'), type, title: `Teaching card ${index}`, body: 'Explain one idea clearly.', mathTool: 'none', saved: false };
}

function makeLesson(index: number): ManualLesson {
  return {
    id: uid('lesson'),
    title: `Lesson ${index}`,
    summary: 'Describe what this lesson teaches.',
    outcomes: ['Understand the key idea.'],
    subLessons: [],
    cards: [makeCard('teach', 1), makeCard('example', 2), makeCard('question', 3), makeCard('summary', 4)],
    saved: false,
  };
}

function makeQuiz(): QuizQuestion {
  return {
    id: uid('quiz'),
    type: 'mcq',
    difficulty: 'easy',
    timeSeconds: '60',
    question: 'Write a practice question.',
    options: 'Option A\nOption B\nOption C\nOption D',
    answer: 'Option A',
    explanation: 'Explain the answer.',
  };
}

export function DedicatedManualCourseBuilderClient() {
  const [mode, setMode] = useState<Mode>('manual');
  const [step, setStep] = useState<Step>('setup');
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<DocumentExtractionProgress | null>(null);
  const [documents, setDocuments] = useState<SourceDoc[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [lessons, setLessons] = useState<ManualLesson[]>([makeLesson(1)]);
  const [quizBank, setQuizBank] = useState<QuizQuestion[]>([makeQuiz()]);
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

    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        if (schoolData[0]) setForm((value) => ({ ...value, schoolId: schoolData[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load builder data.'))
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const activeLesson = lessons[lessonIndex] ?? lessons[0];
  const activeCard = activeLesson.cards[cardIndex] ?? activeLesson.cards[0];
  const activeQuiz = quizBank[quizIndex] ?? quizBank[0];
  const sourceText = useMemo(
    () => documents.map((doc, index) => `DOCUMENT ${index + 1}: ${doc.name}\n${doc.text}`).join('\n\n---\n\n').slice(0, 180000),
    [documents]
  );
  const blueprint = useMemo(() => buildBlueprint(form, lessons, quizBank), [form, lessons, quizBank]);

  function updateLesson(patch: Partial<ManualLesson>) {
    setLessons((current) => current.map((lesson, index) => (index === lessonIndex ? { ...lesson, ...patch, saved: false } : lesson)));
  }

  function addLesson() {
    const lesson = makeLesson(lessons.length + 1);
    setLessons((current) => [...current, lesson]);
    setLessonIndex(lessons.length);
    setCardIndex(0);
  }

  function updateCard(patch: Partial<ManualCard>) {
    setLessons((current) => current.map((lesson, index) => index !== lessonIndex ? lesson : {
      ...lesson,
      saved: false,
      cards: lesson.cards.map((card, idx) => idx === cardIndex ? { ...card, ...patch, saved: false } : card),
    }));
  }

  function addCard(type: CardType) {
    setLessons((current) => current.map((lesson, index) => index === lessonIndex ? {
      ...lesson,
      saved: false,
      cards: [...lesson.cards, makeCard(type, lesson.cards.length + 1)],
    } : lesson));
    setCardIndex(activeLesson.cards.length);
  }

  function updateQuiz(patch: Partial<QuizQuestion>) {
    setQuizBank((current) => current.map((quiz, index) => (index === quizIndex ? { ...quiz, ...patch } : quiz)));
  }

  async function readDocuments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setReading(true);
    setProgress(null);
    setError(null);
    setMessage(null);

    try {
      const extracted: SourceDoc[] = [];
      for (const file of files) {
        const result = await extractDocumentText(file, { onProgress: setProgress });
        extracted.push({ name: file.name, text: result.text.slice(0, 60000), warning: result.warning });
      }
      setDocuments((current) => [...current, ...extracted]);
      setMessage(`${extracted.length} document(s) loaded for AI assistance.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read documents.');
    } finally {
      setReading(false);
      setProgress(null);
      event.target.value = '';
    }
  }

  async function generateWithAi() {
    const seed = aiPrompt.trim() || form.title.trim() || 'Create a complete short course.';
    setGenerating(true);
    setError(null);
    setMessage(null);

    try {
      const response = await generateShortCourseContent({
        mode: 'general',
        feature: 'admin_short_course_manual_studio',
        audience: 'short-course learners',
        brandContext: 'Import AI output into editable manual cards. Return strict JSON.',
        prompt: aiPromptFor(seed, form, sourceText, documents.map((doc) => doc.name)),
      });
      const raw = String(response.text || response.output || response.content || JSON.stringify(response));
      const parsed = JSON.parse(cleanJson(raw));
      const importedLessons: ManualLesson[] = (parsed.modules || []).flatMap((module: any, moduleIndex: number) =>
        (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
          id: `ai-${moduleIndex}-${lessonIndex}-${Date.now()}`,
          title: lesson.title || `Lesson ${lessonIndex + 1}`,
          summary: lesson.summary || '',
          outcomes: lesson.outcomes || [],
          subLessons: [],
          cards: (lesson.blocks || []).map((block: any, index: number) => cardFromBlock(block, index + 1)),
          saved: false,
        }))
      );

      setForm((current) => ({
        ...current,
        title: current.title || parsed.courseSummary?.title || '',
        description: current.description || parsed.courseSummary?.description || '',
        level: parsed.courseSummary?.level || current.level,
        durationHours: String(parsed.courseSummary?.totalDurationHours || current.durationHours),
      }));
      if (importedLessons.length) setLessons(importedLessons);
      setMode('manual');
      setStep('cards');
      setLessonIndex(0);
      setCardIndex(0);
      setMessage('AI draft imported. Edit it manually before saving.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    const validation = validateCourse(form, lessons);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await createShortCourseDraftWithBlueprint({
        course: {
          id: slugify(form.title),
          title: form.title,
          description: form.description,
          schoolId: form.schoolId,
          imageId: 'short-course',
          pricingType: Number(form.entryFee) > 0 ? 'paid' : 'free',
          price: Number(form.entryFee || 0),
          currency: form.currency || 'ZMW',
          certificateFee: Number(form.certificateFee || 0),
          certificateCurrency: form.currency || 'ZMW',
          durationHours: Number(form.durationHours || 1),
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

      setCourses(await getCourses());
      setStep('preview');
      setMessage('Draft saved. Open Review & Publish to approve it.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading manual studio..." />;

  return (
    <div className="space-y-6">
      <Header mode={mode} step={step} setMode={setMode} setStep={setStep} saving={saving} saveDraft={saveDraft} />
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {progress ? <ProgressNotice progress={progress} /> : null}

      {mode === 'ai' ? (
        <AiPanel
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          documents={documents}
          readDocuments={readDocuments}
          reading={reading}
          generating={generating}
          generateWithAi={generateWithAi}
          clearDocuments={() => setDocuments([])}
        />
      ) : null}

      {mode === 'manual' && step === 'setup' ? <SetupStep form={form} setForm={setForm} schools={schools} goNext={() => setStep('lessons')} /> : null}
      {mode === 'manual' && step === 'lessons' ? <LessonsStep lessons={lessons} lessonIndex={lessonIndex} setLessonIndex={setLessonIndex} activeLesson={activeLesson} updateLesson={updateLesson} addLesson={addLesson} finish={() => setStep('cards')} /> : null}
      {mode === 'manual' && step === 'cards' ? <CardsStep form={form} lessons={lessons} lessonIndex={lessonIndex} setLessonIndex={setLessonIndex} activeLesson={activeLesson} cardIndex={cardIndex} setCardIndex={setCardIndex} activeCard={activeCard} addCard={addCard} updateCard={updateCard} finish={() => setStep('quiz')} /> : null}
      {mode === 'manual' && step === 'quiz' ? <QuizStep quizBank={quizBank} quizIndex={quizIndex} setQuizIndex={setQuizIndex} activeQuiz={activeQuiz} updateQuiz={updateQuiz} addQuiz={() => { setQuizBank((current) => [...current, makeQuiz()]); setQuizIndex(quizBank.length); }} finish={() => setStep('preview')} /> : null}
      {mode === 'manual' && step === 'preview' ? <PreviewStep form={form} lesson={activeLesson} courses={courses} saveDraft={saveDraft} saving={saving} /> : null}
    </div>
  );
}

function Header({ mode, step, setMode, setStep, saving, saveDraft }: { mode: Mode; step: Step; setMode: (mode: Mode) => void; setStep: (step: Step) => void; saving: boolean; saveDraft: () => void }) {
  return (
    <Card className="rounded-3xl border-primary/20 shadow-sm">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Dedicated manual course studio</p>
            <h2 className="text-2xl font-bold">Create courses visually without JSON.</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lesson timing and difficulty come from the course setup, not every lesson.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={mode === 'manual' ? 'default' : 'outline'} onClick={() => setMode('manual')}>Manual builder</Button>
            <Button type="button" variant={mode === 'ai' ? 'default' : 'outline'} onClick={() => setMode('ai')}>AI helper</Button>
            <Button type="button" disabled={saving} onClick={saveDraft}>{saving ? 'Saving...' : 'Save draft'}</Button>
          </div>
        </div>
        {mode === 'manual' ? (
          <div className="grid gap-2 md:grid-cols-5">
            {steps.map((item, index) => (
              <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`rounded-2xl border p-3 text-left transition ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}>
                <p className="text-sm font-semibold">{index + 1}. {item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SetupStep({ form, setForm, schools, goNext }: { form: CourseForm; setForm: React.Dispatch<React.SetStateAction<CourseForm>>; schools: School[]; goNext: () => void }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Course setup</CardTitle>
        <CardDescription>Set duration and difficulty once here. Lessons inherit it automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field label="Course title"><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></Field>
        <Field label="Course description"><Textarea rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="School / Faculty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
          <Field label="Course difficulty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></Field>
          <Field label="Total course hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
          <Field label="Entry fee"><Input type="number" min={0} value={form.entryFee} onChange={(event) => setForm((value) => ({ ...value, entryFee: event.target.value }))} /></Field>
          <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
          <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
        </div>
        <Button type="button" onClick={goNext}>Continue to lessons</Button>
      </CardContent>
    </Card>
  );
}

function LessonsStep(props: { lessons: ManualLesson[]; lessonIndex: number; setLessonIndex: (index: number) => void; activeLesson: ManualLesson; updateLesson: (patch: Partial<ManualLesson>) => void; addLesson: () => void; finish: () => void }) {
  const { lessons, lessonIndex, setLessonIndex, activeLesson, updateLesson, addLesson, finish } = props;
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Lessons</CardTitle><CardDescription>Plan lesson names and outcomes.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {lessons.map((lesson, index) => <button key={lesson.id} type="button" onClick={() => setLessonIndex(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === lessonIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}><p className="font-semibold">{lesson.title}</p><p className="text-xs text-muted-foreground">{lesson.cards.length} cards</p></button>)}
          <Button type="button" variant="outline" className="w-full" onClick={addLesson}>+ Add new lesson</Button>
        </CardContent>
      </Card>
      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Edit lesson</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label="Lesson title"><Input value={activeLesson.title} onChange={(event) => updateLesson({ title: event.target.value })} /></Field>
          <Field label="Lesson summary"><Textarea rows={4} value={activeLesson.summary} onChange={(event) => updateLesson({ summary: event.target.value })} /></Field>
          <Field label="Learning outcomes, one per line"><Textarea rows={4} value={activeLesson.outcomes.join('\n')} onChange={(event) => updateLesson({ outcomes: lines(event.target.value) })} /></Field>
          <Button type="button" onClick={finish}>Finish lessons & build cards</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CardsStep(props: { form: CourseForm; lessons: ManualLesson[]; lessonIndex: number; setLessonIndex: (index: number) => void; activeLesson: ManualLesson; cardIndex: number; setCardIndex: (index: number) => void; activeCard: ManualCard; addCard: (type: CardType) => void; updateCard: (patch: Partial<ManualCard>) => void; finish: () => void }) {
  const { form, lessons, lessonIndex, setLessonIndex, activeLesson, cardIndex, setCardIndex, activeCard, addCard, updateCard, finish } = props;
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Card editor</CardTitle><CardDescription>Build lesson content cards.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">{lessons.map((lesson, index) => <Button key={lesson.id} type="button" size="sm" variant={index === lessonIndex ? 'default' : 'outline'} onClick={() => { setLessonIndex(index); setCardIndex(0); }}>{lesson.title}</Button>)}</div>
          <div className="grid gap-2 sm:grid-cols-4"><Button variant="outline" onClick={() => addCard('teach')}>+ Teach</Button><Button variant="outline" onClick={() => addCard('example')}>+ Example</Button><Button variant="outline" onClick={() => addCard('question')}>+ Question</Button><Button variant="outline" onClick={() => addCard('summary')}>+ Summary</Button></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{activeLesson.cards.map((card, index) => <button key={card.id} type="button" onClick={() => setCardIndex(index)} className={`min-w-[120px] rounded-2xl border p-3 text-left text-xs ${index === cardIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40'}`}><p className="font-semibold">Card {index + 1}</p><p className="text-muted-foreground">{card.type}</p></button>)}</div>
          <Field label="Card type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeCard.type} onChange={(event) => updateCard({ type: event.target.value as CardType })}><option value="teach">Teach</option><option value="example">Example</option><option value="question">Question</option><option value="summary">Summary</option></select></Field>
          <Field label="Card title"><Input value={activeCard.title} onChange={(event) => updateCard({ title: event.target.value })} /></Field>
          <CardFields card={activeCard} updateCard={updateCard} />
          <MathFields card={activeCard} updateCard={updateCard} />
          <Button type="button" onClick={finish}>Finish cards</Button>
        </CardContent>
      </Card>
      <Card className="rounded-3xl xl:sticky xl:top-4 xl:self-start"><CardHeader><CardTitle>Live student preview</CardTitle></CardHeader><CardContent><LessonPlayer lesson={lessonPreview(activeLesson, form)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /></CardContent></Card>
    </div>
  );
}

function CardFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  if (card.type === 'question') {
    return <><Field label="Question"><Textarea rows={3} value={card.question || ''} onChange={(event) => updateCard({ question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={4} value={card.options || ''} onChange={(event) => updateCard({ options: event.target.value })} /></Field><Field label="Correct answer"><Input value={card.answer || ''} onChange={(event) => updateCard({ answer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  }
  return <><Field label="Card text"><Textarea rows={5} value={card.body} onChange={(event) => updateCard({ body: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
}

function MathFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  return <div className="space-y-3 rounded-2xl border p-4"><div><p className="font-semibold">Math / visual inside this card</p><p className="text-sm text-muted-foreground">Attach an equation, graph, table, formula sheet or number line.</p></div><Field label="Math tool"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={card.mathTool} onChange={(event) => updateCard({ mathTool: event.target.value as MathTool })}><option value="none">No math visual</option><option value="equation">Equation</option><option value="graph">Graph</option><option value="table">Table</option><option value="formula_sheet">Formula sheet</option><option value="number_line">Number line</option></select></Field>{card.mathTool === 'equation' ? <Field label="Equation"><Input value={card.equation || ''} onChange={(event) => updateCard({ equation: event.target.value })} placeholder="x^2 + y^2 = r^2" /></Field> : null}{card.mathTool === 'graph' ? <div className="grid gap-3 md:grid-cols-3"><Field label="Function"><Input value={card.expression || ''} onChange={(event) => updateCard({ expression: event.target.value })} placeholder="x^2" /></Field><Field label="X min"><Input type="number" value={card.xMin || '-10'} onChange={(event) => updateCard({ xMin: event.target.value })} /></Field><Field label="X max"><Input type="number" value={card.xMax || '10'} onChange={(event) => updateCard({ xMax: event.target.value })} /></Field></div> : null}{card.mathTool === 'table' ? <><Field label="Columns, comma separated"><Input value={card.columns || ''} onChange={(event) => updateCard({ columns: event.target.value })} placeholder="x, y" /></Field><Field label="Rows, one row per line"><Textarea rows={4} value={card.rows || ''} onChange={(event) => updateCard({ rows: event.target.value })} placeholder="-2, 4\n-1, 1\n0, 0" /></Field></> : null}{card.mathTool === 'formula_sheet' ? <Field label="Formulas: name | formula | description"><Textarea rows={5} value={card.formulas || ''} onChange={(event) => updateCard({ formulas: event.target.value })} /></Field> : null}{card.mathTool === 'number_line' ? <div className="grid gap-3 md:grid-cols-3"><Field label="Min"><Input value={card.min || '-5'} onChange={(event) => updateCard({ min: event.target.value })} /></Field><Field label="Max"><Input value={card.max || '5'} onChange={(event) => updateCard({ max: event.target.value })} /></Field><Field label="Points"><Input value={card.points || '0'} onChange={(event) => updateCard({ points: event.target.value })} placeholder="-2, 0, 3" /></Field></div> : null}</div>;
}

function ImageFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
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

function QuizStep(props: { quizBank: QuizQuestion[]; quizIndex: number; setQuizIndex: (index: number) => void; activeQuiz: QuizQuestion; updateQuiz: (patch: Partial<QuizQuestion>) => void; addQuiz: () => void; finish: () => void }) {
  const { quizBank, quizIndex, setQuizIndex, activeQuiz, updateQuiz, addQuiz, finish } = props;
  return <div className="grid gap-6 lg:grid-cols-[320px_1fr]"><Card className="rounded-3xl"><CardHeader><CardTitle>Quiz bank</CardTitle><CardDescription>Questions for practice and exam generation.</CardDescription></CardHeader><CardContent className="space-y-2">{quizBank.map((quiz, index) => <button key={quiz.id} onClick={() => setQuizIndex(index)} className={`w-full rounded-2xl border p-3 text-left text-sm ${index === quizIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40'}`}><p className="font-semibold">Question {index + 1}</p><p className="text-xs text-muted-foreground">{quiz.difficulty} · {quiz.type} · {quiz.timeSeconds}s</p></button>)}<Button variant="outline" className="w-full" onClick={addQuiz}>+ Add question</Button></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Edit quiz question</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Question"><Textarea rows={4} value={activeQuiz.question} onChange={(event) => updateQuiz({ question: event.target.value })} /></Field><div className="grid gap-3 md:grid-cols-3"><Field label="Type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeQuiz.type} onChange={(event) => updateQuiz({ type: event.target.value as QuestionType })}><option value="mcq">MCQ</option><option value="short_answer">Short answer</option><option value="true_false">True/False</option><option value="fill_blank">Fill blank</option></select></Field><Field label="Difficulty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeQuiz.difficulty} onChange={(event) => updateQuiz({ difficulty: event.target.value as Difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="very_hard">Very hard</option></select></Field><Field label="Time seconds"><Input value={activeQuiz.timeSeconds} onChange={(event) => updateQuiz({ timeSeconds: event.target.value })} /></Field></div>{activeQuiz.type === 'mcq' ? <Field label="Options, one per line"><Textarea rows={4} value={activeQuiz.options} onChange={(event) => updateQuiz({ options: event.target.value })} /></Field> : null}<Field label="Answer"><Input value={activeQuiz.answer} onChange={(event) => updateQuiz({ answer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={activeQuiz.explanation} onChange={(event) => updateQuiz({ explanation: event.target.value })} /></Field><div className="grid gap-2 sm:grid-cols-2"><Button onClick={addQuiz}>Save & add another</Button><Button variant="secondary" onClick={finish}>Finish quiz bank</Button></div></CardContent></Card></div>;
}

function AiPanel(props: { aiPrompt: string; setAiPrompt: (value: string) => void; documents: SourceDoc[]; readDocuments: (event: ChangeEvent<HTMLInputElement>) => void; reading: boolean; generating: boolean; generateWithAi: () => void; clearDocuments: () => void }) {
  return <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><Card className="rounded-3xl border-primary/20 bg-primary/5"><CardHeader><CardTitle>AI helper</CardTitle><CardDescription>AI tools live here only. Generate a draft, then edit it manually.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Prompt for AI"><Textarea rows={7} value={props.aiPrompt} onChange={(event) => props.setAiPrompt(event.target.value)} /></Field><Field label="Documents for AI"><Input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={props.readDocuments} disabled={props.reading} /></Field><DocumentList documents={props.documents} onClear={props.clearDocuments} /><Button className="w-full" onClick={props.generateWithAi} disabled={props.generating || props.reading}>{props.generating ? 'Generating...' : 'Generate draft and open manual editor'}</Button></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Rule</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>AI never publishes directly.</p><p>AI output becomes editable lessons, cards and quiz questions.</p></CardContent></Card></div>;
}

function PreviewStep({ form, lesson, courses, saveDraft, saving }: { form: CourseForm; lesson: ManualLesson; courses: Course[]; saveDraft: () => void; saving: boolean }) {
  return <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]"><Card className="rounded-3xl"><CardHeader><CardTitle>Final preview</CardTitle></CardHeader><CardContent><LessonPlayer lesson={lessonPreview(lesson, form)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /><Button className="mt-4 w-full" onClick={saveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save draft for review'}</Button></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Recent courses</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{courses.slice(0, 8).map((course) => <div key={course.id} className="rounded-xl border p-3"><p className="font-semibold">{course.title}</p><p className="text-muted-foreground">{course.status ?? 'draft'} · {course.level ?? 'beginner'} · {course.durationHours ?? 0}h</p></div>)}</CardContent></Card></div>;
}

function ProgressNotice({ progress }: { progress: DocumentExtractionProgress }) {
  return <div className="rounded-2xl border bg-primary/5 p-4 text-sm"><div className="mb-2 flex justify-between gap-3"><span>{progress.message}</span><strong>{progress.percent ?? 0}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(1, progress.percent ?? 1)}%` }} /></div></div>;
}

function DocumentList({ documents, onClear }: { documents: SourceDoc[]; onClear: () => void }) {
  if (!documents.length) return null;
  return <div className="space-y-2 rounded-2xl border p-3 text-sm"><p className="font-semibold">Loaded documents</p>{documents.map((doc, index) => <div key={`${doc.name}-${index}`} className="rounded-xl bg-muted/40 p-2"><p>{index + 1}. {doc.name}</p>{doc.warning ? <p className="text-xs text-amber-600">{doc.warning}</p> : null}</div>)}<Button size="sm" variant="ghost" onClick={onClear}>Clear documents</Button></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function cardFromBlock(block: any, index: number): ManualCard {
  const type: CardType = block.type === 'question' ? 'question' : block.type === 'example' ? 'example' : block.type === 'summary' ? 'summary' : 'teach';
  const card = makeCard(type, index);
  return {
    ...card,
    title: block.title || card.title,
    body: block.body || card.body,
    question: block.question || card.question,
    options: Array.isArray(block.options) ? block.options.join('\n') : card.options,
    answer: String(block.correctAnswer || block.answer || card.answer || ''),
    explanation: block.explanation || card.explanation,
    mathTool: block.visual?.type || 'none',
    equation: block.visual?.equation,
    expression: block.visual?.functions?.[0]?.expression,
  };
}

function blockFromCard(card: ManualCard): any {
  const shared = {
    title: card.title,
    body: card.body,
    imageUrl: card.imageUrl,
    imageAlt: card.imageAlt,
    imageCaption: card.imageCaption,
    visual: mathVisual(card),
  };

  if (card.type === 'question') {
    return {
      ...shared,
      type: 'question',
      question: card.question,
      options: lines(card.options),
      correctAnswer: card.answer,
      explanation: card.explanation,
    };
  }

  if (card.type === 'summary') return { ...shared, type: 'summary' };
  if (card.type === 'example') return { ...shared, type: 'example' };
  return { ...shared, type: 'explanation' };
}

function mathVisual(card: ManualCard) {
  if (card.mathTool === 'equation') return { type: 'equation', equation: card.equation || '' };
  if (card.mathTool === 'graph') return { type: 'graph', graphType: 'function', functions: [{ expression: card.expression || 'x', label: card.expression || 'f(x)' }], xMin: Number(card.xMin || -10), xMax: Number(card.xMax || 10) };
  if (card.mathTool === 'table') return { type: 'table', columns: comma(card.columns), rows: tableRows(card.rows) };
  if (card.mathTool === 'formula_sheet') {
    return {
      type: 'formula_sheet',
      formulas: lines(card.formulas).map((line) => {
        const [name = '', formula = '', description = ''] = line.split('|').map((item) => item.trim());
        return { name, formula, description };
      }),
    };
  }
  if (card.mathTool === 'number_line') return { type: 'number_line', min: Number(card.min || -5), max: Number(card.max || 5), points: comma(card.points).map(Number).filter(Number.isFinite) };
  return undefined;
}

function buildBlueprint(form: CourseForm, lessons: ManualLesson[], quizBank: QuizQuestion[]): any {
  const totalMinutes = Math.max(5, Number(form.durationHours || 1) * 60);
  const lessonMinutes = Math.max(5, Math.round(totalMinutes / Math.max(1, lessons.length)));
  const outcomes = lessons.flatMap((lesson) => lesson.outcomes).filter(Boolean).slice(0, 10);

  return {
    courseSummary: {
      title: form.title || 'Untitled short course',
      audience: 'Short-course learners',
      level: form.level,
      description: form.description || 'Manual course draft.',
      prerequisites: [],
      totalDurationHours: Number(form.durationHours || 1),
      outcomes: outcomes.length ? outcomes : ['Understand the key ideas.'],
      finalAssessment: 'Practice exam from quiz bank.',
      certificateCriteria: 'Complete lessons and pass the final assessment.',
    },
    assessments: {
      quizzes: quizBank.map((q) => `${q.difficulty.toUpperCase()} | ${q.type} | ${q.timeSeconds}s | ${q.question} | Answer: ${q.answer} | ${q.explanation}`),
      practicalWork: [],
      instructorReviewChecklist: ['Check lesson accuracy.', 'Check math inside cards.', 'Check quiz answers.', 'Check images and captions.'],
    },
    modules: [
      {
        title: form.title || 'Main module',
        description: form.description || 'Manual module.',
        durationMinutes: totalMinutes,
        outcomes,
        moduleAssessment: 'Quiz bank practice.',
        lessons: lessons.map((lesson) => ({
          title: lesson.title,
          summary: lesson.summary,
          durationMinutes: lessonMinutes,
          difficulty: form.level,
          outcomes: lesson.outcomes,
          blocks: lesson.cards.map(blockFromCard),
          activities: [],
          assessment: 'Complete all cards.',
        })),
      },
    ],
  };
}

function flattenLessons(blueprint: any) {
  return blueprint.modules.flatMap((module: any, moduleIndex: number) => module.lessons.map((lesson: any, lessonIndex: number) => ({
    ...lesson,
    moduleTitle: module.title,
    moduleIndex,
    sortOrder: moduleIndex * 100 + lessonIndex,
  })));
}

function lessonPreview(lesson: ManualLesson, form: CourseForm) {
  return {
    id: 'preview',
    title: lesson.title,
    summary: lesson.summary,
    estimatedMinutes: Math.max(5, Math.round((Number(form.durationHours || 1) * 60) / 4)),
    difficulty: form.level,
    learningObjects: [
      {
        id: 'preview-object',
        type: 'content',
        title: lesson.title,
        body: JSON.stringify({ blocks: lesson.cards.map(blockFromCard) }),
        payload: { blocks: lesson.cards.map(blockFromCard) },
      },
    ] as any,
  } as any;
}

function validateCourse(form: CourseForm, lessons: ManualLesson[]) {
  if (!form.title.trim()) return 'Course title is required.';
  if (!form.schoolId) return 'School / Faculty is required.';
  if (!lessons.length) return 'Add at least one lesson.';
  if (lessons.some((lesson) => !lesson.title.trim())) return 'Every lesson needs a title.';
  if (lessons.some((lesson) => !lesson.cards.length)) return 'Every lesson needs cards.';
  return null;
}

function cleanJson(raw: string) {
  return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function aiPromptFor(seed: string, form: CourseForm, sourceText: string, names: string[]) {
  return `Create a short course in strict JSON only. Prompt: ${seed}\nTitle: ${form.title || 'Suggest title'}\nLevel: ${form.level}\nHours: ${form.durationHours}\nDocuments: ${names.join(', ') || 'none'}\n${sourceText ? `Source text:\n${sourceText}` : ''}\nMath should be inside card.visual. Return courseSummary, assessments, modules, lessons, blocks.`;
}
