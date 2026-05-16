export type GraphFunction = {
  expression: string;
  label?: string;
};

export type GraphPoint = {
  x: number | string;
  y: number;
  label?: string;
};

export type VisualBlockType =
  | 'equation'
  | 'graph'
  | 'table'
  | 'number_line'
  | 'matrix'
  | 'formula_sheet'
  | 'geometry';

export type EquationBlock = {
  type: 'equation';
  title?: string;
  body?: string;
  equation: string;
  explanation?: string;
};

export type GraphBlock = {
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

export type TableBlock = {
  type: 'table';
  title?: string;
  description?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
};

export type NumberLineBlock = {
  type: 'number_line';
  title?: string;
  description?: string;
  min: number;
  max: number;
  step?: number;
  points?: Array<number | { value: number; label?: string }>;
  intervals?: Array<{ start: number; end: number; label?: string; inclusiveStart?: boolean; inclusiveEnd?: boolean }>;
};

export type MatrixBlock = {
  type: 'matrix';
  title?: string;
  description?: string;
  matrix: Array<Array<string | number>>;
  label?: string;
};

export type FormulaSheetBlock = {
  type: 'formula_sheet';
  title?: string;
  formulas: Array<{ name: string; formula: string; description?: string }>;
};

export type GeometryBlock = {
  type: 'geometry';
  title?: string;
  description?: string;
  shape: 'triangle' | 'circle' | 'rectangle' | 'line' | 'angle';
  labels?: Record<string, string>;
  values?: Record<string, string | number>;
};

export type LessonVisualBlock =
  | EquationBlock
  | GraphBlock
  | TableBlock
  | NumberLineBlock
  | MatrixBlock
  | FormulaSheetBlock
  | GeometryBlock;

export type LessonStep = {
  title?: string;
  explanation?: string;
  visual?: LessonVisualBlock;
};

export type LessonCardBlock =
  | { type: 'explanation'; title: string; body: string; steps?: LessonStep[] }
  | { type: 'example'; title: string; body: string; code?: string | null }
  | EquationBlock
  | GraphBlock
  | TableBlock
  | NumberLineBlock
  | MatrixBlock
  | FormulaSheetBlock
  | GeometryBlock
  | { type: 'question'; title?: string; question: string; visual?: LessonVisualBlock; options: string[]; correctAnswer: string; explanation: string }
  | { type: 'fill_blank'; title?: string; text: string; visual?: LessonVisualBlock; correctAnswer: string; explanation: string }
  | { type: 'true_false'; title?: string; statement: string; visual?: LessonVisualBlock; correctAnswer: boolean; explanation: string }
  | { type: 'summary'; title?: string; body: string };

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
};

export type CourseBuilderModule = {
  title: string;
  description: string;
  durationMinutes: number;
  outcomes: string[];
  lessons: CourseBuilderLesson[];
  moduleAssessment: string;
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
  };
  assessments: {
    quizzes: string[];
    practicalWork: string[];
    instructorReviewChecklist: string[];
  };
  modules: CourseBuilderModule[];
};

export type CourseBuilderSelection = {
  moduleIndex: number;
  lessonIndex: number;
  subLessonIndex?: number | null;
  cardIndex: number;
};