import type {
  AiBuilderAction,
  AiBuilderGenerationRequest,
  CodeCardBlock,
  CourseBuilderBlueprint,
  CourseBuilderLesson,
  CourseBuilderModule,
  CourseBuilderSelection,
  CourseDocumentChunk,
  CourseSourceDocument,
  LessonCardBlock,
} from '@/lib/api/course-builder-types';
import type { Course, LessonWithCourseId } from '@/lib/api/types';

export type AiBuilderGeneratedPatch = {
  documents?: CourseSourceDocument[];
  courseSummary?: CourseBuilderBlueprint['courseSummary'];
  assessments?: CourseBuilderBlueprint['assessments'];
  modules?: CourseBuilderModule[];
  lessons?: CourseBuilderLesson[];
  subLessons?: CourseBuilderLesson[];
  blocks?: LessonCardBlock[];
  block?: LessonCardBlock;
  valid?: boolean;
  issues?: string[];
  suggestions?: string[];
  quizPlan?: string[];
  changes?: string[];
};

export function buildAiGenerationRequest(params: {
  action: AiBuilderAction;
  currentBlueprint: CourseBuilderBlueprint;
  selection?: CourseBuilderSelection;
  selectedDocumentChunks?: CourseDocumentChunk[];
  count?: number;
  difficulty?: string;
  instruction?: string;
}): AiBuilderGenerationRequest {
  return {
    action: params.action,
    scope: scopeForAction(params.action),
    currentBlueprint: params.currentBlueprint,
    selectedScope: params.selection ? {
      moduleIndex: params.selection.moduleIndex,
      lessonIndex: params.selection.lessonIndex,
      subLessonIndex: params.selection.subLessonIndex ?? null,
      cardIndex: params.selection.cardIndex,
    } : undefined,
    selectedDocumentChunks: params.selectedDocumentChunks,
    count: params.count,
    difficulty: params.difficulty,
    instruction: params.instruction,
  };
}

export function applyAiGeneratedPatch(
  blueprint: CourseBuilderBlueprint,
  selection: CourseBuilderSelection,
  action: AiBuilderAction,
  patch: AiBuilderGeneratedPatch
): CourseBuilderBlueprint {
  const draft = structuredClone(blueprint);

  if (patch.documents?.length) {
    draft.documents = mergeDocuments(draft.documents ?? [], patch.documents);
  }

  if (patch.courseSummary && (action === 'course_plan' || action === 'suggest_improvements')) {
    draft.courseSummary = { ...draft.courseSummary, ...patch.courseSummary };
  }

  if (patch.assessments && (action === 'course_plan' || action === 'generate_questions')) {
    draft.assessments = { ...draft.assessments, ...patch.assessments };
  }

  if (patch.modules?.length && action === 'generate_modules') {
    draft.modules = [...draft.modules, ...patch.modules.map(normalizeModule)];
  }

  const module = draft.modules[selection.moduleIndex];
  if (!module) return draft;

  if (patch.lessons?.length && action === 'generate_lessons') {
    module.lessons = [...module.lessons, ...patch.lessons.map(normalizeLesson)];
  }

  const lesson = getSelectedLesson(draft, selection);
  if (!lesson) return draft;

  if (patch.subLessons?.length && action === 'generate_sub_lessons') {
    lesson.subLessons = [...(lesson.subLessons ?? []), ...patch.subLessons.map(normalizeLesson)];
  }

  if (patch.blocks?.length && (action === 'generate_cards' || action === 'generate_questions')) {
    lesson.blocks = [...lesson.blocks, ...patch.blocks.map(normalizeCard)];
  }

  if (patch.block && action === 'generate_single_card') {
    lesson.blocks.push(normalizeCard(patch.block));
  }

  if (patch.block && (action === 'repair_card' || action === 'generate_code_card')) {
    if (lesson.blocks[selection.cardIndex]) {
      lesson.blocks[selection.cardIndex] = normalizeCard(patch.block);
    } else {
      lesson.blocks.push(normalizeCard(patch.block));
    }
  }

  return draft;
}

