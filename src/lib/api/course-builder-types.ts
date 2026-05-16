export type LessonCardBlock =
  | { type: 'explanation'; title: string; body: string }
  | { type: 'example'; title: string; body: string; code?: string | null }
  | { type: 'question'; title?: string; question: string; options: string[]; correctAnswer: string; explanation: string }
  | { type: 'fill_blank'; title?: string; text: string; correctAnswer: string; explanation: string }
  | { type: 'true_false'; title?: string; statement: string; correctAnswer: boolean; explanation: string }
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
