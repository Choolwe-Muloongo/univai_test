'use client';

import { ChangeEvent, DragEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit3,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  LibraryBig,
  ListChecks,
  Monitor,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Scissors,
  Sparkles,
  Smartphone,
  Trash2,
  Wand2,
} from 'lucide-react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { MathText } from '@/components/learning/math-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { getCourseById, getCourses, getLessonsByCourse, getSchools } from '@/lib/api';
import { saveShortCourseDraftWithBlueprint } from '@/lib/api/safe-short-course-save';
import { generateShortCourseContent } from '@/lib/api/short-course-generation';
import type { Course, Lesson, School } from '@/lib/api/types';
import {
  LESSON_BLOCK_CATEGORIES,
  LESSON_BLOCK_TEMPLATE_COUNT,
  LESSON_BLOCK_TEMPLATES,
  type BroadCardType,
  type BroadMathTool,
  type LessonBlockTemplate,
} from '@/lib/lesson-block-library';
import {
  extractDocumentText,
  type DocumentExtractionProgress,
} from '@/lib/document-text-extractor';

type Mode = 'manual' | 'ai';
type Step = 'setup' | 'lessons' | 'cards' | 'quiz' | 'preview';
type PreviewMode = 'desktop' | 'mobile' | 'outline' | 'quiz';
type CardType = BroadCardType;
type MathTool = BroadMathTool;
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
type SubLesson = { id: string; title: string; summary: string; cards: ManualCard[]; saved: boolean };
type ManualLesson = { id: string; title: string; summary: string; outcomes: string[]; subLessons: SubLesson[]; cards: ManualCard[]; saved: boolean };
type ManualModule = { id: string; title: string; description: string; outcomes: string[]; lessons: ManualLesson[]; saved: boolean };
type ManualCard = {
  id: string;
  type: CardType;
  workflowTemplate?: CardWorkflowTemplateId;
  title: string;
  body: string;
  originalBlockType?: string;
  templateId?: string;
  templateLabel?: string;
  subjectArea?: string;
  teachingMove?: string;
  boardId?: string;
  keepSourceVisible?: boolean;
  sourceQuestion?: string;
  teacherNote?: string;
  extractedData?: string;
  graphPointX?: string;
  graphPointY?: string;
  graphPointLabel?: string;
  graphMode?: 'function' | 'point';
  showGraphLine?: boolean;
  cumulativeTable?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  question?: string;
  text?: string;
  statement?: string;
  prompt?: string;
  front?: string;
  back?: string;
  items?: string;
  criteria?: string;
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
  intervals?: string;

  vennSetCount?: string;
  vennLabels?: string;
  vennHighlight?: string;
  vennDescription?: string;
  given?: string;
  required?: string;
  formula?: string;
  steps?: string;
  finalAnswer?: string;
  commonMistake?: string;
  assumption?: string;
  reasoning?: string;
  contradiction?: string;
  conclusion?: string;
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

type BuilderStats = {
  lessons: number;
  cards: number;
  quizQuestions: number;
  hours: number;
};

type BuilderSnapshot = {
  form: CourseForm;
  modules: ManualModule[];
  quizBank: QuizQuestion[];
  editingCourseId?: string | null;
};

type ReadinessItem = {
  label: string;
  done: boolean;
  detail?: string;
};

type LearnerLoad = {
  level: 'short' | 'medium' | 'heavy';
  score: number;
  percent: number;
  hint: string;
};

type CardWorkflowTemplateId = 'teach' | 'example' | 'checkpoint' | 'visual' | 'flashcard' | 'practice_task' | 'case_scenario' | 'summary' | 'worked_solution' | 'proof';

type CardWorkflowTemplate = {
  id: CardWorkflowTemplateId;
  label: string;
  type: CardType;
  help: string;
  focus: string;
  seed: Partial<ManualCard>;
};

type CardSequence = {
  id: string;
  label: string;
  help: string;
  templates: CardWorkflowTemplateId[];
};

const steps: Array<{ id: Step; label: string; description: string }> = [
  { id: 'setup', label: 'Course outline', description: 'Basics' },
  { id: 'lessons', label: 'Lesson plan', description: 'Chapters' },
  { id: 'cards', label: 'Lesson builder', description: 'Cards' },
  { id: 'quiz', label: 'Assessments', description: 'Questions' },
  { id: 'preview', label: 'Review', description: 'Check & save' },
];

const AUTOSAVE_KEY = 'univai.manual-builder.autosave.v2';

const initialCourseForm = (schoolId = ''): CourseForm => ({
  title: '',
  description: '',
  schoolId,
  level: 'beginner',
  durationHours: '8',
  entryFee: '0',
  currency: 'ZMW',
  certificateFee: '0',
});

const cardTypeOptions = [
  ['teach', 'Teach'],
  ['example', 'Example'],
  ['question', 'Question'],
  ['fill_blank', 'Fill blank'],
  ['true_false', 'True/False'],
  ['summary', 'Summary'],
  ['definition', 'Definition'],
  ['case_study', 'Case study'],
  ['scenario', 'Scenario'],
  ['checklist', 'Checklist'],
  ['process', 'Process'],
  ['comparison', 'Comparison'],
  ['reflection', 'Reflection'],
  ['flashcard', 'Flashcard'],
  ['mini_project', 'Mini project'],
  ['rubric', 'Rubric'],
  ['timeline', 'Timeline'],
  ['risk_review', 'Risk review'],
  ['practice_task', 'Practice task'],
  ['capstone_prompt', 'Capstone prompt'],
  ['worked_solution', 'Worked Solution'],
  ['proof', 'Proof'],
] as const;

const CARD_WORKFLOW_TEMPLATES: CardWorkflowTemplate[] = [
  { id: 'teach', label: 'Teach', type: 'teach', help: 'Explain one concept clearly.', focus: 'Core idea', seed: { title: 'Core idea', body: 'Explain one idea clearly.' } },
  { id: 'example', label: 'Example', type: 'example', help: 'Show one applied example.', focus: 'Worked example', seed: { title: 'Example', body: 'Show one practical example.' } },
  { id: 'checkpoint', label: 'Checkpoint', type: 'question', help: 'Ask one auto-marked check.', focus: 'Learner decision', seed: { title: 'Quick check', question: 'Write one focused question here.', options: 'Option A\nOption B\nOption C\nOption D', answer: 'Option A', explanation: 'Explain why this answer is correct.' } },
  { id: 'visual', label: 'Visual', type: 'teach', help: 'Anchor the card around an image, chart, equation, or table.', focus: 'Visual explanation', seed: { title: 'Visual focus', body: 'Explain what learners should notice in this visual.', mathTool: 'graph', expression: 'x' } },
  { id: 'flashcard', label: 'Flashcard', type: 'flashcard', help: 'Create a reveal card for a term or rule.', focus: 'Recall', seed: { title: 'Flashcard', front: 'Term or prompt', back: 'Answer or explanation', body: '' } },
  { id: 'practice_task', label: 'Practice Task', type: 'practice_task', help: 'Give one applied task with success criteria.', focus: 'Practice', seed: { title: 'Practice task', prompt: 'Describe the task learners should complete.', criteria: 'Clear attempt\nUses the lesson idea\nChecks the result', body: '' } },
  { id: 'case_scenario', label: 'Case/Scenario', type: 'scenario', help: 'Frame one decision or workplace situation.', focus: 'Applied context', seed: { title: 'Scenario', body: 'Describe the case or situation.', prompt: 'What should the learner decide or explain?', criteria: 'Uses evidence from the case\nExplains the decision' } },
  { id: 'summary', label: 'Summary', type: 'summary', help: 'Close with the key takeaways.', focus: 'Wrap-up', seed: { title: 'Summary', body: 'Summarize what learners should remember.' } },
  { id: 'worked_solution', label: 'Worked Solution', type: 'worked_solution', help: 'Step-by-step solution card for MA110.', focus: 'Reasoned method', seed: { title: 'Worked Solution', body: 'Solve the problem step by step.', question: 'Problem', explanation: 'Final check' } },
  { id: 'proof', label: 'Proof', type: 'proof', help: 'Formal reasoning or contradiction proof.', focus: 'Proof logic', seed: { title: 'Proof', statement: 'Statement to prove', body: 'Reasoning steps', conclusion: 'Conclusion' } as Partial<ManualCard> },
];

const CARD_SEQUENCES: CardSequence[] = [
  { id: 'core-loop', label: 'Teach loop', help: 'Teach, example, checkpoint, summary.', templates: ['teach', 'example', 'checkpoint', 'summary'] },
  { id: 'practice-loop', label: 'Practice loop', help: 'Teach, practice task, checkpoint.', templates: ['teach', 'practice_task', 'checkpoint'] },
  { id: 'case-loop', label: 'Case loop', help: 'Scenario, example, checkpoint, summary.', templates: ['case_scenario', 'example', 'checkpoint', 'summary'] },
  { id: 'visual-loop', label: 'Visual loop', help: 'Visual, example, checkpoint.', templates: ['visual', 'example', 'checkpoint'] },
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

  if (type === 'fill_blank') {
    return {
      id: uid('card'),
      type,
      title: `Fill blank ${index}`,
      body: '',
      text: 'Complete this: ____',
      answer: 'answer',
      explanation: 'Explain the missing answer.',
      mathTool: 'none',
      saved: false,
    };
  }

  if (type === 'true_false') {
    return {
      id: uid('card'),
      type,
      title: `True or false ${index}`,
      body: '',
      statement: 'Write a statement learners should judge.',
      answer: 'true',
      explanation: 'Explain why the statement is true or false.',
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

function makeCardFromWorkflowTemplate(template: CardWorkflowTemplate, index: number): ManualCard {
  return {
    ...makeCard(template.type, index),
    ...template.seed,
    id: uid('card'),
    type: template.type,
    workflowTemplate: template.id,
    templateLabel: template.label,
    teachingMove: template.focus,
    mathTool: template.seed.mathTool || 'none',
    saved: false,
  };
}

function makeCardFromTemplate(template: LessonBlockTemplate, index: number): ManualCard {
  return {
    ...makeCard(template.type, index),
    workflowTemplate: workflowTemplateForType(template.type),
    originalBlockType: template.type,
    templateId: template.id,
    templateLabel: template.label,
    subjectArea: template.subjectArea,
    teachingMove: template.teachingMove,
    boardId: template.type.startsWith('graph_') || template.type.includes('account') || template.type.includes('trial_balance') ? 'classroom-problem-1' : undefined,
    keepSourceVisible: template.type.startsWith('graph_') || template.type.includes('account') || template.type.includes('trial_balance') ? true : undefined,
    title: template.title,
    body: template.body || '',
    question: template.question,
    text: template.text,
    statement: template.statement,
    prompt: template.prompt,
    front: template.front,
    back: template.back,
    items: template.items,
    criteria: template.criteria,
    options: template.options,
    answer: template.answer,
    explanation: template.explanation,
    mathTool: template.mathTool || 'none',
    equation: template.equation,
    expression: template.expression,
    xMin: template.xMin,
    xMax: template.xMax,
    columns: template.columns,
    rows: template.rows,
    formulas: template.formulas,
    min: template.min,
    max: template.max,
    points: template.points,
    saved: false,
  };
}

function workflowTemplateForType(type: string): CardWorkflowTemplateId {
  if (type === 'example') return 'example';
  if (type === 'question' || type === 'fill_blank' || type === 'true_false') return 'checkpoint';
  if (type === 'flashcard') return 'flashcard';
  if (type === 'practice_task' || type === 'mini_project' || type === 'capstone_prompt') return 'practice_task';
  if (type === 'case_study' || type === 'scenario') return 'case_scenario';
  if (type === 'summary') return 'summary';
  if (['equation', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry', 'venn'].includes(type)) return 'visual';
  return 'teach';
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
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<DocumentExtractionProgress | null>(null);
  const [documents, setDocuments] = useState<SourceDoc[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [subLessonIndex, setSubLessonIndex] = useState<number | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [modules, setModules] = useState<ManualModule[]>([{ id: uid('module'), title: 'Module 1', description: 'Main module', outcomes: ['Master this module outcomes.'], lessons: [makeLesson(1)], saved: false }]);
  const [quizBank, setQuizBank] = useState<QuizQuestion[]>([makeQuiz()]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [recoverableDraft, setRecoverableDraft] = useState<BuilderSnapshot | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const undoStack = useRef<BuilderSnapshot[]>([]);
  const redoStack = useRef<BuilderSnapshot[]>([]);
  const autosaveReady = useRef(false);
  const [form, setForm] = useState<CourseForm>(initialCourseForm());

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BuilderSnapshot>;
        if (parsed.form && (Array.isArray((parsed as any).modules) || Array.isArray((parsed as any).lessons))) {
          setRecoverableDraft({
            form: { ...initialCourseForm(), ...parsed.form },
            modules: Array.isArray((parsed as any).modules) && (parsed as any).modules.length ? (parsed as any).modules : [{ id: uid('module'), title: 'Module 1', description: 'Imported fallback module', outcomes: [], lessons: (parsed as any).lessons ?? [makeLesson(1)], saved: false }],
            quizBank: Array.isArray(parsed.quizBank) && parsed.quizBank.length ? parsed.quizBank : [makeQuiz()],
            editingCourseId: typeof parsed.editingCourseId === 'string' ? parsed.editingCourseId : null,
          });
          setMessage('A saved builder draft is available. Resume it, or start a new course.');
          return;
        }
      }
      autosaveReady.current = true;
    } catch {
      // Local draft recovery should never block the builder.
      autosaveReady.current = true;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        if (schoolData[0]) setForm((value) => ({ ...value, schoolId: value.schoolId || schoolData[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load builder data.'))
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!autosaveReady.current) return;
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ form, modules, quizBank, editingCourseId }));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [form, modules, quizBank, editingCourseId]);

  const activeModule = modules[moduleIndex] ?? modules[0];
const lessons = activeModule?.lessons ?? [];
const activeLesson = lessons[lessonIndex] ?? lessons[0];
const activeSubLesson =
  subLessonIndex == null ? null : (activeLesson?.subLessons[subLessonIndex] ?? null);

const activeCards = activeSubLesson?.cards ?? activeLesson?.cards ?? [];
const activeCard = activeCards[cardIndex] ?? activeCards[0];
  const activeQuiz = quizBank[quizIndex] ?? quizBank[0];
  const sourceText = useMemo(
    () => documents.map((doc, index) => `DOCUMENT ${index + 1}: ${doc.name}\n${doc.text}`).join('\n\n---\n\n').slice(0, 180000),
    [documents]
  );
  const blueprint = useMemo(() => buildBlueprint(form, modules, quizBank), [form, modules, quizBank]);
  const stats = useMemo(() => ({
    lessons: modules.reduce((count, module) => count + module.lessons.length, 0),
    cards: modules.reduce((count, module) => count + module.lessons.reduce((inner, lesson) => inner + lesson.cards.length + lesson.subLessons.reduce((s, sub) => s + sub.cards.length, 0), 0), 0),
    quizQuestions: quizBank.length,
    hours: toPositiveInt(form.durationHours, 1),
  }), [form.durationHours, modules, quizBank]);

  const readiness = useMemo(() => courseReadiness(form, modules, quizBank), [form, modules, quizBank]);
  const canUndo = historyVersion >= 0 && undoStack.current.length > 0;
  const canRedo = historyVersion >= 0 && redoStack.current.length > 0;

  function currentSnapshot(): BuilderSnapshot {
    return {
      form: structuredClone(form),
      modules: structuredClone(modules),
      quizBank: structuredClone(quizBank),
      editingCourseId,
    };
  }

  function recordHistory() {
    undoStack.current = [...undoStack.current.slice(-24), currentSnapshot()];
    redoStack.current = [];
    setHistoryVersion((value) => value + 1);
  }

  function restoreSnapshot(snapshot: BuilderSnapshot) {
    setForm(snapshot.form);
    setModules(snapshot.modules);
    setQuizBank(snapshot.quizBank);
    setEditingCourseId(snapshot.editingCourseId ?? null);
    setModuleIndex(0);
    setLessonIndex(0);
    setSubLessonIndex(null);
    setCardIndex(0);
    setQuizIndex(0);
  }

  function resumeRecoveredDraft() {
    if (!recoverableDraft) return;
    restoreSnapshot(recoverableDraft);
    setRecoverableDraft(null);
    autosaveReady.current = true;
    setStep('setup');
    setMode('manual');
    setMessage(recoverableDraft.editingCourseId ? 'Resumed saved editing draft.' : 'Resumed saved new-course draft.');
  }

  function startNewCourse() {
    const defaultSchoolId = schools[0]?.id || '';
    undoStack.current = [];
    redoStack.current = [];
    setForm(initialCourseForm(defaultSchoolId));
    setModules([{ id: uid('module'), title: 'Module 1', description: 'Main module', outcomes: ['Master this module outcomes.'], lessons: [makeLesson(1)], saved: false }]);
    setQuizBank([makeQuiz()]);
    setEditingCourseId(null);
    setRecoverableDraft(null);
    setModuleIndex(0);
    setLessonIndex(0);
    setSubLessonIndex(null);
    setCardIndex(0);
    setQuizIndex(0);
    setMode('manual');
    setStep('setup');
    setHistoryVersion((value) => value + 1);
    try {
      window.localStorage.removeItem(AUTOSAVE_KEY);
    } catch {
      // Clearing local recovery is best effort only.
    }
    autosaveReady.current = true;
    setMessage('Started a fresh course. The previous saved draft is no longer loaded here.');
  }

  function undoChange() {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(currentSnapshot());
    restoreSnapshot(previous);
    setHistoryVersion((value) => value + 1);
  }

  function redoChange() {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(currentSnapshot());
    restoreSnapshot(next);
    setHistoryVersion((value) => value + 1);
  }


  function setLessons(updater: (current: ManualLesson[]) => ManualLesson[]) {
    setModules((currentModules) => currentModules.map((module, index) => {
      if (index !== moduleIndex) return module;
      return { ...module, saved: false, lessons: updater(module.lessons) };
    }));
  }
  function resetBuilderSelection(nextModuleIndex: number, nextLessonIndex = 0) {
    setModuleIndex(nextModuleIndex);
    setLessonIndex(nextLessonIndex);
    setSubLessonIndex(null);
    setCardIndex(0);
  }

  function addModule() {
    recordHistory();

    const nextIndex = modules.length;
    const module: ManualModule = {
      id: uid('module'),
      title: `Module ${nextIndex + 1}`,
      description: 'Describe what this module covers.',
      outcomes: ['Complete this module successfully.'],
      lessons: [makeLesson(1)],
      saved: false,
    };

    setModules((current) => [...current, module]);
    resetBuilderSelection(nextIndex, 0);
  }

  function updateModule(index: number, patch: Partial<ManualModule>) {
    const module = modules[index];
    if (!module) return;

    recordHistory();

    setModules((current) =>
      current.map((item, moduleIdx) =>
        moduleIdx === index
          ? {
              ...item,
              ...patch,
              saved: false,
            }
          : item
      )
    );
  }

  function removeModule(index: number) {
    const module = modules[index];
    if (!module) return;

    if (modules.length <= 1) {
      setError('A course needs at least one module.');
      return;
    }

    recordHistory();

    const fallbackIndex = index > 0 ? index - 1 : index + 1;
    const nextActiveIndex = index > 0 ? index - 1 : 0;

    setModules((current) => {
      const removedModule = current[index];
      if (!removedModule) return current;

      return current
        .map((item, moduleIdx) => {
          if (moduleIdx !== fallbackIndex) return item;

          return {
            ...item,
            saved: false,
            lessons: [...item.lessons, ...removedModule.lessons],
          };
        })
        .filter((_, moduleIdx) => moduleIdx !== index);
    });

    resetBuilderSelection(nextActiveIndex, 0);
  }

  function reorderModule(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= modules.length) return;

    recordHistory();

    setModules((current) =>
      moveItem(current, fromIndex, toIndex).map((module, index) =>
        index === toIndex ? { ...module, saved: false } : module
      )
    );

    resetBuilderSelection(toIndex, 0);
  }

  function moveLessonToModule(lessonIndexToMove: number, targetModuleIndex: number) {
    if (targetModuleIndex === moduleIndex) return;

    const sourceModule = modules[moduleIndex];
    const targetModule = modules[targetModuleIndex];
    const lesson = sourceModule?.lessons[lessonIndexToMove];

    if (!sourceModule || !targetModule || !lesson) return;

    if (sourceModule.lessons.length <= 1) {
      setError('A module must always have at least one lesson.');
      return;
    }

    recordHistory();

    setModules((current) =>
      current.map((module, index) => {
        if (index === moduleIndex) {
          return {
            ...module,
            saved: false,
            lessons: module.lessons.filter((_, idx) => idx !== lessonIndexToMove),
          };
        }

        if (index === targetModuleIndex) {
          return {
            ...module,
            saved: false,
            lessons: [...module.lessons, { ...lesson, saved: false }],
          };
        }

        return module;
      })
    );

    resetBuilderSelection(targetModuleIndex, targetModule.lessons.length);
}

  function updateCardsForActiveTarget(updater: (cards: ManualCard[]) => ManualCard[]) {
  setLessons((current) =>
    current.map((lesson, index) => {
      if (index !== lessonIndex) return lesson;

      if (subLessonIndex == null) {
        return {
          ...lesson,
          saved: false,
          cards: updater(lesson.cards),
        };
      }

      return {
        ...lesson,
        saved: false,
        subLessons: lesson.subLessons.map((sub, subIndex) =>
          subIndex === subLessonIndex
            ? { ...sub, saved: false, cards: updater(sub.cards) }
            : sub
        ),
      };
    })
  );
  }
  function updateLesson(patch: Partial<ManualLesson>) {
    recordHistory();
    setLessons((current) => current.map((lesson, index) => (index === lessonIndex ? { ...lesson, ...patch, saved: false } : lesson)));
  }

  function updateForm(patch: Partial<CourseForm>) {
    recordHistory();
    setForm((current) => ({ ...current, ...patch }));
  }

  function addLesson() {
    recordHistory();
    const lesson = makeLesson(lessons.length + 1);
    setLessons((current) => [...current, lesson]);
    setLessonIndex(lessons.length);
    setCardIndex(0);
  }

  function duplicateLesson(index: number) {
    const lesson = lessons[index];
    if (!lesson) return;
    recordHistory();
    const copy: ManualLesson = {
      ...structuredClone(lesson),
      id: uid('lesson'),
      title: `${lesson.title || 'Lesson'} copy`,
      cards: lesson.cards.map((card) => ({ ...card, id: uid('card'), saved: false })),
      saved: false,
    };
    setLessons((current) => insertAt(current, index + 1, copy));
    setLessonIndex(index + 1);
    setCardIndex(0);
  }

  function removeLesson(index: number) {
    if (lessons.length <= 1) {
      setError('A course needs at least one lesson.');
      return;
    }
    recordHistory();
    setLessons((current) => current.filter((_, lessonIdx) => lessonIdx !== index));
    setLessonIndex((current) => Math.max(0, Math.min(current >= index ? current - 1 : current, lessons.length - 2)));
    setCardIndex(0);
  }

  function reorderLesson(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    recordHistory();
    setLessons((current) => moveItem(current, fromIndex, toIndex));
    setLessonIndex(toIndex);
    setCardIndex(0);
  }

  function addLessonTemplate() {
    recordHistory();
    const index = lessons.length + 1;
    const lesson = makeLesson(index);
    lesson.title = `Lesson ${index}: New topic`;
    lesson.cards = cardsFromSequence(CARD_SEQUENCES[0], lesson.title, 1);
    setLessons((current) => [...current, lesson]);
    setLessonIndex(lessons.length);
    setCardIndex(0);
  }

  function updateCard(patch: Partial<ManualCard>) {
    recordHistory();
    updateCardsForActiveTarget((cards) => cards.map((card, idx) => idx === cardIndex ? { ...card, ...patch, saved: false } : card));
  }

  function addCard(type: CardType) {
    recordHistory();
    const workflow = workflowTemplateForType(type);
    updateCardsForActiveTarget((cards) => [...cards, { ...makeCard(type, cards.length + 1), workflowTemplate: workflow }]);
    setCardIndex(activeCards.length);
  }

  function addWorkflowCard(template: CardWorkflowTemplate) {
    insertWorkflowCard(template, activeCards.length);
  }

  function insertWorkflowCard(template: CardWorkflowTemplate, targetIndex: number) {
    recordHistory();
    updateCardsForActiveTarget((cards) => insertAt(cards, clampIndex(targetIndex, cards.length), makeCardFromWorkflowTemplate(template, cards.length + 1)));
    setCardIndex(clampIndex(targetIndex, activeCards.length));
  }

  function addTemplateCard(template: LessonBlockTemplate) {
    insertTemplateCard(template, activeCards.length);
  }

  function insertTemplateCard(template: LessonBlockTemplate, targetIndex: number) {
    recordHistory();
    updateCardsForActiveTarget((cards) => insertAt(cards, clampIndex(targetIndex, cards.length), makeCardFromTemplate(template, cards.length + 1)));
    setCardIndex(clampIndex(targetIndex, activeCards.length));
  }

  function insertCards(cards: ManualCard[], targetIndex: number) {
    if (!cards.length) return;
    recordHistory();
    const safeIndex = clampIndex(targetIndex, activeCards.length);
    updateCardsForActiveTarget((currentCards) => [...currentCards.slice(0, safeIndex), ...cards, ...currentCards.slice(safeIndex)]);
    setCardIndex(safeIndex);
  }

  function replaceCard(index: number, card: ManualCard) {
    recordHistory();
    updateCardsForActiveTarget((cards) => cards.map((item, cardIdx) => cardIdx === index ? card : item));
    setCardIndex(index);
  }

  function replaceCardWithCards(index: number, cards: ManualCard[]) {
    if (!cards.length) return;
    recordHistory();
    updateCardsForActiveTarget((currentCards) => [...currentCards.slice(0, index), ...cards, ...currentCards.slice(index + 1)]);
    setCardIndex(index);
  }

  function reorderCard(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    recordHistory();
    updateCardsForActiveTarget((cards) => moveItem(cards, fromIndex, toIndex));
    setCardIndex(toIndex);
  }

  function duplicateCard(index: number) {
    const source = activeCards[index];
    if (!source) return;
    recordHistory();
    const copy = { ...source, id: uid('card'), title: `${source.title || 'Card'} copy`, saved: false };
    updateCardsForActiveTarget((cards) => insertAt(cards, index + 1, copy));
    setCardIndex(index + 1);
  }

  function removeCard(index: number) {
    if (activeCards.length <= 1) return;
    recordHistory();
    updateCardsForActiveTarget((cards) => cards.filter((_, cardIdx) => cardIdx !== index));
    setCardIndex(Math.max(0, Math.min(index, activeCards.length - 2)));
  }

  function updateQuiz(patch: Partial<QuizQuestion>) {
    recordHistory();
    setQuizBank((current) => current.map((quiz, index) => (index === quizIndex ? { ...quiz, ...patch } : quiz)));
  }

  function addQuiz() {
    recordHistory();
    setQuizBank((current) => [...current, makeQuiz()]);
    setQuizIndex(quizBank.length);
  }

  function duplicateQuiz(index: number) {
    const source = quizBank[index];
    if (!source) return;
    recordHistory();
    setQuizBank((current) => insertAt(current, index + 1, { ...source, id: uid('quiz'), question: `${source.question} copy` }));
    setQuizIndex(index + 1);
  }

  function removeQuiz(index: number) {
    if (quizBank.length <= 1) {
      setError('Keep at least one quiz question in the bank.');
      return;
    }
    recordHistory();
    setQuizBank((current) => current.filter((_, quizIdx) => quizIdx !== index));
    setQuizIndex((current) => Math.max(0, Math.min(current >= index ? current - 1 : current, quizBank.length - 2)));
  }

  function reorderQuiz(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    recordHistory();
    setQuizBank((current) => moveItem(current, fromIndex, toIndex));
    setQuizIndex(toIndex);
  }

  function bulkAddQuiz(raw: string) {
    const questions = quizFromBulkText(raw);
    if (!questions.length) return;
    recordHistory();
    setQuizBank((current) => [...current, ...questions]);
    setQuizIndex(quizBank.length);
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
      if (importedLessons.length) setModules([{ id: uid('module'), title: 'AI Module 1', description: 'Generated from AI draft', outcomes: [], lessons: importedLessons, saved: false }]);
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

  async function loadCourseIntoBuilder(courseId: string) {
    setLoadingCourseId(courseId);
    setError(null);
    setMessage(null);
    try {
      const [courseData, lessonData] = await Promise.all([
        getCourseById(courseId),
        getLessonsByCourse(courseId).catch(() => []),
      ]);

      if (!courseData) {
        setError('That course could not be loaded into the builder.');
        return;
      }

      setEditingCourseId(courseData.id);
      setForm({
        title: courseData.title || '',
        description: courseData.description || '',
        schoolId: courseData.schoolId || '',
        level: courseData.level || 'beginner',
        durationHours: String(courseData.durationHours ?? 8),
        entryFee: String(courseData.price ?? 0),
        currency: courseData.currency || 'ZMW',
        certificateFee: String(courseData.certificateFee ?? 0),
      });
      setModules(modulesFromCourse(lessonData));
      setQuizBank(quizBankFromLessons(lessonData));
      setLessonIndex(0);
      setCardIndex(0);
      setQuizIndex(0);
      setStep('setup');
      setMode('manual');
      setMessage(`Loaded ${courseData.title} into the builder. Saving now updates this draft.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load that course into the builder.');
    } finally {
      setLoadingCourseId(null);
    }
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
      const savedCourse = await saveShortCourseDraftWithBlueprint({
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

      setEditingCourseId(savedCourse.id);
      setCourses(await getCourses());
      setStep('preview');
      setMessage('Draft saved. Open Review & Publish to approve it.');
    } catch (cause) {
      setError(requestErrorMessage(cause, 'Unable to save draft.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading manual studio..." />;

  return (
    <div className="space-y-6">
      <Header mode={mode} step={step} setMode={setMode} setStep={setStep} saving={saving} saveDraft={saveDraft} stats={stats} canUndo={canUndo} canRedo={canRedo} undo={undoChange} redo={redoChange} editingCourseId={editingCourseId} startNewCourse={startNewCourse} />
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {recoverableDraft ? <RecoveryNotice draft={recoverableDraft} onResume={resumeRecoveredDraft} onStartNew={startNewCourse} /> : null}
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

      {mode === 'manual' ? (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <StudioNavigator step={step} setStep={setStep} lessons={lessons} lessonIndex={lessonIndex} setLessonIndex={setLessonIndex} setCardIndex={setCardIndex} readiness={readiness} quizCount={quizBank.length} />
          <div className="min-w-0">
            {step === 'setup' ? <SetupStep form={form} updateForm={updateForm} schools={schools} goNext={() => setStep('lessons')} courses={courses} editingCourseId={editingCourseId} onLoadCourse={loadCourseIntoBuilder} loadingCourseId={loadingCourseId} startNewCourse={startNewCourse} /> : null}
            {step === 'lessons' ? (
  <LessonsStep
    modules={modules}
    moduleIndex={moduleIndex}
    setModuleIndex={(index) => {
      setModuleIndex(index);
      setLessonIndex(0);
      setSubLessonIndex(null);
      setCardIndex(0);
    }}
    lessons={lessons}
    lessonIndex={lessonIndex}
    setLessonIndex={(index) => {
      setLessonIndex(index);
      setSubLessonIndex(null);
      setCardIndex(0);
    }}
    activeLesson={activeLesson}
    updateLesson={updateLesson}
    addLesson={addLesson}
    addLessonTemplate={addLessonTemplate}
    duplicateLesson={duplicateLesson}
    removeLesson={removeLesson}
    reorderLesson={reorderLesson}
    addModule={addModule}
    updateModule={updateModule}
    removeModule={removeModule}
    reorderModule={reorderModule}
    moveLessonToModule={moveLessonToModule}
    finish={() => setStep('cards')}
  />
) : null}
            {step === 'cards' ? <CardsStep form={form} modules={modules} moduleIndex={moduleIndex} setModuleIndex={setModuleIndex} lessons={lessons} lessonIndex={lessonIndex} setLessonIndex={setLessonIndex} subLessonIndex={subLessonIndex} setSubLessonIndex={setSubLessonIndex} activeLesson={activeLesson} activeSubLesson={activeSubLesson} cardIndex={cardIndex} setCardIndex={setCardIndex} activeCard={activeCard} addCard={addCard} addWorkflowCard={addWorkflowCard} insertWorkflowCard={insertWorkflowCard} addTemplateCard={addTemplateCard} insertTemplateCard={insertTemplateCard} insertCards={insertCards} replaceCard={replaceCard} replaceCardWithCards={replaceCardWithCards} reorderCard={reorderCard} duplicateCard={duplicateCard} removeCard={removeCard} updateCard={updateCard} finish={() => setStep('quiz')} /> : null}
            {step === 'quiz' ? <QuizStep quizBank={quizBank} quizIndex={quizIndex} setQuizIndex={setQuizIndex} activeQuiz={activeQuiz} updateQuiz={updateQuiz} addQuiz={addQuiz} duplicateQuiz={duplicateQuiz} removeQuiz={removeQuiz} reorderQuiz={reorderQuiz} bulkAddQuiz={bulkAddQuiz} finish={() => setStep('preview')} /> : null}
            {step === 'preview' ? <PreviewStep form={form} lesson={activeLesson} lessons={modules.flatMap((module) => module.lessons)} quizBank={quizBank} readiness={readiness} courses={courses} saveDraft={saveDraft} saving={saving} onLoadCourse={loadCourseIntoBuilder} loadingCourseId={loadingCourseId} editingCourseId={editingCourseId} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Header({ mode, step, setMode, setStep, saving, saveDraft, stats, canUndo, canRedo, undo, redo, editingCourseId, startNewCourse }: { mode: Mode; step: Step; setMode: (mode: Mode) => void; setStep: (step: Step) => void; saving: boolean; saveDraft: () => void; stats: BuilderStats; canUndo: boolean; canRedo: boolean; undo: () => void; redo: () => void; editingCourseId: string | null; startNewCourse: () => void }) {
  const activeStepIndex = Math.max(0, steps.findIndex((item) => item.id === step));
  return (
    <Card className="rounded-2xl border-primary/20 shadow-sm">
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase text-primary">Manual course studio</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">Build, preview, and save a short-course draft</h2>
              <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">{LESSON_BLOCK_TEMPLATE_COUNT} block starters</span>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">Course setup, lesson planning, card building, quiz writing, and final preview stay in one guided workspace. Save always creates a draft for review.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border bg-background p-1">
              <Button type="button" size="sm" variant={mode === 'manual' ? 'default' : 'ghost'} onClick={() => setMode('manual')}><BookOpen className="mr-2 size-4" />Manual</Button>
              <Button type="button" size="sm" variant={mode === 'ai' ? 'default' : 'ghost'} onClick={() => setMode('ai')}><Sparkles className="mr-2 size-4" />AI helper</Button>
            </div>
            <div className="inline-flex rounded-lg border bg-background p-1">
              <Button type="button" size="sm" variant="ghost" disabled={!canUndo} onClick={undo}><RotateCcw className="mr-2 size-4" />Undo</Button>
              <Button type="button" size="sm" variant="ghost" disabled={!canRedo} onClick={redo}><RotateCw className="mr-2 size-4" />Redo</Button>
            </div>
            <Button type="button" variant="outline" onClick={startNewCourse}><Plus className="mr-2 size-4" />New course</Button>
            <Button type="button" disabled={saving} onClick={saveDraft}><Save className="mr-2 size-4" />{saving ? 'Saving...' : editingCourseId ? 'Update draft' : 'Save draft'}</Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Layers3} label="Lessons" value={stats.lessons} />
          <Stat icon={LibraryBig} label="Cards" value={stats.cards} />
          <Stat icon={ListChecks} label="Quiz questions" value={stats.quizQuestions} />
          <Stat icon={FileText} label="Hours" value={stats.hours} />
        </div>
        {editingCourseId ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold">Editing an existing course draft</p>
            <p className="mt-1 text-muted-foreground">This builder is linked to a saved course. Save will update that course instead of creating a new one.</p>
          </div>
        ) : null}
        {mode === 'manual' ? (
          <div className="grid gap-2 md:grid-cols-5">
            {steps.map((item, index) => (
              <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`rounded-xl border p-3 text-left transition ${step === item.id ? 'border-primary bg-primary/10 text-primary' : index < activeStepIndex ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'hover:border-primary/50'}`}>
                <p className="flex items-center gap-2 text-sm font-semibold">{index < activeStepIndex ? <CheckCircle2 className="size-4" /> : <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-xs">{index + 1}</span>}{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RecoveryNotice({ draft, onResume, onStartNew }: { draft: BuilderSnapshot; onResume: () => void; onStartNew: () => void }) {
  const title = draft.form.title?.trim() || 'Untitled course draft';
  const lessonCount = draft.modules.reduce((count, module) => count + module.lessons.length, 0);
  const mode = draft.editingCourseId ? 'editing an existing course' : 'new course draft';

  return (
    <Card className="rounded-2xl border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Saved builder work found</p>
          <p className="text-sm text-muted-foreground">{title} - {lessonCount} lesson{lessonCount === 1 ? '' : 's'} - {mode}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onStartNew}><Plus className="mr-2 size-4" />Start new course</Button>
          <Button type="button" onClick={onResume}><RotateCcw className="mr-2 size-4" />Resume draft</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Layers3; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/25 px-3 py-2">
      <Icon className="size-4 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function StudioNavigator(props: { step: Step; setStep: (step: Step) => void; lessons: ManualLesson[]; lessonIndex: number; setLessonIndex: (index: number) => void; setCardIndex: (index: number) => void; readiness: ReadinessItem[]; quizCount: number }) {
  const { step, setStep, lessons, lessonIndex, setLessonIndex, setCardIndex, readiness, quizCount } = props;
  const readyCount = readiness.filter((item) => item.done).length;
  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Course map</CardTitle>
          <CardDescription>Move through the course in plain steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((item) => (
            <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`w-full rounded-xl border p-3 text-left text-sm transition ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}>
              <span className="font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
          <CardDescription>{lessons.length} lesson{lessons.length === 1 ? '' : 's'} in this course.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {lessons.map((lesson, index) => {
            const heavyCount = lesson.cards.filter((card) => learnerLoadForCard(card).level === 'heavy').length;
            return (
              <button key={lesson.id} type="button" onClick={() => { setLessonIndex(index); setCardIndex(0); setStep('cards'); }} className={`w-full rounded-xl border p-3 text-left text-sm transition ${index === lessonIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}>
                <span className="font-semibold">{lesson.title || `Lesson ${index + 1}`}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{lesson.cards.length} cards{heavyCount ? ` | ${heavyCount} heavy` : ''}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setStep('quiz')} className={`w-full rounded-xl border p-3 text-left text-sm transition ${step === 'quiz' ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}>
            <span className="font-semibold">Question bank</span>
            <span className="mt-1 block text-xs text-muted-foreground">{quizCount} question{quizCount === 1 ? '' : 's'}</span>
          </button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Ready to save</CardTitle>
          <CardDescription>{readyCount} of {readiness.length} checks complete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {readiness.map((item) => (
            <div key={item.label} className="flex gap-2 rounded-xl border bg-background p-2 text-xs">
              {item.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />}
              <div>
                <p className="font-medium">{item.label}</p>
                {item.detail ? <p className="mt-0.5 text-muted-foreground">{item.detail}</p> : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function SetupStep({ form, updateForm, schools, goNext, courses, editingCourseId, onLoadCourse, loadingCourseId, startNewCourse }: { form: CourseForm; updateForm: (patch: Partial<CourseForm>) => void; schools: School[]; goNext: () => void; courses: Course[]; editingCourseId: string | null; onLoadCourse: (courseId: string) => void; loadingCourseId: string | null; startNewCourse: () => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Course basics</CardTitle>
          <CardDescription>Name the course, choose its faculty, and define the learning level.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Course title"><Input value={form.title} onChange={(event) => updateForm({ title: event.target.value })} placeholder="Example: Introduction to Business Analytics" /></Field>
          <Field label="Course description"><Textarea rows={6} value={form.description} onChange={(event) => updateForm({ description: event.target.value })} placeholder="Describe what learners will be able to do by the end of the course." /></Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="School / Faculty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => updateForm({ schoolId: event.target.value })}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
            <Field label="Course difficulty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.level} onChange={(event) => updateForm({ level: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></Field>
            <Field label="Total course hours"><Input type="number" min={1} step={1} value={form.durationHours} onChange={(event) => updateForm({ durationHours: event.target.value })} /></Field>
          </div>
          <Button type="button" onClick={goNext}>Continue to lessons</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Keep both fees at 0 for a free course. These values can still be reviewed before publishing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entry fee"><Input type="number" min={0} value={form.entryFee} onChange={(event) => updateForm({ entryFee: event.target.value })} /></Field>
            <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => updateForm({ certificateFee: event.target.value })} /></Field>
          </div>
          <Field label="Currency"><Input value={form.currency} maxLength={3} onChange={(event) => updateForm({ currency: event.target.value.toUpperCase().slice(0, 3) })} /></Field>
          <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Save behavior</p>
            <p className="mt-1">Saving from this builder always creates or updates a draft, then sends it to Review & Publish.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function LessonsStep(props: {
  modules: ManualModule[];
  moduleIndex: number;
  setModuleIndex: (index: number) => void;
  lessons: ManualLesson[];
  lessonIndex: number;
  setLessonIndex: (index: number) => void;
  activeLesson: ManualLesson;
  updateLesson: (patch: Partial<ManualLesson>) => void;
  addLesson: () => void;
  addLessonTemplate: () => void;
  duplicateLesson: (index: number) => void;
  removeLesson: (index: number) => void;
  reorderLesson: (fromIndex: number, toIndex: number) => void;
  addModule: () => void;
  updateModule: (index: number, patch: Partial<ManualModule>) => void;
  removeModule: (index: number) => void;
  reorderModule: (fromIndex: number, toIndex: number) => void;
  moveLessonToModule: (lessonIndex: number, targetModuleIndex: number) => void;
  finish: () => void;
}) {
  const {
    modules,
    moduleIndex,
    setModuleIndex,
    lessons,
    lessonIndex,
    setLessonIndex,
    activeLesson,
    updateLesson,
    addLesson,
    addLessonTemplate,
    duplicateLesson,
    removeLesson,
    reorderLesson,
    addModule,
    updateModule,
    removeModule,
    reorderModule,
    moveLessonToModule,
    finish,
  } = props;

  const activeModule = modules[moduleIndex] ?? modules[0];

  const addSubLesson = () =>
    updateLesson({
      subLessons: [
        ...activeLesson.subLessons,
        {
          id: uid('sublesson'),
          title: `Sub-lesson ${activeLesson.subLessons.length + 1}`,
          summary: '',
          cards: [],
          saved: false,
        },
      ],
    });

  const updateSubLesson = (index: number, patch: Partial<SubLesson>) =>
    updateLesson({
      subLessons: activeLesson.subLessons.map((sub, i) =>
        i === index ? { ...sub, ...patch, saved: false } : sub
      ),
    });

  const removeSubLesson = (index: number) =>
    updateLesson({
      subLessons: activeLesson.subLessons.filter((_, i) => i !== index),
    });
  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <div className="space-y-2">
          <Label>Module</Label>
          <div className="flex flex-wrap gap-2">{modules.map((module, index) => <Button key={module.id} type="button" size="sm" variant={index === moduleIndex ? 'default' : 'outline'} onClick={() => { setModuleIndex(index); setLessonIndex(0); }}>{module.title || `Module ${index + 1}`}</Button>)}</div>
        </div>
      
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Lessons</CardTitle><CardDescription>Treat lessons like chapters. Keep each one focused.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {lessons.map((lesson, index) => {
            const heavy = lesson.cards.filter((card) => learnerLoadForCard(card).level === 'heavy').length;
            return (
              <div key={lesson.id} className={`rounded-xl border p-3 text-sm transition ${index === lessonIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}>
                <button type="button" onClick={() => setLessonIndex(index)} className="w-full text-left">
                  <p className="font-semibold">{lesson.title || `Lesson ${index + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{lesson.cards.length} cards | {lesson.outcomes.length} outcomes{heavy ? ` | ${heavy} heavy` : ''}</p>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderLesson(index, index - 1)}>Move up</Button>
                  <Button type="button" size="sm" variant="ghost" disabled={index === lessons.length - 1} onClick={() => reorderLesson(index, index + 1)}>Move down</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => duplicateLesson(index)}><Copy className="mr-1 size-3" />Copy</Button>
                  <Button type="button" size="sm" variant="ghost" disabled={lessons.length <= 1} onClick={() => removeLesson(index)} className="text-destructive hover:text-destructive"><Trash2 className="mr-1 size-3" />Delete</Button>
                </div>
              </div>
            );
          })}
          <div className="grid gap-2">
            <Button type="button" variant="outline" className="w-full" onClick={addLesson}><Plus className="mr-2 size-4" />Blank lesson</Button>
            <Button type="button" className="w-full" onClick={addLessonTemplate}><Sparkles className="mr-2 size-4" />Lesson from template</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Edit lesson {lessonIndex + 1}</CardTitle>
          <CardDescription>This creates the lesson page learners will move through before the quiz bank.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Lesson title"><Input value={activeLesson.title} onChange={(event) => updateLesson({ title: event.target.value })} /></Field>
          <Field label="Lesson summary"><Textarea rows={4} value={activeLesson.summary} onChange={(event) => updateLesson({ summary: event.target.value })} /></Field>
          <Field label="Learning outcomes, one per line"><Textarea rows={4} value={activeLesson.outcomes.join('\n')} onChange={(event) => updateLesson({ outcomes: lines(event.target.value) })} /></Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sub-lessons</Label>
              <Button type="button" size="sm" variant="outline" onClick={addSubLesson}>Add sub-lesson</Button>
            </div>
            <div className="space-y-2">
              {activeLesson.subLessons.map((sub, index) => <div key={sub.id} className="rounded-xl border p-2"><div className="flex gap-2"><Input value={sub.title} onChange={(event) => updateSubLesson(index, { title: event.target.value })} /><Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeSubLesson(index)}>Delete</Button></div><Textarea rows={2} className="mt-2" value={sub.summary} onChange={(event) => updateSubLesson(index, { summary: event.target.value })} /></div>)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addLesson}>Add another lesson</Button>
            <Button type="button" onClick={finish}>Build cards</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardsStep(props: { form: CourseForm; modules: ManualModule[]; moduleIndex: number; setModuleIndex: (index: number) => void; lessons: ManualLesson[]; lessonIndex: number; setLessonIndex: (index: number) => void; subLessonIndex: number | null; setSubLessonIndex: (index: number | null) => void; activeLesson: ManualLesson; activeSubLesson: SubLesson | null; cardIndex: number; setCardIndex: (index: number) => void; activeCard: ManualCard; addCard: (type: CardType) => void; addWorkflowCard: (template: CardWorkflowTemplate) => void; insertWorkflowCard: (template: CardWorkflowTemplate, index: number) => void; addTemplateCard: (template: LessonBlockTemplate) => void; insertTemplateCard: (template: LessonBlockTemplate, index: number) => void; insertCards: (cards: ManualCard[], index: number) => void; replaceCard: (index: number, card: ManualCard) => void; replaceCardWithCards: (index: number, cards: ManualCard[]) => void; reorderCard: (fromIndex: number, toIndex: number) => void; duplicateCard: (index: number) => void; removeCard: (index: number) => void; updateCard: (patch: Partial<ManualCard>) => void; finish: () => void }) {
  const { form, modules, moduleIndex, setModuleIndex, lessons, lessonIndex, setLessonIndex, subLessonIndex, setSubLessonIndex, activeLesson, activeSubLesson, cardIndex, setCardIndex, activeCard, addWorkflowCard, insertWorkflowCard, addTemplateCard, insertTemplateCard, insertCards, replaceCard, replaceCardWithCards, reorderCard, duplicateCard, removeCard, updateCard, finish } = props;
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [quickCommand, setQuickCommand] = useState('');
  const readability = learnerLoadForCard(activeCard);
  const filteredTemplates = useMemo(() => {
    const needle = templateSearch.trim().toLowerCase();
    return LESSON_BLOCK_TEMPLATES.filter((template) => {
      const categoryMatch = templateCategory === 'All' || template.category === templateCategory;
      if (!categoryMatch) return false;
      if (!needle) return true;
      return `${template.label} ${template.help} ${template.category} ${template.subjectArea} ${template.teachingMove} ${template.type} ${template.title}`.toLowerCase().includes(needle);
    });
  }, [templateCategory, templateSearch]);
  const visibleTemplates = filteredTemplates.slice(0, 120);
  const selectedWorkflow = CARD_WORKFLOW_TEMPLATES.find((template) => template.id === activeCard.workflowTemplate) ?? CARD_WORKFLOW_TEMPLATES.find((template) => template.id === workflowTemplateForType(activeCard.type)) ?? CARD_WORKFLOW_TEMPLATES[0];

  function onTemplateDragStart(event: DragEvent<HTMLElement>, template: CardWorkflowTemplate) {
    event.dataTransfer.setData('application/x-univai-card-template', template.id);
    event.dataTransfer.effectAllowed = 'copy';
  }

  function onLibraryDragStart(event: DragEvent<HTMLElement>, template: LessonBlockTemplate) {
    event.dataTransfer.setData('application/x-univai-library-template', template.id);
    event.dataTransfer.effectAllowed = 'copy';
  }

  function onCardDragStart(event: DragEvent<HTMLElement>, index: number) {
    event.dataTransfer.setData('application/x-univai-card-index', String(index));
    event.dataTransfer.effectAllowed = 'move';
  }

  function onCanvasDrop(event: DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();
    setDragOverIndex(null);
    const workflowId = event.dataTransfer.getData('application/x-univai-card-template') as CardWorkflowTemplateId;
    const libraryId = event.dataTransfer.getData('application/x-univai-library-template');
    const cardIndexValue = event.dataTransfer.getData('application/x-univai-card-index');
    if (workflowId) {
      const template = CARD_WORKFLOW_TEMPLATES.find((item) => item.id === workflowId);
      if (template) insertWorkflowCard(template, targetIndex);
      return;
    }
    if (libraryId) {
      const template = LESSON_BLOCK_TEMPLATES.find((item) => item.id === libraryId);
      if (template) insertTemplateCard(template, targetIndex);
      return;
    }
    if (cardIndexValue !== '') {
      const fromIndex = Number(cardIndexValue);
      if (Number.isFinite(fromIndex)) reorderCard(fromIndex, targetIndex > fromIndex ? targetIndex - 1 : targetIndex);
    }
  }

  function runQuickCommand() {
    const targetCards = activeSubLesson?.cards ?? activeLesson.cards;
    const cards = cardsFromQuickCommand(quickCommand, targetCards.length + 1);
    if (!cards.length) return;
    insertCards(cards, targetCards.length);
    setQuickCommand('');
  }

  function insertSequence(sequence: CardSequence) {
    const targetCards = activeSubLesson?.cards ?? activeLesson.cards;
    insertCards(cardsFromSequence(sequence, quickCommand || activeLesson.title, targetCards.length + 1), targetCards.length);
    setQuickCommand('');
  }

  function transformSelected(templateId: CardWorkflowTemplateId) {
    replaceCard(cardIndex, transformCard(activeCard, templateId));
  }

  function splitSelectedCard() {
    replaceCardWithCards(cardIndex, splitCard(activeCard, cardIndex + 1));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
      <Card className="rounded-2xl xl:sticky xl:top-4 xl:self-start">
        <CardHeader>
          <CardTitle>Blocks</CardTitle>
          <CardDescription>Drag a block into the lesson canvas or click to append it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-primary/5 p-3">
            <Label className="text-xs">Quick compose</Label>
            <Textarea
              className="mt-2"
              rows={2}
              value={quickCommand}
              onChange={(event) => setQuickCommand(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runQuickCommand();
              }}
              placeholder="teach compound interest with example and checkpoint"
            />
            <Button type="button" size="sm" className="mt-2 w-full" onClick={runQuickCommand} disabled={!quickCommand.trim()}>
              <Wand2 className="mr-2 size-4" />
              Make cards
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Advanced blocks</p>
            <Input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search blocks..." />
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}>
              {LESSON_BLOCK_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {visibleTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  draggable
                  onDragStart={(event) => onLibraryDragStart(event, template)}
                  onClick={() => addTemplateCard(template)}
                  className="w-full rounded-xl border p-3 text-left text-xs transition hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{template.label}</span>
                    <GripVertical className="size-4 text-muted-foreground" />
                  </span>
                  <span className="mt-1 line-clamp-2 text-muted-foreground">{template.help}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Saved patterns</p>
            {CARD_SEQUENCES.map((sequence) => (
              <button key={sequence.id} type="button" onClick={() => insertSequence(sequence)} className="rounded-xl border bg-background p-3 text-left text-xs transition hover:border-primary hover:bg-primary/5">
                <span className="font-semibold">{sequence.label}</span>
                <span className="mt-1 block text-muted-foreground">{sequence.help}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Single blocks</p>
            {CARD_WORKFLOW_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                draggable
                onDragStart={(event) => onTemplateDragStart(event, template)}
                onClick={() => addWorkflowCard(template)}
                className="group rounded-xl border bg-background p-3 text-left text-xs transition hover:border-primary hover:bg-primary/5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{template.label}</span>
                  <GripVertical className="size-4 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-muted-foreground">{template.help}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Lesson canvas</CardTitle>
          <CardDescription>Drag blocks from the palette, reorder cards, then edit the selected card.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Module</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">{modules.map((module, index) => <Button key={module.id} type="button" size="sm" variant={index === moduleIndex ? 'default' : 'outline'} onClick={() => { setModuleIndex(index); setLessonIndex(0); setSubLessonIndex(null); setCardIndex(0); }}>{module.title || `Module ${index + 1}`}</Button>)}</div>
          </div>
          <div className="space-y-2">
            <Label>Lesson</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">{lessons.map((lesson, index) => <Button key={lesson.id} type="button" size="sm" variant={index === lessonIndex ? 'default' : 'outline'} onClick={() => { setLessonIndex(index); setCardIndex(0); }}>{lesson.title || `Lesson ${index + 1}`}</Button>)}</div>
          </div>
          <div className="space-y-2">
            <Label>Target</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={subLessonIndex == null ? 'default' : 'outline'} onClick={() => { setSubLessonIndex(null); setCardIndex(0); }}>Lesson cards</Button>
              {activeLesson.subLessons.map((sub, index) => <Button key={sub.id} type="button" size="sm" variant={subLessonIndex === index ? 'default' : 'outline'} onClick={() => { setSubLessonIndex(index); setCardIndex(0); }}>{sub.title || `Sub-lesson ${index + 1}`}</Button>)}
            </div>
          </div>
          <div
            className="space-y-2 rounded-2xl border bg-muted/20 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onCanvasDrop(event, (activeSubLesson?.cards ?? activeLesson.cards).length)}
          >
            {(activeSubLesson?.cards ?? activeLesson.cards).map((card, index) => {
              const cardLoad = learnerLoadForCard(card);
              return (
                <div key={card.id}>
                  <div
                    className={`h-2 rounded-full transition ${dragOverIndex === index ? 'bg-primary/40' : 'bg-transparent'}`}
                    onDragOver={(event) => { event.preventDefault(); setDragOverIndex(index); }}
                    onDrop={(event) => onCanvasDrop(event, index)}
                  />
                  <article
                    draggable={index !== cardIndex}
                    onDragStart={(event) => onCardDragStart(event, index)}
                    onDragEnd={() => setDragOverIndex(null)}
                    onClick={() => setCardIndex(index)}
                    className={`group grid cursor-pointer gap-3 rounded-xl border bg-background p-3 text-left transition hover:border-primary/50 md:grid-cols-[auto_1fr_auto] ${index === cardIndex ? 'border-primary bg-primary/5 shadow-sm' : ''}`}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="size-5" />
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">{(card.workflowTemplate || workflowTemplateForType(card.type)).replace(/_/g, ' ')}</span>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-medium capitalize ${cardLoad.level === 'heavy' ? 'bg-amber-100 text-amber-800' : cardLoad.level === 'medium' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-800'}`}>{cardLoad.level}</span>
                      </div>
                      {index === cardIndex ? (
                        <InlineCardEditor card={card} updateCard={updateCard} />
                      ) : (
                        <>
                          <p className="mt-2 truncate text-sm font-semibold">{card.title || `Card ${index + 1}`}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{cardPreviewText(card)}</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 self-start">
                      <Button type="button" size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); duplicateCard(index); }}><Copy className="size-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" disabled={(activeSubLesson?.cards ?? activeLesson.cards).length <= 1} onClick={(event) => { event.stopPropagation(); removeCard(index); }}><Trash2 className="size-4" /></Button>
                    </div>
                  </article>
                </div>
              );
            })}
            <div
              className={`rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground transition ${dragOverIndex === (activeSubLesson?.cards ?? activeLesson.cards).length ? 'border-primary bg-primary/5 text-primary' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragOverIndex((activeSubLesson?.cards ?? activeLesson.cards).length); }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(event) => onCanvasDrop(event, (activeSubLesson?.cards ?? activeLesson.cards).length)}
            >
              Drop a block here to add it to the end
            </div>
          </div>
          {readability.level === 'heavy' ? (
            <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <p>This card is heavy. Split it into smaller cards or move source problems, criteria, and notes into the guided advanced sections.</p>
                <Button type="button" size="sm" variant="outline" className="mt-2 border-amber-300 bg-white" onClick={splitSelectedCard}>
                  <Scissors className="mr-2 size-4" />
                  Split heavy card
                </Button>
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl border bg-muted/20 p-3">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Selected block</p>
                <p className="text-xs text-muted-foreground">{selectedWorkflow.label}: {selectedWorkflow.focus}</p>
              </div>
              <ReadabilityMeter load={readability} />
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => transformSelected('teach')}><Edit3 className="mr-2 size-4" />Teach</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => transformSelected('example')}>Make Example</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => transformSelected('checkpoint')}>Make Checkpoint</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => transformSelected('summary')}>Make Summary</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => replaceCard(cardIndex, shortenCard(activeCard))}>Shorten</Button>
              <Button type="button" size="sm" variant="outline" onClick={splitSelectedCard}><Scissors className="mr-2 size-4" />Split</Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {CARD_WORKFLOW_TEMPLATES.map((template) => (
                <button key={template.id} type="button" onClick={() => updateCard({ ...makeCardFromWorkflowTemplate(template, cardIndex + 1), id: activeCard.id, saved: false })} className={`rounded-xl border p-3 text-left text-xs transition ${activeCard.workflowTemplate === template.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:border-primary/50'}`}>
                  <span className="block font-semibold">{template.label}</span>
                  <span className="mt-1 block text-muted-foreground">{template.help}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <Field label="Advanced block type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeCard.type} onChange={(event) => updateCard({ type: event.target.value as CardType, workflowTemplate: workflowTemplateForType(event.target.value) })}>{!cardTypeOptions.some(([value]) => value === activeCard.type) ? <option value={activeCard.type}>{activeCard.type.replace(/_/g, ' ')}</option> : null}{cardTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Card title"><Input value={activeCard.title} onChange={(event) => updateCard({ title: event.target.value })} /></Field>
          </div>
          {activeCard.templateLabel ? <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Started from {activeCard.templateLabel}</p> : null}
          <CardFields card={activeCard} updateCard={updateCard} />
          <AdvancedSection title="Media" icon={ImageIcon} defaultOpen={activeCard.workflowTemplate === 'visual' || Boolean(activeCard.imageUrl)}>
            <ImageFields card={activeCard} updateCard={updateCard} />
          </AdvancedSection>
          <AdvancedSection title="Math / visual" icon={Eye} defaultOpen={activeCard.workflowTemplate === 'visual' || activeCard.mathTool !== 'none'}>
            <MathFields card={activeCard} updateCard={updateCard} />
          </AdvancedSection>
          <AdvancedSection title="Classroom thread" icon={Layers3} defaultOpen={Boolean(activeCard.boardId || activeCard.sourceQuestion)}>
            <ClassroomThreadFields card={activeCard} updateCard={updateCard} />
          </AdvancedSection>
          <AdvancedSection title="Teacher reasoning and metadata" icon={FileText} defaultOpen={Boolean(activeCard.subjectArea || activeCard.teacherNote)}>
            <MetadataFields card={activeCard} updateCard={updateCard} />
          </AdvancedSection>
          <Button type="button" onClick={finish}>Finish cards</Button>
        </CardContent>
      </Card>

      <div className="space-y-6 xl:sticky xl:top-4 xl:self-start">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Live student preview</CardTitle></CardHeader>
          <CardContent><LessonPlayer lesson={lessonPreview(activeLesson, form)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

function CardFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  if (card.type === 'question') {
    return <><Field label="Question"><Textarea rows={3} value={card.question || ''} onChange={(event) => updateCard({ question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={4} value={card.options || ''} onChange={(event) => updateCard({ options: event.target.value })} /></Field><Field label="Correct answer"><Input value={card.answer || ''} onChange={(event) => updateCard({ answer: event.target.value })} /></Field><Field label="Answer guidance"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field></>;
  }
  if (card.type === 'fill_blank') {
    return <><Field label="Fill-in text"><Textarea rows={3} value={card.text || ''} onChange={(event) => updateCard({ text: event.target.value })} placeholder="Complete this: ____" /></Field><Field label="Correct answer"><Input value={card.answer || ''} onChange={(event) => updateCard({ answer: event.target.value })} /></Field><Field label="Answer guidance"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field></>;
  }
  if (card.type === 'true_false') {
    return <><Field label="Statement"><Textarea rows={3} value={card.statement || ''} onChange={(event) => updateCard({ statement: event.target.value })} /></Field><Field label="Correct answer"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={(card.answer || 'true').toLowerCase()} onChange={(event) => updateCard({ answer: event.target.value })}><option value="true">True</option><option value="false">False</option></select></Field><Field label="Answer guidance"><Textarea rows={3} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field></>;
  }
  if (card.type === 'flashcard') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Front"><Textarea rows={4} value={card.front || ''} onChange={(event) => updateCard({ front: event.target.value })} /></Field>
        <Field label="Back"><Textarea rows={4} value={card.back || ''} onChange={(event) => updateCard({ back: event.target.value })} /></Field>
      </div>
    );
  }
  if (card.workflowTemplate === 'practice_task' || ['practice_task', 'mini_project', 'capstone_prompt'].includes(card.type)) {
    return <><Field label="Task prompt"><Textarea rows={4} value={card.prompt || ''} onChange={(event) => updateCard({ prompt: event.target.value })} /></Field><Field label="Success criteria, one per line"><Textarea rows={4} value={card.criteria || ''} onChange={(event) => updateCard({ criteria: event.target.value })} /></Field></>;
  }
  if (card.workflowTemplate === 'case_scenario' || ['case_study', 'scenario'].includes(card.type)) {
    return <><Field label="Scenario context"><Textarea rows={5} value={card.body} onChange={(event) => updateCard({ body: event.target.value })} /></Field><Field label="Guided question"><Textarea rows={3} value={card.prompt || ''} onChange={(event) => updateCard({ prompt: event.target.value })} /></Field><Field label="Decision criteria, one per line"><Textarea rows={3} value={card.criteria || ''} onChange={(event) => updateCard({ criteria: event.target.value })} /></Field></>;
  }
  return (
    <>
      <Field label={card.workflowTemplate === 'summary' ? 'Key takeaways' : card.workflowTemplate === 'example' ? 'Worked example' : 'Core learner text'}><Textarea rows={5} value={card.body} onChange={(event) => updateCard({ body: event.target.value })} /></Field>
      <Field label="Supporting list, steps, or glossary lines"><Textarea rows={4} value={card.items || ''} onChange={(event) => updateCard({ items: event.target.value })} /></Field>
    </>
  );
}

function InlineCardEditor({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  const field = primaryTextField(card);
  return (
    <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
      <Input value={card.title || ''} onChange={(event) => updateCard({ title: event.target.value })} placeholder="Card title" className="h-9 bg-background font-medium" />
      <Textarea
        rows={3}
        value={String(card[field] || '')}
        onChange={(event) => updateCard({ [field]: event.target.value } as Partial<ManualCard>)}
        placeholder="Write learner-facing content..."
        className="bg-background text-sm"
      />
      <p className="text-[11px] text-muted-foreground">Inline edit. Use the detailed fields below for answers, visuals, and advanced settings.</p>
    </div>
  );
}

function primaryTextField(card: ManualCard): keyof ManualCard {
  if (card.type === 'question') return 'question';
  if (card.type === 'fill_blank') return 'text';
  if (card.type === 'true_false') return 'statement';
  if (card.type === 'flashcard') return 'front';
  if (card.workflowTemplate === 'practice_task') return 'prompt';
  return 'body';
}

function ReadabilityMeter({ load }: { load: LearnerLoad }) {
  return (
    <div className="min-w-[160px] rounded-xl border bg-background px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">Learner load</span>
        <span className={`font-semibold capitalize ${load.level === 'heavy' ? 'text-amber-700' : load.level === 'medium' ? 'text-primary' : 'text-emerald-700'}`}>{load.level}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${load.level === 'heavy' ? 'bg-amber-500' : load.level === 'medium' ? 'bg-primary' : 'bg-emerald-500'}`} style={{ width: `${load.percent}%` }} />
      </div>
      <p className="mt-1 text-muted-foreground">{load.hint}</p>
    </div>
  );
}

function AdvancedSection({ title, icon: Icon, defaultOpen = false, children }: { title: string; icon: typeof Layers3; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="rounded-2xl border bg-background" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  );
}

function MetadataFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Learner prompt"><Textarea rows={3} value={card.prompt || ''} onChange={(event) => updateCard({ prompt: event.target.value })} /></Field>
      <Field label="Quality criteria"><Textarea rows={3} value={card.criteria || ''} onChange={(event) => updateCard({ criteria: event.target.value })} /></Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Subject area"><Input value={card.subjectArea || ''} onChange={(event) => updateCard({ subjectArea: event.target.value })} /></Field>
        <Field label="Teaching move"><Input value={card.teachingMove || ''} onChange={(event) => updateCard({ teachingMove: event.target.value })} /></Field>
      </div>
      <Field label="Teacher reasoning"><Textarea rows={3} value={card.teacherNote || ''} onChange={(event) => updateCard({ teacherNote: event.target.value })} /></Field>
    </div>
  );
}

function MathFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div>
        <p className="font-semibold">Math / visual inside this card</p>
        <p className="text-sm text-muted-foreground">Pick a visual starter, then adjust only the fields you need. Leave graph bounds blank for automatic axes.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ mathTool: 'equation', equation: card.equation || 'y = mx + c' })}>Equation</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ mathTool: 'graph', graphMode: 'function', expression: card.expression || 'x', xMin: undefined, xMax: undefined, min: undefined, max: undefined })}>Function graph</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ mathTool: 'graph', graphMode: 'point', graphPointX: card.graphPointX || '-5', graphPointY: card.graphPointY || '2', xMin: undefined, xMax: undefined, min: undefined, max: undefined })}>Plot point</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ mathTool: 'table', columns: card.columns || 'Item, Value, Reason', rows: card.rows || 'Example, 1, Explain why' })}>Table</Button>
      </div>
      <Field label="Math tool">
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={card.mathTool} onChange={(event) => updateCard({ mathTool: event.target.value as MathTool })}>
          <option value="none">No math visual</option>
          <option value="equation">Equation</option>
          <option value="graph">Graph</option>
          <option value="table">Table</option>
          <option value="formula_sheet">Formula sheet</option>
          <option value="number_line">Number line</option>
          <option value="venn">Venn diagram</option>
        </select>
      </Field>
      {card.mathTool === 'equation' ? <><Field label="Equation"><Input value={card.equation || ''} onChange={(event) => updateCard({ equation: event.target.value })} placeholder="x^2 + y^2 = r^2" /></Field><div className="rounded-xl border bg-muted/30 p-3 text-center"><MathText text={`$${card.equation || ''}$`} /></div></> : null}
      {card.mathTool === 'graph' ? (
        <div className="space-y-4 rounded-xl border bg-muted/20 p-3">
          <Field label="Graph mode">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={card.graphMode || 'function'} onChange={(event) => updateCard({ graphMode: event.target.value as 'function' | 'point' })}>
              <option value="function">Draw function/curve</option>
              <option value="point">Plot one point for this classroom step</option>
            </select>
          </Field>
          {(card.graphMode || 'function') === 'function' ? (
            <div className="grid gap-3">
              <Field label="Function"><Input value={card.expression || ''} onChange={(event) => updateCard({ expression: event.target.value })} placeholder="x^2" /></Field>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Point x"><Input value={card.graphPointX || ''} onChange={(event) => updateCard({ graphPointX: event.target.value })} placeholder="-2" /></Field>
              <Field label="Point y"><Input value={card.graphPointY || ''} onChange={(event) => updateCard({ graphPointY: event.target.value })} placeholder="4" /></Field>
              <Field label="Point label"><Input value={card.graphPointLabel || ''} onChange={(event) => updateCard({ graphPointLabel: event.target.value })} placeholder="(-2, 4)" /></Field>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(card.showGraphLine)} onChange={(event) => updateCard({ showGraphLine: event.target.checked })} /> Connect plotted points on this step</label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ xMin: undefined, xMax: undefined, min: undefined, max: undefined })}>Auto axes</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ xMin: '-10', xMax: '10', min: '-10', max: '10' })}>Standard</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ xMin: '0', xMax: '10', min: '0', max: '10' })}>Positive</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ xMin: '-100', xMax: '100', min: '-100', max: '100' })}>Wide</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="X min"><Input inputMode="decimal" value={card.xMin || ''} onChange={(event) => updateCard({ xMin: event.target.value })} placeholder="auto or -25" /></Field>
              <Field label="X max"><Input inputMode="decimal" value={card.xMax || ''} onChange={(event) => updateCard({ xMax: event.target.value })} placeholder="auto or 25" /></Field>
              <Field label="Y min"><Input inputMode="decimal" value={card.min || ''} onChange={(event) => updateCard({ min: event.target.value })} placeholder="auto or -5" /></Field>
              <Field label="Y max"><Input inputMode="decimal" value={card.max || ''} onChange={(event) => updateCard({ max: event.target.value })} placeholder="auto or 50" /></Field>
            </div>
            <p className="text-xs text-muted-foreground">Blank bounds use automatic scaling. Negative values, decimals, and large ranges are allowed.</p>
          </div>
        </div>
      ) : null}
      {card.mathTool === 'venn' ? (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
          <Field label="Set count"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={(card as any).vennSetCount || '2'} onChange={(event) => updateCard({ vennSetCount: event.target.value } as Partial<ManualCard>)}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></Field>
          <Field label="Labels (comma-separated)"><Input value={(card as any).vennLabels || 'A,B,C'} onChange={(event) => updateCard({ vennLabels: event.target.value } as Partial<ManualCard>)} /></Field>
          <Field label="Highlight"><Input value={(card as any).vennHighlight || 'none'} onChange={(event) => updateCard({ vennHighlight: event.target.value } as Partial<ManualCard>)} placeholder="intersection" /></Field>
          <Field label="Description"><Input value={(card as any).vennDescription || ''} onChange={(event) => updateCard({ vennDescription: event.target.value } as Partial<ManualCard>)} /></Field>
        </div>
      ) : null}
      {card.mathTool === 'table' ? (
        <>
          <Field label="Columns, comma separated"><Input value={card.columns || ''} onChange={(event) => updateCard({ columns: event.target.value })} placeholder="Account, Debit, Credit, Reason" /></Field>
          <Field label="Rows, one row per line"><Textarea rows={4} value={card.rows || ''} onChange={(event) => updateCard({ rows: event.target.value })} placeholder={'Cash, 1000, , Asset increased\nCapital, , 1000, Owner invested'} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(card.cumulativeTable)} onChange={(event) => updateCard({ cumulativeTable: event.target.checked })} /> Keep adding rows from earlier cards in this classroom thread</label>
        </>
      ) : null}
      {card.mathTool === 'formula_sheet' ? <Field label="Formulas: name | formula | description"><Textarea rows={5} value={card.formulas || ''} onChange={(event) => updateCard({ formulas: event.target.value })} /></Field> : null}
      {card.mathTool === 'number_line' ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
          <Field label="Min"><Input inputMode="decimal" value={card.min || ''} onChange={(event) => updateCard({ min: event.target.value })} placeholder="-5" /></Field>
          <Field label="Max"><Input inputMode="decimal" value={card.max || ''} onChange={(event) => updateCard({ max: event.target.value })} placeholder="5" /></Field>
          <Field label="Points"><Input value={card.points || ''} onChange={(event) => updateCard({ points: event.target.value })} placeholder="-2, 0, 3" /></Field>
          </div>
          <Field label="Intervals (one per line: start,end,startEndpoint,endEndpoint,label)">
            <Textarea
              rows={4}
              value={card.intervals || ''}
              onChange={(event) => updateCard({ intervals: event.target.value })}
              placeholder={'2,,closed,open,x ≥ 2\n-3,4,open,closed,-3 < x ≤ 4\n,5,open,closed,(-∞, 5]'}
            />
          </Field>
          <p className="text-xs text-muted-foreground">Use blank start/end for infinity. Endpoint values: open or closed.</p><Button type="button" size="sm" variant="outline" onClick={() => updateCard({ intervals: `${card.intervals ? `${card.intervals}\n` : ''}2,7,closed,open,2 ≤ x < 7` })}>Add sample interval</Button>
        </div>
      ) : null}
    </div>
  );
}

function ClassroomThreadFields({ card, updateCard }: { card: ManualCard; updateCard: (patch: Partial<ManualCard>) => void }) {
  const makeThreadId = (kind: string) => `${kind}-${Date.now().toString(36).slice(-5)}`;
  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="font-semibold">Classroom teaching thread</p>
        <p className="text-sm text-muted-foreground">Use a thread when several cards explain the same long problem, graph, accounting question, or case step by step.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ boardId: card.boardId || makeThreadId('graph'), keepSourceVisible: true, mathTool: card.mathTool === 'none' ? 'graph' : card.mathTool, graphMode: card.graphMode || 'point' })}>Graph problem</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ boardId: card.boardId || makeThreadId('accounting'), keepSourceVisible: true, mathTool: card.mathTool === 'none' ? 'table' : card.mathTool, columns: card.columns || 'Account, Debit, Credit, Reason' })}>Accounting board</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ boardId: card.boardId || makeThreadId('case'), keepSourceVisible: true, workflowTemplate: 'case_scenario' })}>Case thread</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => updateCard({ boardId: '', sourceQuestion: '', extractedData: '', teacherNote: '', keepSourceVisible: undefined })}>Clear thread</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Thread ID"><Input value={card.boardId || ''} onChange={(event) => updateCard({ boardId: event.target.value })} placeholder="sets-question-1 or trial-balance-1" /></Field>
        <label className="flex items-center gap-2 pt-8 text-sm"><input type="checkbox" checked={card.keepSourceVisible !== false} onChange={(event) => updateCard({ keepSourceVisible: event.target.checked })} /> Keep original question visible</label>
      </div>
      <Field label="Original long question / source problem"><Textarea rows={5} value={card.sourceQuestion || ''} onChange={(event) => updateCard({ sourceQuestion: event.target.value })} placeholder="Paste the full accounting, graphing, physics or business question here. Later cards with the same Thread ID will keep showing it." /></Field>
      <Field label="Data collected from the question, one per line"><Textarea rows={3} value={card.extractedData || ''} onChange={(event) => updateCard({ extractedData: event.target.value })} placeholder="u = 0 m/s\nv = 12 m/s\ntime = 4 s" /></Field>
      <Field label="Teacher reasoning for this step"><Textarea rows={3} value={card.teacherNote || ''} onChange={(event) => updateCard({ teacherNote: event.target.value })} placeholder="Explain why this value, account, formula, or graph point belongs here." /></Field>
    </div>
  );
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

function QuizStep(props: { quizBank: QuizQuestion[]; quizIndex: number; setQuizIndex: (index: number) => void; activeQuiz: QuizQuestion; updateQuiz: (patch: Partial<QuizQuestion>) => void; addQuiz: () => void; duplicateQuiz: (index: number) => void; removeQuiz: (index: number) => void; reorderQuiz: (fromIndex: number, toIndex: number) => void; bulkAddQuiz: (raw: string) => void; finish: () => void }) {
  const { quizBank, quizIndex, setQuizIndex, activeQuiz, updateQuiz, addQuiz, duplicateQuiz, removeQuiz, reorderQuiz, bulkAddQuiz, finish } = props;
  const [bulkText, setBulkText] = useState('');
  const distribution = difficultyDistribution(quizBank);
  const missingAnswers = quizBank.filter((quiz) => !quiz.question.trim() || !quiz.answer.trim() || (quiz.type === 'mcq' && lines(quiz.options).length < 2)).length;
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>Build questions learners can practice with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-xl border bg-muted/20 p-3 text-xs">
            <p className="font-semibold">Difficulty mix</p>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {(['easy', 'medium', 'hard', 'very_hard'] as Difficulty[]).map((difficulty) => <div key={difficulty} className="rounded-lg bg-background p-2 text-center"><p className="font-semibold">{distribution[difficulty]}</p><p className="capitalize text-muted-foreground">{difficulty.replace('_', ' ')}</p></div>)}
            </div>
            {missingAnswers ? <p className="mt-2 text-amber-700">{missingAnswers} question{missingAnswers === 1 ? '' : 's'} need answers or options.</p> : null}
          </div>
          {quizBank.map((quiz, index) => (
            <div key={quiz.id} className={`rounded-xl border p-3 text-sm transition ${index === quizIndex ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40'}`}>
              <button type="button" onClick={() => setQuizIndex(index)} className="w-full text-left"><p className="font-semibold">Question {index + 1}</p><p className="text-xs text-muted-foreground">{quiz.difficulty} | {quiz.type} | {quiz.timeSeconds}s</p></button>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderQuiz(index, index - 1)}>Up</Button>
                <Button type="button" size="sm" variant="ghost" disabled={index === quizBank.length - 1} onClick={() => reorderQuiz(index, index + 1)}>Down</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => duplicateQuiz(index)}><Copy className="mr-1 size-3" />Copy</Button>
                <Button type="button" size="sm" variant="ghost" disabled={quizBank.length <= 1} onClick={() => removeQuiz(index)} className="text-destructive hover:text-destructive"><Trash2 className="mr-1 size-3" />Delete</Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={addQuiz}><Plus className="mr-2 size-4" />Add question</Button>
          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer text-sm font-semibold">Bulk paste questions</summary>
            <Textarea className="mt-3" rows={6} value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder={'Question text | Option A; Option B; Option C | Correct answer | Explanation\nAnother question | True; False | True | Why it is true'} />
            <Button type="button" size="sm" className="mt-2 w-full" disabled={!bulkText.trim()} onClick={() => { bulkAddQuiz(bulkText); setBulkText(''); }}>Add pasted questions</Button>
          </details>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Edit question {quizIndex + 1}</CardTitle>
          <CardDescription>These questions become the pool used for practice and assessment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Question"><Textarea rows={4} value={activeQuiz.question} onChange={(event) => updateQuiz({ question: event.target.value })} /></Field>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeQuiz.type} onChange={(event) => updateQuiz({ type: event.target.value as QuestionType })}><option value="mcq">MCQ</option><option value="short_answer">Short answer</option><option value="true_false">True/False</option><option value="fill_blank">Fill blank</option></select></Field>
            <Field label="Difficulty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeQuiz.difficulty} onChange={(event) => updateQuiz({ difficulty: event.target.value as Difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="very_hard">Very hard</option></select></Field>
            <Field label="Time seconds"><Input type="number" min={15} step={5} value={activeQuiz.timeSeconds} onChange={(event) => updateQuiz({ timeSeconds: event.target.value })} /></Field>
          </div>
          {activeQuiz.type === 'mcq' ? <Field label="Options, one per line"><Textarea rows={4} value={activeQuiz.options} onChange={(event) => updateQuiz({ options: event.target.value })} /></Field> : null}
          <Field label="Answer"><Input value={activeQuiz.answer} onChange={(event) => updateQuiz({ answer: event.target.value })} /></Field>
          <Field label="Explanation"><Textarea rows={3} value={activeQuiz.explanation} onChange={(event) => updateQuiz({ explanation: event.target.value })} /></Field>
          <div className="grid gap-2 sm:grid-cols-2"><Button onClick={addQuiz}>Add another question</Button><Button variant="secondary" onClick={finish}>Preview course</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function AiPanel(props: { aiPrompt: string; setAiPrompt: (value: string) => void; documents: SourceDoc[]; readDocuments: (event: ChangeEvent<HTMLInputElement>) => void; reading: boolean; generating: boolean; generateWithAi: () => void; clearDocuments: () => void }) {
  return <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><Card className="rounded-3xl border-primary/20 bg-primary/5"><CardHeader><CardTitle>AI helper</CardTitle><CardDescription>AI tools live here only. Generate a draft, then edit it manually.</CardDescription></CardHeader><CardContent className="space-y-4"><Field label="Prompt for AI"><Textarea rows={7} value={props.aiPrompt} onChange={(event) => props.setAiPrompt(event.target.value)} /></Field><Field label="Documents for AI"><Input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={props.readDocuments} disabled={props.reading} /></Field><DocumentList documents={props.documents} onClear={props.clearDocuments} /><Button className="w-full" onClick={props.generateWithAi} disabled={props.generating || props.reading}>{props.generating ? 'Generating...' : 'Generate draft and open manual editor'}</Button></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>Rule</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>AI never publishes directly.</p><p>AI output becomes editable lessons, cards and quiz questions.</p></CardContent></Card></div>;
}

function PreviewStep({ form, lesson, lessons, quizBank, readiness, courses, saveDraft, saving, onLoadCourse, loadingCourseId, editingCourseId }: { form: CourseForm; lesson: ManualLesson; lessons: ManualLesson[]; quizBank: QuizQuestion[]; readiness: ReadinessItem[]; courses: Course[]; saveDraft: () => void; saving: boolean; onLoadCourse: (courseId: string) => void; loadingCourseId: string | null; editingCourseId: string | null }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Review course</CardTitle>
          <CardDescription>Check what learners will see before saving the draft.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={previewMode === 'desktop' ? 'default' : 'outline'} onClick={() => setPreviewMode('desktop')}><Monitor className="mr-2 size-4" />Desktop lesson</Button>
            <Button type="button" size="sm" variant={previewMode === 'mobile' ? 'default' : 'outline'} onClick={() => setPreviewMode('mobile')}><Smartphone className="mr-2 size-4" />Mobile lesson</Button>
            <Button type="button" size="sm" variant={previewMode === 'outline' ? 'default' : 'outline'} onClick={() => setPreviewMode('outline')}><BookOpen className="mr-2 size-4" />Lesson list</Button>
            <Button type="button" size="sm" variant={previewMode === 'quiz' ? 'default' : 'outline'} onClick={() => setPreviewMode('quiz')}><ListChecks className="mr-2 size-4" />Questions</Button>
          </div>
          {previewMode === 'desktop' ? <LessonPlayer lesson={lessonPreview(lesson, form)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /> : null}
          {previewMode === 'mobile' ? <div className="mx-auto max-w-[390px] rounded-2xl border bg-muted/20 p-2"><LessonPlayer lesson={lessonPreview(lesson, form)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /></div> : null}
          {previewMode === 'outline' ? <div className="space-y-2">{lessons.map((item, index) => <div key={item.id} className="rounded-xl border p-3"><p className="font-semibold">{index + 1}. {item.title}</p><p className="text-sm text-muted-foreground">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.cards.length} cards | {item.outcomes.length} outcomes</p></div>)}</div> : null}
          {previewMode === 'quiz' ? <div className="space-y-2">{quizBank.map((quiz, index) => <div key={quiz.id} className="rounded-xl border p-3"><p className="font-semibold">{index + 1}. {quiz.question}</p><p className="mt-1 text-xs text-muted-foreground">{quiz.type} | {quiz.difficulty} | Answer: {quiz.answer || 'Missing'}</p></div>)}</div> : null}
          <Button className="mt-4 w-full" onClick={saveDraft} disabled={saving}><Save className="mr-2 size-4" />{saving ? 'Saving...' : editingCourseId ? 'Update draft for review' : 'Save draft for review'}</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Publish checklist</CardTitle>
          <CardDescription>Fix warnings before review when possible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {readiness.map((item) => <div key={item.label} className="flex gap-2 rounded-xl border p-3"><span>{item.done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-amber-600" />}</span><div><p className="font-medium">{item.label}</p>{item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}</div></div>)}
          <div className="pt-3">
            <p className="mb-2 font-semibold">Recent courses</p>
          <div className="grid gap-2">
            {courses.slice(0, 8).map((course) => (
              <div key={course.id} className={`rounded-xl border p-3 ${editingCourseId === course.id ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{course.title}</p>
                    <p className="text-muted-foreground">{course.status ?? 'draft'} | {course.level ?? 'beginner'} | {course.durationHours ?? 0}h</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => onLoadCourse(course.id)} disabled={loadingCourseId === course.id}>
                    <Edit3 className="mr-2 size-4" />
                    {loadingCourseId === course.id ? 'Loading...' : editingCourseId === course.id ? 'Loaded' : 'Load into builder'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
  const type: CardType = block.type === 'explanation' ? 'teach' : block.type || 'teach';
  const card = makeCard(type, index);
  const visual = block.visual || (['equation', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry', 'venn'].includes(block.type) ? block : null);
  return {
    ...card,
    title: block.title || card.title,
    body: block.body || card.body,
    templateId: block.templateId,
    templateLabel: block.templateLabel,
    workflowTemplate: block.workflowTemplate || workflowTemplateForType(type),
    subjectArea: block.subjectArea,
    teachingMove: block.teachingMove,
    boardId: block.boardId,
    keepSourceVisible: block.keepSourceVisible,
    sourceQuestion: block.sourceQuestion,
    teacherNote: block.teacherNote,
    extractedData: Array.isArray(block.extractedData) ? block.extractedData.join('\n') : typeof block.extractedData === 'string' ? block.extractedData : undefined,
    graphPointX: block.graphPointX != null ? String(block.graphPointX) : undefined,
    graphPointY: block.graphPointY != null ? String(block.graphPointY) : undefined,
    graphPointLabel: typeof block.graphPointLabel === 'string' ? block.graphPointLabel : undefined,
    graphMode: block.graphPointX != null || block.graphPointY != null ? 'point' : 'function',
    showGraphLine: Boolean(block.showGraphLine),
    cumulativeTable: Boolean(block.cumulativeTable),
    question: block.question || card.question,
    text: block.text || card.text,
    statement: block.statement || card.statement,
    prompt: block.prompt || card.prompt,
    front: block.front || card.front,
    back: block.back || card.back,
    items: Array.isArray(block.items) ? block.items.join('\n') : card.items,
    criteria: Array.isArray(block.criteria) ? block.criteria.join('\n') : card.criteria,
    options: Array.isArray(block.options) ? block.options.join('\n') : card.options,
    answer: String(block.correctAnswer ?? block.answer ?? card.answer ?? ''),
    explanation: block.explanation || card.explanation,
    mathTool: visual?.type || 'none',
    equation: visual?.equation,
    expression: visual?.functions?.[0]?.expression,
    columns: Array.isArray(visual?.columns) ? visual.columns.join(', ') : card.columns,
    rows: Array.isArray(visual?.rows) ? visual.rows.map((row: any) => Array.isArray(row) ? row.join(', ') : String(row)).join('\n') : card.rows,
    formulas: Array.isArray(visual?.formulas) ? visual.formulas.map((formula: any) => [formula.name, formula.formula, formula.description].filter(Boolean).join(' | ')).join('\n') : card.formulas,
    min: visual?.min != null ? String(visual.min) : card.min,
    max: visual?.max != null ? String(visual.max) : card.max,
    points: Array.isArray(visual?.points) ? visual.points.map((point: any) => typeof point === 'object' ? point.value : point).join(', ') : card.points,
    intervals: intervalsString(visual?.intervals),
  };
}

function modulesFromCourse(lessons: Lesson[]): ManualModule[] {
  if (!lessons.length) return [{ id: uid('module'), title: 'Module 1', description: 'Fallback module', outcomes: [], lessons: [makeLesson(1)], saved: true }];
  const moduleMap = new Map<number, ManualModule>();
  const sortedLessons = [...lessons].sort((left, right) => {
    const leftOrder = Number((left as any).sortOrder ?? Number.MAX_SAFE_INTEGER);
    const rightOrder = Number((right as any).sortOrder ?? Number.MAX_SAFE_INTEGER);
    return leftOrder - rightOrder;
  });

  sortedLessons.forEach((lesson, index) => {
    const modulePosition = Number((lesson as any).moduleIndex);
    const moduleIndex = Number.isFinite(modulePosition) && modulePosition >= 0 ? modulePosition : 0;
    const moduleTitle = ((lesson as any).moduleTitle as string | undefined)?.trim() || `Module ${moduleIndex + 1}`;
    const cards = lesson.learningObjects?.flatMap((object) => {
      const payload = object.payload ?? parseMaybeJson(object.body);
      return extractBlocksFromPayload(payload).map((block, blockIndex) => cardFromBlock(block, blockIndex + 1));
    }) ?? [];
    const subLessons = extractSubLessonsFromLesson(lesson);

    if (!moduleMap.has(moduleIndex)) {
      moduleMap.set(moduleIndex, {
        id: uid('module'),
        title: moduleTitle,
        description: 'Imported module',
        outcomes: [],
        lessons: [],
        saved: true,
      });
    }

    const module = moduleMap.get(moduleIndex)!;
    module.lessons.push({
      id: lesson.id,
      title: lesson.title || `Lesson ${index + 1}`,
      summary: stripHtml(lesson.content).slice(0, 180) || lesson.exercise || 'Describe what this lesson teaches.',
      outcomes: lesson.exercise ? [stripHtml(lesson.exercise).slice(0, 180)] : ['Understand the main idea.'],
      subLessons,
      cards: cards.length ? cards : [makeCard('teach', 1), makeCard('summary', 2)],
      saved: true,
    });
  });

  const modules = [...moduleMap.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, module]) => module);
  return modules.length ? modules : [{ id: uid('module'), title: 'Module 1', description: 'Imported module', outcomes: [], lessons: [makeLesson(1)], saved: true }];
}

function extractSubLessonsFromLesson(lesson: Lesson): SubLesson[] {
  const candidates = lesson.learningObjects?.flatMap((object) => {
    const payload = object.payload ?? parseMaybeJson(object.body);
    return extractSubLessonPayload(payload);
  }) ?? [];
  return candidates.map((subLesson, index) => ({
    id: typeof subLesson.id === 'string' && subLesson.id ? subLesson.id : uid('sub'),
    title: typeof subLesson.title === 'string' && subLesson.title.trim() ? subLesson.title : `Sub-lesson ${index + 1}`,
    summary: typeof subLesson.summary === 'string' ? subLesson.summary : '',
    cards: extractBlocksFromPayload(subLesson).map((block, blockIndex) => cardFromBlock(block, blockIndex + 1)),
    saved: true,
  }));
}

function extractSubLessonPayload(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.subLessons)) return [];
  return record.subLessons.filter((subLesson): subLesson is Record<string, unknown> => Boolean(subLesson && typeof subLesson === 'object' && !Array.isArray(subLesson)));
}


function quizBankFromLessons(lessons: Lesson[]): QuizQuestion[] {
  const quizzes = lessons.flatMap((lesson) => (lesson.quiz?.questions ?? []).map((question, index) => ({
    id: uid('quiz'),
    type: ((question.options?.length ?? 0) > 2 ? 'mcq' : 'true_false') as QuestionType,
    difficulty: 'easy' as Difficulty,
    timeSeconds: '60',
    question: question.question || `Question ${index + 1}`,
    options: question.options?.length ? question.options.join('\n') : 'True\nFalse',
    answer: question.answer || question.options?.[0] || 'True',
    explanation: `Review the lesson before answering question ${index + 1}.`,
  })));
  return quizzes.length ? quizzes : [makeQuiz()];
}

function extractBlocksFromPayload(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const lists = [record.blocks, record.cards, record.items, record.steps].filter(Array.isArray) as any[][];
  if (lists.length) return lists.flat();
  return [];
}

function parseMaybeJson(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function blockFromCard(card: ManualCard): any {
  const normalized = normalizeManualCard(card);
  const shared = {
    title: normalized.title,
    body: normalized.body,
    workflowTemplate: normalized.workflowTemplate,
    templateId: normalized.templateId,
    templateLabel: normalized.templateLabel,
    subjectArea: normalized.subjectArea,
    teachingMove: normalized.teachingMove,
    boardId: normalized.boardId,
    keepSourceVisible: normalized.keepSourceVisible,
    sourceQuestion: normalized.sourceQuestion,
    teacherNote: normalized.teacherNote,
    extractedData: lines(normalized.extractedData),
    graphPointX: normalized.graphPointX,
    graphPointY: normalized.graphPointY,
    graphPointLabel: normalized.graphPointLabel,
    graphMode: normalized.graphMode,
    showGraphLine: normalized.showGraphLine,
    cumulativeTable: normalized.cumulativeTable,
    prompt: normalized.prompt,
    front: normalized.front,
    back: normalized.back,
    items: lines(normalized.items),
    criteria: lines(normalized.criteria),
    imageUrl: normalized.imageUrl,
    imageAlt: normalized.imageAlt,
    imageCaption: normalized.imageCaption,
    visual: mathVisual(normalized),
  };

  if (normalized.type === 'question') {
    return compactBlock({
      ...shared,
      type: 'question',
      question: normalized.question,
      options: lines(normalized.options),
      correctAnswer: normalized.answer,
      explanation: normalized.explanation,
    });
  }

  if (normalized.type === 'fill_blank') {
    return compactBlock({
      ...shared,
      type: 'fill_blank',
      text: normalized.text || normalized.body,
      correctAnswer: normalized.answer,
      explanation: normalized.explanation,
    });
  }

  if (normalized.type === 'true_false') {
    return compactBlock({
      ...shared,
      type: 'true_false',
      statement: normalized.statement || normalized.body,
      correctAnswer: parseBooleanAnswer(normalized.answer),
      explanation: normalized.explanation,
    });
  }

  if (normalized.type === 'summary') return compactBlock({ ...shared, type: 'summary' });
  if (normalized.type === 'example') return compactBlock({ ...shared, type: 'example' });
  return compactBlock({ ...shared, type: normalized.type === 'teach' ? 'explanation' : normalized.type });
}

function normalizeManualCard(card: ManualCard): ManualCard {
  const trimValue = (value?: string) => {
    const trimmed = String(value ?? '').trim();
    return trimmed ? trimmed : undefined;
  };
  return {
    ...card,
    workflowTemplate: card.workflowTemplate || workflowTemplateForType(card.type),
    title: trimValue(card.title) || 'Untitled card',
    body: trimValue(card.body) || '',
    templateId: trimValue(card.templateId),
    templateLabel: trimValue(card.templateLabel),
    subjectArea: trimValue(card.subjectArea),
    teachingMove: trimValue(card.teachingMove),
    boardId: trimValue(card.boardId),
    sourceQuestion: trimValue(card.sourceQuestion),
    teacherNote: trimValue(card.teacherNote),
    extractedData: lines(card.extractedData).join('\n'),
    graphPointX: trimValue(card.graphPointX),
    graphPointY: trimValue(card.graphPointY),
    graphPointLabel: trimValue(card.graphPointLabel),
    question: trimValue(card.question),
    text: trimValue(card.text),
    statement: trimValue(card.statement),
    prompt: trimValue(card.prompt),
    front: trimValue(card.front),
    back: trimValue(card.back),
    items: lines(card.items).join('\n'),
    criteria: lines(card.criteria).join('\n'),
    options: lines(card.options).join('\n'),
    answer: trimValue(card.answer),
    explanation: trimValue(card.explanation),
    imageUrl: trimValue(card.imageUrl),
    imageAlt: trimValue(card.imageAlt),
    imageCaption: trimValue(card.imageCaption),
    equation: trimValue(card.equation),
    expression: trimValue(card.expression),
    xMin: numericString(card.xMin),
    xMax: numericString(card.xMax),
    columns: comma(card.columns).join(', '),
    rows: lines(card.rows).join('\n'),
    formulas: lines(card.formulas).join('\n'),
    min: numericString(card.min),
    max: numericString(card.max),
    points: comma(card.points).join(', '),
    intervals: lines(card.intervals).join('\n'),
  };
}

function numericString(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : undefined;
}

function compactBlock<T extends Record<string, unknown>>(block: T): T {
  return Object.fromEntries(Object.entries(block).filter(([, value]) => {
    if (typeof value === 'undefined' || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  })) as T;
}

function parseBooleanAnswer(value?: string) {
  return String(value || '').trim().toLowerCase() !== 'false';
}

function mathVisual(card: ManualCard) {
  if (card.mathTool === 'equation') return { type: 'equation', equation: card.equation || '' };
  if (card.mathTool === 'graph' && card.graphMode === 'point') {
    return compactBlock({
      type: 'graph',
      graphType: card.showGraphLine ? 'line' : 'scatter',
      data: pointFromCard(card),
      xMin: optionalNumber(card.xMin),
      xMax: optionalNumber(card.xMax),
      yMin: optionalNumber(card.min),
      yMax: optionalNumber(card.max),
    });
  }
  if (card.mathTool === 'graph') return compactBlock({ type: 'graph', graphType: 'function', functions: [{ expression: card.expression || 'x', label: card.expression || 'f(x)' }], xMin: optionalNumber(card.xMin), xMax: optionalNumber(card.xMax), yMin: optionalNumber(card.min), yMax: optionalNumber(card.max) });
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
  if ((card as any).mathTool === 'venn') return compactBlock({ type: 'venn', setCount: Number((card as any).vennSetCount || 2), labels: comma((card as any).vennLabels || 'A,B,C').slice(0,3), highlight: ((card as any).vennHighlight || 'none'), description: (card as any).vennDescription || undefined });
  if (card.mathTool === 'number_line') {
    return compactBlock({
      type: 'number_line',
      min: optionalNumber(card.min),
      max: optionalNumber(card.max),
      points: comma(card.points).map(Number).filter(Number.isFinite),
      intervals: parseIntervals(card.intervals),
    });
  }
  return undefined;
}

function intervalsString(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.map((interval) => {
    if (!interval || typeof interval !== 'object') return '';
    const record = interval as Record<string, unknown>;
    const start = record.start == null ? '' : String(record.start);
    const end = record.end == null ? '' : String(record.end);
    const startType = Boolean(record.startClosed ?? record.inclusiveStart) ? 'closed' : 'open';
    const endType = Boolean(record.endClosed ?? record.inclusiveEnd) ? 'closed' : 'open';
    const label = typeof record.label === 'string' ? record.label : '';
    return [start, end, startType, endType, label].join(',');
  }).filter(Boolean).join('\n');
}

function parseIntervals(value?: string) {
  return lines(value).map((line) => {
    const [startRaw = '', endRaw = '', startType = 'open', endType = 'open', ...labelParts] = line.split(',').map((part) => part.trim());
    const start = startRaw === '' ? null : Number(startRaw);
    const end = endRaw === '' ? null : Number(endRaw);
    if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end))) return null;
    const startClosed = startType.toLowerCase() === 'closed';
    const endClosed = endType.toLowerCase() === 'closed';
    const label = labelParts.join(', ').trim();
    return compactBlock({ start, end, startClosed, endClosed, inclusiveStart: startClosed, inclusiveEnd: endClosed, label: label || undefined });
  }).filter(Boolean);
}

function optionalNumber(value?: string) {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pointFromCard(card: ManualCard) {
  const x = Number(card.graphPointX);
  const y = Number(card.graphPointY);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
  return [{ x, y, label: card.graphPointLabel || `(${x}, ${y})` }];
}

function insertAt<T>(items: T[], index: number, item: T) {
  return [...items.slice(0, index), item, ...items.slice(index)];
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(clampIndex(toIndex, next.length), 0, item);
  return next;
}

function clampIndex(index: number, length: number) {
  if (!Number.isFinite(index)) return length;
  return Math.max(0, Math.min(index, length));
}

function cardPreviewText(card: ManualCard) {
  const text = card.question || card.text || card.statement || card.body || card.prompt || card.front || card.back || card.items || card.criteria || 'Empty card';
  return text.replace(/\s+/g, ' ').trim();
}

function workflowTemplateById(id: CardWorkflowTemplateId) {
  return CARD_WORKFLOW_TEMPLATES.find((template) => template.id === id) ?? CARD_WORKFLOW_TEMPLATES[0];
}

function cardsFromSequence(sequence: CardSequence, seed: string, startIndex: number) {
  const topic = commandTopic(seed || sequence.label);
  return sequence.templates.map((templateId, offset) => seedCard(workflowTemplateById(templateId), topic, startIndex + offset));
}

function cardsFromQuickCommand(command: string, startIndex: number) {
  const normalized = command.trim().toLowerCase();
  if (!normalized) return [];
  const topic = commandTopic(command);
  const requested: CardWorkflowTemplateId[] = [];
  if (/\bvisual|image|diagram|chart|graph|table\b/.test(normalized)) requested.push('visual');
  if (/\bteach|explain|intro|introduce|concept\b/.test(normalized)) requested.push('teach');
  if (/\bexample|worked|sample\b/.test(normalized)) requested.push('example');
  if (/\bcase|scenario|situation\b/.test(normalized)) requested.push('case_scenario');
  if (/\bpractice|task|activity|exercise\b/.test(normalized)) requested.push('practice_task');
  if (/\bcheckpoint|quiz|question|check|mcq|test\b/.test(normalized)) requested.push('checkpoint');
  if (/\bflash|recall|term|definition\b/.test(normalized)) requested.push('flashcard');
  if (/\bsummary|recap|wrap\b/.test(normalized)) requested.push('summary');

  const templateIds = uniqueTemplateIds(requested.length ? requested : ['teach', 'example', 'checkpoint']);
  return templateIds.map((templateId, offset) => seedCard(workflowTemplateById(templateId), topic, startIndex + offset));
}

function seedCard(template: CardWorkflowTemplate, topic: string, index: number): ManualCard {
  const card = makeCardFromWorkflowTemplate(template, index);
  const titleTopic = titleCase(topic || template.focus);
  if (template.id === 'teach') return { ...card, title: titleTopic, body: `Explain ${topic || 'this idea'} in one focused learner card.` };
  if (template.id === 'example') return { ...card, title: `${titleTopic} example`, body: `Show one practical example of ${topic || 'the idea'}.` };
  if (template.id === 'checkpoint') return { ...card, title: `${titleTopic} checkpoint`, question: `Which option best matches ${topic || 'this lesson idea'}?`, options: `A clear match\nA distracting option\nAn unrelated option\nA common mistake`, answer: 'A clear match', explanation: `The correct option directly uses ${topic || 'the key idea'}.` };
  if (template.id === 'visual') return { ...card, title: `${titleTopic} visual`, body: `Use this card to explain the visual pattern for ${topic || 'the idea'}.` };
  if (template.id === 'flashcard') return { ...card, title: `${titleTopic} flashcard`, front: `What is the key idea in ${topic || 'this card'}?`, back: `State the idea clearly, then give one short example.` };
  if (template.id === 'practice_task') return { ...card, title: `${titleTopic} practice`, prompt: `Apply ${topic || 'the lesson idea'} to a short task.`, criteria: `Uses the key idea\nShows the working\nChecks the answer` };
  if (template.id === 'case_scenario') return { ...card, title: `${titleTopic} scenario`, body: `A learner faces a realistic situation involving ${topic || 'this idea'}.`, prompt: 'What should they decide, and why?', criteria: 'Uses evidence from the scenario\nExplains the decision' };
  return { ...card, title: `${titleTopic} summary`, body: `Summarize the most important points about ${topic || 'this lesson'}.` };
}

function transformCard(card: ManualCard, templateId: CardWorkflowTemplateId): ManualCard {
  const text = cardPreviewText(card);
  const transformed = seedCard(workflowTemplateById(templateId), text || card.title, 1);
  return {
    ...transformed,
    id: card.id,
    title: transformed.title || card.title,
    imageUrl: card.imageUrl,
    imageAlt: card.imageAlt,
    imageCaption: card.imageCaption,
    mathTool: templateId === 'visual' ? (card.mathTool === 'none' ? 'graph' : card.mathTool) : transformed.mathTool,
    visual: undefined,
    saved: false,
  } as ManualCard;
}

function shortenCard(card: ManualCard): ManualCard {
  const field = primaryTextField(card);
  const current = String(card[field] || '');
  return {
    ...card,
    [field]: shortenText(current),
    items: lines(card.items).slice(0, 5).join('\n'),
    criteria: lines(card.criteria).slice(0, 5).join('\n'),
    saved: false,
  } as ManualCard;
}

function splitCard(card: ManualCard, startIndex: number): ManualCard[] {
  const text = cardPreviewText(card);
  const chunks = chunkSentences(text, 42);
  if (chunks.length <= 1) {
    return [
      { ...card, saved: false },
      seedCard(workflowTemplateById('example'), text || card.title, startIndex + 1),
      seedCard(workflowTemplateById('checkpoint'), text || card.title, startIndex + 2),
    ];
  }
  return chunks.map((chunk, index) => ({
    ...makeCardFromWorkflowTemplate(workflowTemplateById(index === chunks.length - 1 ? 'summary' : 'teach'), startIndex + index),
    title: `${card.title || 'Card'} ${index + 1}`,
    body: chunk,
    saved: false,
  }));
}

function uniqueTemplateIds(values: CardWorkflowTemplateId[]) {
  const seen = new Set<CardWorkflowTemplateId>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}


function commandTopic(value: string) {
  return value
    .replace(/\b(teach|explain|intro|introduce|with|and|then|add|make|create|card|cards|example|checkpoint|quiz|question|summary|visual|image|practice|task|case|scenario|flashcard|flash)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'the lesson idea';
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function shortenText(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 45) return value;
  return `${words.slice(0, 45).join(' ')}.`;
}

function chunkSentences(value: string, wordsPerChunk: number) {
  const sentences = value.match(/[^.!?]+[.!?]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [value];
  const chunks: string[] = [];
  let current: string[] = [];
  let count = 0;
  sentences.forEach((sentence) => {
    const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
    if (current.length && count + sentenceWords > wordsPerChunk) {
      chunks.push(current.join(' '));
      current = [];
      count = 0;
    }
    current.push(sentence);
    count += sentenceWords;
  });
  if (current.length) chunks.push(current.join(' '));
  return chunks.filter((chunk) => chunk.trim().length > 0);
}

function learnerLoadForCard(card: ManualCard): LearnerLoad {
  const textFields = [
    card.title,
    card.body,
    card.question,
    card.text,
    card.statement,
    card.prompt,
    card.front,
    card.back,
    card.items,
    card.criteria,
    card.options,
    card.explanation,
    card.sourceQuestion,
    card.teacherNote,
  ].filter(Boolean).join(' ');
  const wordCount = textFields.trim().split(/\s+/).filter(Boolean).length;
  const listCount = lines(card.items).length + lines(card.criteria).length + lines(card.options).length + lines(card.extractedData).length;
  const mediaScore = (card.imageUrl ? 18 : 0) + (card.mathTool && card.mathTool !== 'none' ? 22 : 0) + (card.sourceQuestion && card.sourceQuestion.length > 500 ? 24 : 0);
  const score = wordCount + listCount * 10 + mediaScore;
  const level: LearnerLoad['level'] = score > 210 ? 'heavy' : score > 95 ? 'medium' : 'short';
  return {
    level,
    score,
    percent: Math.min(100, Math.max(8, Math.round((score / 240) * 100))),
    hint: level === 'heavy' ? 'Split or collapse details.' : level === 'medium' ? 'Readable with guided sections.' : 'Focused card.',
  };
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

function requestErrorMessage(cause: unknown, fallback: string) {
  if (!cause || typeof cause !== 'object') return fallback;
  const error = cause as Error & { fieldErrors?: Record<string, string[]> };
  const fieldErrors = error.fieldErrors ?? {};
  const fieldMessages = Object.entries(fieldErrors)
    .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
    .slice(0, 4);

  if (fieldMessages.length) {
    return `${error.message || fallback} ${fieldMessages.join(' ')}`;
  }

  return error.message || fallback;
}

function buildBlueprint(form: CourseForm, modules: ManualModule[], quizBank: QuizQuestion[]): any {
  const totalMinutes = Math.max(30, toPositiveInt(form.durationHours, 1) * 60);
  const allLessons = modules.flatMap((module) => module.lessons);
  const lessonMinutes = Math.max(5, Math.round(totalMinutes / Math.max(1, allLessons.length)));
  const outcomes = allLessons.flatMap((lesson) => lesson.outcomes).filter(Boolean).slice(0, 10);

  return {
    schemaVersion: 'short-course-v1',
    generatedAt: new Date().toISOString(),
    courseSummary: {
      title: form.title || 'Untitled short course',
      audience: 'Short-course learners',
      level: form.level,
      description: form.description || 'Manual course draft.',
      prerequisites: [],
      totalDurationHours: toPositiveInt(form.durationHours, 1),
      outcomes: outcomes.length ? outcomes : ['Understand the key ideas.'],
      finalAssessment: 'Practice exam from quiz bank.',
      certificateCriteria: 'Complete lessons and pass the final assessment.',
    },
    assessments: {
      quizzes: quizBank.map((q) => `${q.difficulty.toUpperCase()} | ${q.type} | ${q.timeSeconds}s | ${q.question} | Answer: ${q.answer} | ${q.explanation}`),
      practicalWork: [],
      instructorReviewChecklist: ['Check lesson accuracy.', 'Check block-template fit for the subject.', 'Check math inside cards.', 'Check quiz answers.', 'Check images and captions.'],
    },
    modules: modules.map((module, moduleIndex) => ({
      title: module.title || `Module ${moduleIndex + 1}`,
      description: module.description || 'Manual module.',
      durationMinutes: Math.max(30, lessonMinutes * Math.max(1, module.lessons.length)),
      outcomes: module.outcomes?.length ? module.outcomes : outcomes,
      moduleAssessment: 'Quiz bank practice.',
      lessons: module.lessons.map((lesson) => ({
        title: lesson.title,
        summary: lesson.summary,
        durationMinutes: lessonMinutes,
        difficulty: form.level,
        outcomes: lesson.outcomes,
        blocks: lesson.cards.map(blockFromCard),
        subLessons: lesson.subLessons.map((subLesson) => ({
          id: subLesson.id,
          title: subLesson.title,
          summary: subLesson.summary,
          blocks: subLesson.cards.map(blockFromCard),
        })),
        activities: [],
        assessment: 'Complete all cards.',
      })),
    })),
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
    estimatedMinutes: Math.max(5, Math.round((toPositiveInt(form.durationHours, 1) * 60) / 4)),
    difficulty: form.level,
    learningObjects: [
      {
        id: 'preview-object',
        type: 'content',
        title: lesson.title,
        body: JSON.stringify({ blocks: lesson.cards.map(blockFromCard) }),
        payload: { blocks: lesson.cards.map(blockFromCard), subLessons: lesson.subLessons.map((sub) => ({ id: sub.id, title: sub.title, summary: sub.summary, blocks: sub.cards.map(blockFromCard) })) },
      },
    ] as any,
  } as any;
}

function validateCourse(form: CourseForm, modules: ManualModule[]) {
  if (!form.title.trim()) return 'Course title is required.';
  if (!form.schoolId) return 'School / Faculty is required.';
  if ((form.currency || 'ZMW').trim().length !== 3) return 'Currency must be a 3-letter code, for example ZMW.';
  const lessons = modules.flatMap((module) => module.lessons);
  if (!modules.length) return 'Add at least one module.';
  if (!lessons.length) return 'Add at least one lesson.';
  if (lessons.some((lesson) => !lesson.title.trim())) return 'Every lesson needs a title.';
  if (lessons.some((lesson) => !lesson.cards.length && !lesson.subLessons.some((sub) => sub.cards.length))) return 'Every lesson needs cards.';
  return null;
}

function courseReadiness(form: CourseForm, modules: ManualModule[], quizBank: QuizQuestion[]): ReadinessItem[] {
  const lessons = modules.flatMap((module) => module.lessons);
  const cards = lessons.flatMap((lesson) => [...lesson.cards, ...lesson.subLessons.flatMap((sub) => sub.cards)]);
  const checkpoints = cards.filter((card) => ['question', 'fill_blank', 'true_false'].includes(card.type));
  const heavyCards = cards.filter((card) => learnerLoadForCard(card).level === 'heavy');
  const imagesMissingAlt = cards.filter((card) => card.imageUrl && !card.imageAlt?.trim());
  const incompleteQuestions = quizBank.filter((quiz) => !quiz.question.trim() || !quiz.answer.trim() || (quiz.type === 'mcq' && lines(quiz.options).length < 2));
  return [
    { label: 'Course title is set', done: Boolean(form.title.trim()), detail: form.title.trim() ? undefined : 'Add a clear course name.' },
    { label: 'School is selected', done: Boolean(form.schoolId), detail: form.schoolId ? undefined : 'Choose the school or faculty.' },
    { label: 'Lessons have cards', done: lessons.length > 0 && lessons.every((lesson) => lesson.cards.length > 0 || lesson.subLessons.some((sub) => sub.cards.length > 0)), detail: `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} planned.` },
    { label: 'Checkpoints have answers', done: checkpoints.every((card) => String(card.answer ?? '').trim()), detail: checkpoints.length ? `${checkpoints.length} checkpoint card${checkpoints.length === 1 ? '' : 's'} found.` : 'Add at least one checkpoint when ready.' },
    { label: 'Question bank is ready', done: quizBank.length > 0 && incompleteQuestions.length === 0, detail: incompleteQuestions.length ? `${incompleteQuestions.length} question${incompleteQuestions.length === 1 ? '' : 's'} need fixing.` : `${quizBank.length} question${quizBank.length === 1 ? '' : 's'}.` },
    { label: 'Cards are readable', done: heavyCards.length === 0, detail: heavyCards.length ? `${heavyCards.length} heavy card${heavyCards.length === 1 ? '' : 's'} should be split.` : undefined },
    { label: 'Images are described', done: imagesMissingAlt.length === 0, detail: imagesMissingAlt.length ? `${imagesMissingAlt.length} image${imagesMissingAlt.length === 1 ? '' : 's'} need descriptions.` : undefined },
  ];
}

function difficultyDistribution(quizBank: QuizQuestion[]) {
  return quizBank.reduce<Record<Difficulty, number>>((totals, quiz) => {
    totals[quiz.difficulty] += 1;
    return totals;
  }, { easy: 0, medium: 0, hard: 0, very_hard: 0 });
}

function quizFromBulkText(raw: string): QuizQuestion[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question = '', optionText = '', answer = '', explanation = ''] = line.split('|').map((part) => part.trim());
      const options = optionText.split(';').map((option) => option.trim()).filter(Boolean);
      return {
        id: uid('quiz'),
        type: options.length > 2 ? 'mcq' : 'true_false',
        difficulty: 'easy',
        timeSeconds: '60',
        question: question || 'Review this question.',
        options: options.length ? options.join('\n') : 'True\nFalse',
        answer: answer || options[0] || 'True',
        explanation: explanation || 'Explain the answer.',
      } as QuizQuestion;
    });
}


function cleanJson(raw: string) {
  return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function aiPromptFor(seed: string, form: CourseForm, sourceText: string, names: string[]) {
  return `Create a broad, launch-ready short course in strict JSON only. Prompt: ${seed}\nTitle: ${form.title || 'Suggest title'}\nLevel: ${form.level}\nHours: ${form.durationHours}\nDocuments: ${names.join(', ') || 'none'}\n${sourceText ? `Source text:\n${sourceText}` : ''}\nUse self-paced lesson cards suitable for any field: explanation, example, question, fill_blank, true_false and summary. Add practical scenarios, case-style examples, common mistakes, definitions, process steps and checkpoint questions. Use card metadata when helpful: templateLabel, subjectArea and teachingMove. Math, charts, tables, formulas and number lines should be inside card.visual. Return courseSummary, assessments, modules, lessons and blocks.`;
}
