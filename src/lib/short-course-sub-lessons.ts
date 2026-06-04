import type { Lesson, LessonWithCourseId } from '@/lib/api/types';

type AnyBlock = Record<string, unknown>;

type LessonMeta = {
  isSubLesson: boolean;
  parentLessonTitle: string | null;
  parentLessonIndex: number | null;
  lessonIndex?: number;
};

export function mergeSubLessonsIntoLesson(parentLesson: LessonWithCourseId, lessonList: Lesson[]): LessonWithCourseId {
  const children = findSubLessonsForParent(parentLesson, lessonList);
  if (!children.length) return parentLesson;

  const payload = {
    blocks: readCardsFromLesson(parentLesson),
    subLessons: children.map((child, index) => ({
      title: child.title || `Sub-lesson ${index + 1}`,
      summary: readLessonSummary(child),
      description: readLessonSummary(child),
      cards: readCardsFromLesson(child),
    })),
  };

  return {
    ...parentLesson,
    content: JSON.stringify(payload),
    learningObjects: [{
      id: `${parentLesson.id}-sub-lessons`,
      type: 'content',
      title: parentLesson.title,
      description: parentLesson.title,
      body: JSON.stringify(payload),
      payload,
      version: 1,
      versionLabel: 'sub-lessons',
      isCurrent: true,
      isReusable: false,
      reviewStatus: 'approved',
      publicationStatus: 'published',
      position: 0,
      isRequired: true,
    }],
  };
}

export function isSubLesson(lesson: Lesson) {
  return getLessonMeta(lesson).isSubLesson;
}

function findSubLessonsForParent(parentLesson: Lesson, lessonList: Lesson[]) {
  const parentIndex = lessonList.findIndex((lesson) => String(lesson.id) === String(parentLesson.id));
  const parentMeta = getLessonMeta(parentLesson, parentIndex >= 0 ? parentIndex : undefined);
  const parentTitle = normalizeText(parentLesson.title);

  return lessonList.filter((candidate, candidateIndex) => {
    if (String(candidate.id) === String(parentLesson.id)) return false;

    const candidateMeta = getLessonMeta(candidate, candidateIndex);
    if (!candidateMeta.isSubLesson) return false;

    if (candidateMeta.parentLessonTitle && normalizeText(candidateMeta.parentLessonTitle) === parentTitle) {
      return true;
    }

    return parentMeta.lessonIndex !== undefined && candidateMeta.parentLessonIndex === parentMeta.lessonIndex;
  });
}

function getLessonMeta(lesson: Lesson, fallbackIndex?: number): LessonMeta {
  const row = lesson as unknown as Record<string, unknown>;
  const payload = firstPayload(lesson);

  return {
    isSubLesson: toBoolean(row.isSubLesson ?? row.is_sub_lesson ?? payload?.isSubLesson ?? payload?.is_sub_lesson),
    parentLessonTitle: toStringOrNull(row.parentLessonTitle ?? row.parent_lesson_title ?? payload?.parentLessonTitle ?? payload?.parent_lesson_title),
    parentLessonIndex: toNumberOrNull(row.parentLessonIndex ?? row.parent_lesson_index ?? payload?.parentLessonIndex ?? payload?.parent_lesson_index),
    lessonIndex: toNumberOrUndefined(row.lessonIndex ?? row.lesson_index ?? payload?.lessonIndex ?? payload?.lesson_index ?? fallbackIndex),
  };
}

function firstPayload(lesson: Lesson) {
  return lesson.learningObjects
    ?.map((object) => object.payload ?? parseMaybeJson(object.body))
    .find((value) => value && typeof value === 'object') as Record<string, unknown> | undefined;
}

function readCardsFromLesson(lesson: Lesson): AnyBlock[] {
  const objectCards = lesson.learningObjects?.flatMap((object) => {
    const fromPayload = readBlocksFromValue(object.payload);
    if (fromPayload.length) return fromPayload;

    const fromBody = readBlocksFromValue(parseMaybeJson(object.body));
    if (fromBody.length) return fromBody;

    if (object.body && object.type !== 'video') {
      return [{ type: 'explanation', title: object.title, body: stripHtml(object.body) }];
    }

    return [];
  }) ?? [];

  if (objectCards.length) return objectCards;

  const contentCards = readBlocksFromValue(parseMaybeJson(lesson.content));
  if (contentCards.length) return contentCards;

  const plainContent = stripHtml(lesson.content ?? '');
  return plainContent ? [{ type: 'explanation', title: lesson.title, body: plainContent }] : [];
}

function readBlocksFromValue(value: unknown): AnyBlock[] {
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;

  return [
    ...(Array.isArray(record.blocks) ? record.blocks as AnyBlock[] : []),
    ...(Array.isArray(record.cards) ? record.cards as AnyBlock[] : []),
    ...readSectionBlocks(record.sections),
    ...readSectionBlocks(record.subLessons),
    ...readSectionBlocks(record.sub_lessons),
    ...readSectionBlocks(record.topics),
    ...readSectionBlocks(record.lessons),
    ...(record.lesson && typeof record.lesson === 'object' ? readBlocksFromValue(record.lesson) : []),
  ];
}

function readSectionBlocks(value: unknown): AnyBlock[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((section, index) => {
    if (!section || typeof section !== 'object') return [];

    const record = section as Record<string, unknown>;
    const title = String(record.title ?? record.name ?? `Sub-lesson ${index + 1}`);

    const localBlocks = [
      ...(Array.isArray(record.blocks) ? record.blocks as AnyBlock[] : []),
      ...(Array.isArray(record.cards) ? record.cards as AnyBlock[] : []),
    ].map((block) => ({
      ...block,
      subLessonTitle: typeof block.subLessonTitle === 'string' ? block.subLessonTitle : title,
    }));

    return [
      ...localBlocks,
      ...readSectionBlocks(record.sections),
      ...readSectionBlocks(record.subLessons),
      ...readSectionBlocks(record.sub_lessons),
      ...readSectionBlocks(record.topics),
      ...readSectionBlocks(record.lessons),
    ];
  });
}

function readLessonSummary(lesson: Lesson) {
  const row = lesson as unknown as Record<string, unknown>;
  const directSummary = toStringOrNull(row.summary);
  if (directSummary) return directSummary;

  const content = stripHtml(lesson.content ?? '');
  if (content && !content.startsWith('{') && !content.startsWith('[')) return content.slice(0, 180);

  return null;
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function stripHtml(value: string) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toStringOrNull(value: unknown) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  return text || null;
}

function toNumberOrUndefined(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined;
  return Number.isFinite(number) ? number : undefined;
}

function toNumberOrNull(value: unknown) {
  const number = toNumberOrUndefined(value);
  return number === undefined ? null : number;
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return Boolean(value);
}

function normalizeText(value: string) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
