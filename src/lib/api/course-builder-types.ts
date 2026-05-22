import type { ChemistryVisual } from '@/components/learning/blocks/chemistry';

export type GraphFunction = {
  expression: string;
  label?: string;
};

export type GraphPoint = {
  x: number | string;
  y: number;
  label?: string;
};

export type CardImageFields = {
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  templateId?: string;
  templateLabel?: string;
  subjectArea?: string;
  teachingMove?: string;
  sourceChunkIds?: string[];
  sourceExcerpt?: string;
};

export type VisualBlockType =
  | 'equation'
  | 'graph'
  | 'table'
  | 'number_line'
  | 'matrix'
  | 'formula_sheet'
  | 'geometry'
  | 'venn';

export type EquationBlock = CardImageFields & {
  type: 'equation';
  title?: string;
  body?: string;
  equation: string;
  explanation?: string;
};

export type GraphBlock = CardImageFields & {
  type: 'graph';
  title?: string;
  description?: string;
  graphType: 'function' | 'line' | 'bar' | 'scatter' | 'pie';
  xLabel?: string;
  yLabel?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  functions?: GraphFunction[];
  data?: GraphPoint[];
};

export type TableBlock = CardImageFields & {
  type: 'table';
  title?: string;
  description?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
};

export type NumberLineBlock = CardImageFields & {
  type: 'number_line';
  title?: string;
  description?: string;
  min: number;
  max: number;
  step?: number;
  points?: Array<number | { value: number; label?: string }>;
  intervals?: Array<{
    start: number | null;
    end: number | null;
    label?: string;
    inclusiveStart?: boolean;
    inclusiveEnd?: boolean;
    startClosed?: boolean;
    endClosed?: boolean;
  }>;
};

export type MatrixBlock = CardImageFields & {
  type: 'matrix';
  title?: string;
  description?: string;
  matrix: Array<Array<string | number>>;
  label?: string;
};

export type FormulaSheetBlock = CardImageFields & {
  type: 'formula_sheet';
  title?: string;
  formulas: Array<{ name: string; formula: string; description?: string }>;
};

export type GeometryBlock = CardImageFields & {
  type: 'geometry';
  title?: string;
  description?: string;
  shape: 'triangle' | 'circle' | 'rectangle' | 'line' | 'angle';
  labels?: Record<string, string>;
  values?: Record<string, string | number>;
};

export type VennBlock = CardImageFields & {
  type: 'venn';
  title?: string;
  description?: string;
  setCount: 1 | 2 | 3;
  labels?: string[];
  highlight?:
    | 'none'
    | 'A'
    | 'B'
    | 'C'
    | 'union'
    | 'intersection'
    | 'intersectionAB'
    | 'intersectionAC'
    | 'intersectionBC'
    | 'differenceAB'
    | 'differenceBA'
    | 'complementA'
    | 'complementB'
    | 'complementC'
    | 'outside'
    | 'deMorganUnion'
    | string;
};

export type LessonVisualBlock =
  | EquationBlock
  | GraphBlock
  | TableBlock
  | NumberLineBlock
  | MatrixBlock
  | FormulaSheetBlock
  | GeometryBlock
  | VennBlock;

export type LessonStep = CardImageFields & {
  title?: string;
  explanation?: string;
  visual?: LessonVisualBlock;
};

export type CodeCardFile = {
  name: string;
  content: string;
  readonly?: boolean;
};

export type CodeCardTest = {
  type: 'contains' | 'not_contains' | 'equals' | 'regex' | 'stdout_contains' | 'unit' | 'custom';
  file?: string;
  value?: string;
  command?: string;
  description?: string;
};

export type CodeCardType =
  | 'code_playground'
  | 'debug_code'
  | 'complete_code'
  | 'predict_output'
  | 'code_explanation'
  | 'code_mini_project'
  | 'mini_project';

export type CodeCardBlock = CardImageFields & {
  type: CodeCardType;
  title: string;
  instructions: string;
  language: string;
  files: CodeCardFile[];
  starterFiles?: CodeCardFile[];
  solutionFiles?: CodeCardFile[];
  tests?: CodeCardTest[];
  hints?: string[];
  expectedOutput?: string;
  previewMode?: 'html' | 'console' | 'terminal' | 'none';
  aiHelpEnabled?: boolean;
  explanation?: string;
};