export function courseAndLessonsToBuilderBlueprint(course: Course, lessons: LessonWithCourseId[]): CourseBuilderBlueprint {
  const moduleTitles = course.modules?.length ? course.modules.map((module) => module.title) : ['Existing course content'];
  const modules: CourseBuilderModule[] = moduleTitles.map((title, index) => ({
    title: title || `Module ${index + 1}`,
    description: course.modules?.[index]?.description || `Content imported from ${course.title}.`,
    durationMinutes: 60,
    outcomes: [],
    moduleAssessment: 'Review the lessons in this module.',
    lessons: [],
  }));

  const fallbackModule = modules[0];
  lessons.forEach((lesson, index) => {
    const moduleIndex = inferModuleIndex(lesson, moduleTitles, index, modules.length);
    const targetModule = modules[moduleIndex] ?? fallbackModule;
    targetModule.lessons.push(lessonToBuilderLesson(lesson, index));
  });

  if (!lessons.length && course.lessons?.length) {
    course.lessons.forEach((lesson, index) => {
      fallbackModule.lessons.push(normalizeLesson({
        title: lesson.title || `Lesson ${index + 1}`,
        summary: lesson.summary || 'Imported lesson summary.',
        durationMinutes: 20,
        difficulty: course.level || 'beginner',
        outcomes: [],
        blocks: [{ type: 'explanation', title: lesson.title || `Lesson ${index + 1}`, body: lesson.summary || 'Add content for this lesson.' }],
        subLessons: [],
        activities: [],
        assessment: 'Lesson checkpoint.',
      }));
    });
  }

  return {
    courseSummary: {
      title: course.title || 'Untitled short course',
      audience: 'Short-course learners',
      level: course.level || 'beginner',
      description: course.description || 'Imported existing short course.',
      prerequisites: [],
      totalDurationHours: Number(course.durationHours || Math.max(1, Math.ceil(lessons.length / 3))),
      outcomes: course.outcomes?.length ? course.outcomes : ['Complete the imported course lessons.'],
      finalAssessment: 'Final course assessment.',
      certificateCriteria: 'Complete all required lessons and assessments.',
    },
    assessments: {
      quizzes: [],
      practicalWork: [],
      instructorReviewChecklist: ['Review imported lessons before publishing updates.'],
    },
    modules: modules.map(normalizeModule),
    documents: [],
  };
}

export function chunkSourceDocument(document: Pick<CourseSourceDocument, 'id' | 'name' | 'mode' | 'text' | 'warning'>, chunkSize = 1800): CourseSourceDocument {
  const text = document.text ?? '';
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: CourseDocumentChunk[] = [];
  let buffer = '';
  let order = 0;

  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    if ((buffer + '\n\n' + paragraph).length > chunkSize && buffer.trim()) {
      chunks.push({ id: `${document.id}-chunk-${order + 1}`, documentId: document.id, title: `${document.name} chunk ${order + 1}`, text: buffer.trim(), order });
      buffer = paragraph;
      order += 1;
    } else {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    }
  }

  if (buffer.trim()) {
    chunks.push({ id: `${document.id}-chunk-${order + 1}`, documentId: document.id, title: `${document.name} chunk ${order + 1}`, text: buffer.trim(), order });
  }

  return {
    ...document,
    chunks,
    outline: inferOutline(text),
    detectedTopics: inferTopics(text),
    detectedDifficulty: inferDifficulty(text),
    text: undefined,
  };
}

export function getSelectedLesson(blueprint: CourseBuilderBlueprint, selection: CourseBuilderSelection): CourseBuilderLesson | null {
  const parentLesson = blueprint.modules[selection.moduleIndex]?.lessons[selection.lessonIndex];
  if (!parentLesson) return null;
  return selection.subLessonIndex == null ? parentLesson : parentLesson.subLessons?.[selection.subLessonIndex] ?? null;
}

