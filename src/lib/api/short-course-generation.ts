import { apiFetch } from '@/lib/api/client';
import type { AiBuilderAction, AiBuilderGenerationRequest, CourseBuilderBlueprint } from '@/lib/api/course-builder-types';

export type ShortCourseGenerationResponse = {
  text?: string;
  output?: string;
  content?: string;
  action?: AiBuilderAction;
  blueprint?: Partial<CourseBuilderBlueprint>;
  payload?: unknown;
  [key: string]: unknown;
};

export type ShortCourseGenerationPayload = {
  prompt: string;
  mode?: string;
  model?: string;
  context?: string;
  approvedMaterials?: string;
  accessTier?: string;
  feature?: string;
  audience?: string;
  brandContext?: string;
  action?: AiBuilderAction;
  builderRequest?: AiBuilderGenerationRequest;
};

export async function generateShortCourseContent(payload: ShortCourseGenerationPayload): Promise<ShortCourseGenerationResponse> {
  return apiFetch('/admin/short-courses/ai-generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function buildStepwiseAiBuilderPrompt(request: AiBuilderGenerationRequest): string {
  const selectedChunks = Array.isArray(request.selectedDocumentChunks)
    ? request.selectedDocumentChunks.map((chunk, index) => typeof chunk === 'string' ? `CHUNK ${index + 1}: ${chunk}` : `CHUNK ${chunk.id}: ${chunk.title ?? 'Untitled'}\n${chunk.text}`).join('\n\n---\n\n')
    : '';

  return [
    'You are UnivAI controlled short-course builder. Return strict JSON only.',
    `Action: ${request.action}`,
    `Scope: ${request.scope}`,
    `Difficulty: ${request.difficulty ?? 'use course level'}`,
    `Count: ${request.count ?? 'use best judgement'}`,
    `Instruction: ${request.instruction ?? 'Generate only the requested selected section.'}`,
    'Current draft blueprint summary:',
    JSON.stringify(compactBlueprintForAi(request.currentBlueprint), null, 2),
    'Selected scope:',
    JSON.stringify(request.selectedScope ?? {}, null, 2),
    'Selected document chunks:',
    selectedChunks || 'No chunks selected.',
    'Rules:',
    '- Generate only what the action asks for.',
    '- Keep the manual builder CourseBuilderBlueprint structure.',
    '- Avoid duplicate modules, lessons, and cards.',
    '- Use first-class coding card types for coding content.',
    '- Coding cards need language, instructions, files, tests, hints, solutionFiles, expectedOutput when relevant, previewMode, and aiHelpEnabled.',
    '- Use selected document chunks only when chunks are supplied.',
    'Return JSON matching the requested action: modules, lessons, subLessons, blocks, block, documents, validation issues, or suggestions.'
  ].join('\n');
}

function compactBlueprintForAi(blueprint: Partial<CourseBuilderBlueprint>) {
  return {
    courseSummary: blueprint.courseSummary,
    modules: (blueprint.modules ?? []).map((module) => ({
      title: module.title,
      description: module.description,
      lessons: (module.lessons ?? []).map((lesson) => ({
        title: lesson.title,
        summary: lesson.summary,
        subLessons: (lesson.subLessons ?? []).map((subLesson) => subLesson.title),
        cardTypes: (lesson.blocks ?? []).map((block) => block.type),
      })),
    })),
    documents: (blueprint.documents ?? []).map((document) => ({
      id: document.id,
      name: document.name,
      outline: document.outline,
      detectedTopics: document.detectedTopics,
      detectedDifficulty: document.detectedDifficulty,
      chunks: document.chunks?.map((chunk) => ({ id: chunk.id, title: chunk.title, order: chunk.order, topicTags: chunk.topicTags })),
    })),
  };
}