export type ChemistryVisualBlock = CardImageFields & {
  type: 'chemistry_visual';
  title?: string;
  body?: string;
  chemistryCardType?: string;
  chemistryTemplate?: string;
  visual: ChemistryVisual;
  required?: boolean;
};

export type LessonCardBlock =
  | (CardImageFields & { type: 'explanation'; title: string; body: string; steps?: LessonStep[] })
  | (CardImageFields & { type: 'example'; title: string; body: string; code?: string | null })
  | EquationBlock
  | GraphBlock
  | TableBlock
  | NumberLineBlock
  | MatrixBlock
  | FormulaSheetBlock
  | GeometryBlock
  | VennBlock
  | CodeCardBlock
  | ChemistryVisualBlock
  | (CardImageFields & { type: 'question'; title?: string; question: string; visual?: LessonVisualBlock; options: string[]; correctAnswer: string; explanation: string })
  | (CardImageFields & { type: 'fill_blank'; title?: string; text: string; visual?: LessonVisualBlock; correctAnswer: string; explanation: string })
  | (CardImageFields & { type: 'true_false'; title?: string; statement: string; visual?: LessonVisualBlock; correctAnswer: boolean; explanation: string })
  | (CardImageFields & { type: 'summary'; title?: string; body: string });

export type CourseBuilderLesson = {
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty?: string;
  outcomes: string[];
  blocks: LessonCardBlock[];
  subLessons?: CourseBuilderLesson[];
  activities: string[];
  assessment: string;
  sourceChunkIds?: string[];
};

export type CourseBuilderModule = {
  title: string;
  description: string;
  durationMinutes: number;
  outcomes: string[];
  lessons: CourseBuilderLesson[];
  moduleAssessment: string;
  sourceChunkIds?: string[];
};

export type CourseDocumentChunk = {
  id: string;
  documentId: string;
  title?: string;
  text: string;
  order: number;
  topicTags?: string[];
};

export type CourseSourceDocument = {
  id: string;
  name: string;
  mode: string;
  text?: string;
  chunks?: CourseDocumentChunk[];
  outline?: string[];
  detectedTopics?: string[];
  detectedDifficulty?: string;
  missingParts?: string[];
  warning?: string;
};

export type CourseBuilderBlueprint = {
  courseSummary: {
    title: string;
    audience: string;
    level: string;
    description: string;
    prerequisites: string[];
    totalDurationHours: number;
    outcomes: string[];
    finalAssessment: string;
    certificateCriteria: string;
    targetLearner?: string;
    assessmentApproach?: string;
    projectIdea?: string;
  };
  assessments: {
    quizzes: string[];
    practicalWork: string[];
    instructorReviewChecklist: string[];
  };
  modules: CourseBuilderModule[];
  documents?: CourseSourceDocument[];
};

export type CourseBuilderSelection = {
  moduleIndex: number;
  lessonIndex: number;
  subLessonIndex?: number | null;
  cardIndex: number;
};

export type AiBuilderAction =
  | 'document_map'
  | 'course_plan'
  | 'generate_modules'
  | 'generate_lessons'
  | 'generate_sub_lessons'
  | 'generate_cards'
  | 'generate_single_card'
  | 'repair_card'
  | 'generate_questions'
  | 'generate_code_card'
  | 'validate_course'
  | 'suggest_improvements';

export type AiBuilderScope = 'course' | 'module' | 'lesson' | 'sub_lesson' | 'card';

export type AiBuilderGenerationRequest = {
  action: AiBuilderAction;
  scope: AiBuilderScope;
  currentBlueprint: Partial<CourseBuilderBlueprint>;
  selectedScope?: {
    moduleIndex?: number;
    lessonIndex?: number;
    subLessonIndex?: number | null;
    cardIndex?: number;
  };
  selectedDocumentChunks?: CourseDocumentChunk[] | string[];
  count?: number;
  difficulty?: string;
  instruction?: string;
};