function lessonToBuilderLesson(lesson: LessonWithCourseId, index: number): CourseBuilderLesson {
  const blocks = blocksFromLesson(lesson);
  return normalizeLesson({
    title: lesson.title || `Lesson ${index + 1}`,
    summary: typeof (lesson as Record<string, unknown>).summary === 'string' ? String((lesson as Record<string, unknown>).summary) : stripHtml(lesson.content || 'Imported lesson.'),
    durationMinutes: Number((lesson as Record<string, unknown>).estimatedMinutes || 20),
    difficulty: typeof (lesson as Record<string, unknown>).difficulty === 'string' ? String((lesson as Record<string, unknown>).difficulty) : 'beginner',
    outcomes: [],
    blocks,
    subLessons: [],
    activities: [],
    assessment: 'Lesson checkpoint.',
  });
}

function blocksFromLesson(lesson: LessonWithCourseId): LessonCardBlock[] {
  const objectBlocks = lesson.learningObjects?.flatMap((object) => {
    const payloadBlocks = blocksFromUnknown(object.payload);
    if (payloadBlocks.length) return payloadBlocks;
    const bodyBlocks = blocksFromUnknown(parseMaybeJson(object.body));
    if (bodyBlocks.length) return bodyBlocks;
    if (object.body && object.type !== 'video') return [{ type: 'explanation', title: object.title, body: stripHtml(object.body) } as LessonCardBlock];
    return [];
  }) ?? [];
  if (objectBlocks.length) return objectBlocks;

  const contentBlocks = blocksFromUnknown(parseMaybeJson(lesson.content));
  if (contentBlocks.length) return contentBlocks;

  const fallback: LessonCardBlock[] = [{ type: 'explanation', title: lesson.title || 'Imported lesson', body: stripHtml(lesson.content || 'Review this imported lesson.') }];
  lesson.quiz?.questions?.slice(0, 6).forEach((question, questionIndex) => {
    fallback.push({
      type: 'question',
      title: `Imported question ${questionIndex + 1}`,
      question: question.question,
      options: question.options,
      correctAnswer: question.answer ?? question.options[0] ?? '',
      explanation: 'Review the imported lesson content before answering.',
    });
  });
  return fallback;
}

function blocksFromUnknown(value: unknown): LessonCardBlock[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const direct = [
    ...(Array.isArray(record.blocks) ? record.blocks as LessonCardBlock[] : []),
    ...(Array.isArray(record.cards) ? record.cards as LessonCardBlock[] : []),
  ];
  const nested = [
    ...blocksFromSections(record.sections),
    ...blocksFromSections(record.subLessons),
    ...blocksFromSections(record.sub_lessons),
    ...blocksFromSections(record.topics),
    ...blocksFromSections(record.lessons),
  ];
  if (record.lesson && typeof record.lesson === 'object') return [...direct, ...blocksFromUnknown(record.lesson), ...nested];
  return [...direct, ...nested];
}

function blocksFromSections(value: unknown): LessonCardBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section, index) => {
    if (!section || typeof section !== 'object') return [];
    const record = section as Record<string, unknown>;
    const title = String(record.title ?? record.name ?? `Sub-lesson ${index + 1}`);
    const intro: LessonCardBlock = { type: 'summary', title, body: String(record.description ?? record.summary ?? 'Imported sub-lesson.') };
    return [intro, ...blocksFromUnknown(record)];
  });
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function inferModuleIndex(lesson: LessonWithCourseId, moduleTitles: string[], lessonIndex: number, moduleCount: number) {
  const lessonRecord = lesson as Record<string, unknown>;
  const directIndex = Number(lessonRecord.moduleIndex ?? lessonRecord.module_index);
  if (Number.isInteger(directIndex) && directIndex >= 0 && directIndex < moduleCount) return directIndex;
  const moduleTitle = String(lessonRecord.moduleTitle ?? lessonRecord.module_title ?? '').toLowerCase();
  const found = moduleTitles.findIndex((title) => title.toLowerCase() === moduleTitle);
  if (found >= 0) return found;
  return moduleCount > 1 ? Math.min(moduleCount - 1, Math.floor(lessonIndex / Math.max(1, Math.ceil((lessonRecord.totalLessons as number || 1) / moduleCount)))) : 0;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function scopeForAction(action: AiBuilderAction): AiBuilderGenerationRequest['scope'] {
  if (['document_map', 'course_plan', 'generate_modules', 'validate_course', 'suggest_improvements'].includes(action)) return 'course';
  if (action === 'generate_lessons') return 'module';
  if (['generate_sub_lessons', 'generate_cards', 'generate_questions', 'generate_code_card'].includes(action)) return 'lesson';
  return 'card';
}

function mergeDocuments(existing: CourseSourceDocument[], incoming: CourseSourceDocument[]) {
  const byId = new Map(existing.map((document) => [document.id, document]));
  for (const document of incoming) byId.set(document.id, { ...byId.get(document.id), ...document });
  return Array.from(byId.values());
}

function normalizeModule(module: CourseBuilderModule): CourseBuilderModule {
  return {
    title: module.title || 'Untitled module',
    description: module.description || 'Module description.',
    durationMinutes: Number(module.durationMinutes || 60),
    outcomes: module.outcomes?.length ? module.outcomes : ['Complete this module.'],
    moduleAssessment: module.moduleAssessment || 'Module review activity.',
    sourceChunkIds: module.sourceChunkIds ?? [],
    lessons: (module.lessons ?? []).map(normalizeLesson),
  };
}

function normalizeLesson(lesson: CourseBuilderLesson): CourseBuilderLesson {
  return {
    title: lesson.title || 'Untitled lesson',
    summary: lesson.summary || 'Lesson summary.',
    durationMinutes: Number(lesson.durationMinutes || 20),
    difficulty: lesson.difficulty || 'beginner',
    outcomes: lesson.outcomes ?? [],
    blocks: (lesson.blocks?.length ? lesson.blocks : [{ type: 'explanation', title: 'Core idea', body: 'Explain this lesson clearly.' }]).map(normalizeCard),
    subLessons: lesson.subLessons?.map(normalizeLesson) ?? [],
    activities: lesson.activities ?? [],
    assessment: lesson.assessment || 'Lesson checkpoint.',
    sourceChunkIds: lesson.sourceChunkIds ?? [],
  };
}

function normalizeCard(card: LessonCardBlock): LessonCardBlock {
  if (isCodingCard(card)) {
    return {
      ...card,
      type: card.type === 'mini_project' ? 'code_mini_project' : card.type,
      title: card.title || 'Coding practice',
      instructions: card.instructions || 'Complete the coding task.',
      language: card.language || 'javascript',
      files: card.files?.length ? card.files : [{ name: defaultFileName(card.language || 'javascript'), content: '' }],
      tests: card.tests ?? [],
      hints: card.hints ?? [],
      solutionFiles: card.solutionFiles ?? [],
      previewMode: card.previewMode ?? defaultPreviewMode(card.language || 'javascript'),
      aiHelpEnabled: card.aiHelpEnabled ?? true,
    };
  }
  return card;
}

function isCodingCard(card: LessonCardBlock): card is CodeCardBlock {
  return ['code_playground', 'debug_code', 'complete_code', 'predict_output', 'code_explanation', 'code_mini_project', 'mini_project'].includes(card.type);
}

function defaultFileName(language: string) {
  if (language === 'html') return 'index.html';
  if (language === 'css') return 'style.css';
  if (language === 'python') return 'main.py';
  if (language === 'php') return 'index.php';
  return 'main.js';
}

function defaultPreviewMode(language: string) {
  if (language === 'html') return 'html' as const;
  if (['javascript', 'python', 'php'].includes(language)) return 'console' as const;
  return 'none' as const;
}

function inferOutline(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(chapter|unit|module|lesson|topic|section)\b/i.test(line) || /^\d+(\.\d+)*\s+/.test(line))
    .slice(0, 40);
}

function inferTopics(text: string) {
  const matches = text.match(/\b[A-Z][A-Za-z0-9+#/. -]{3,40}\b/g) ?? [];
  return Array.from(new Set(matches.map((item) => item.trim()).filter((item) => item.split(' ').length <= 5))).slice(0, 25);
}

function inferDifficulty(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('advanced') || lower.includes('capstone') || lower.includes('architecture')) return 'advanced';
  if (lower.includes('intermediate') || lower.includes('project')) return 'intermediate';
  return 'beginner';
}
