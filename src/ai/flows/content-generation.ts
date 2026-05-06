// src/ai/flows/content-generation.ts
'use server';
/**
 * @fileOverview AI content factory for generating reviewable learning objects.
 *
 * - generateCourseContent - Generates notes, slides, video scripts, flashcards,
 *   quizzes, assignments, rubrics, study guides, and exercises with governance metadata.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createDraftLearningObject } from '@/lib/ai-content-factory';
import type { GenerateContentInput, GenerateContentOutput, LearningObjectType } from '@/lib/schemas';
import { GenerateContentInputSchema, GenerateContentOutputSchema } from '@/lib/schemas';

export async function generateCourseContent(
  input: GenerateContentInput
): Promise<GenerateContentOutput> {
  return generateContentFlow(input);
}

const contentFactoryPrompt = ai.definePrompt({
  name: 'contentFactoryPrompt',
  input: {
    schema: z.object({
      topic: z.string(),
      contentType: z.string(),
      sourceMaterial: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      title: z.string(),
      content: z.string(),
    }),
  },
  prompt: `You are an expert university AI content factory.
Generate one high-quality {{{contentType}}} learning object for this topic: {{{topic}}}.

{{#if sourceMaterial}}
Use this source material as the authoritative basis:
{{{sourceMaterial}}}
{{/if}}

Follow the format for the requested object:
- Notes: structured markdown notes with headings, examples, and misconceptions.
- Slides: markdown slide deck with slide numbers, titles, bullets, speaker notes, and visual suggestions.
- VideoScript: narration script with timestamps, scene directions, visual cues, and checks for understanding.
- Flashcards: JSON array of cards with front, back, hint, and difficulty.
- Quiz: strict JSON with title and questions, each with question, options, answer, and rationale.
- Assignment: markdown brief with scenario, tasks, deliverables, marking criteria, and submission checklist.
- Rubric: markdown table with criteria, weightings, performance bands, and feedback guidance.
- StudyGuide: structured markdown guide with objectives, key concepts, worked examples, practice tasks, and revision plan.
- Exercise: practical exercise with instructions, starter code when relevant, expected outcome, and extension task.

Return only the title and content fields in the output schema.`,
});

function fallbackTitle(contentType: LearningObjectType, topic: string) {
  return `${contentType}: ${topic}`;
}

const generateContentFlow = ai.defineFlow(
  {
    name: 'generateContentFlow',
    inputSchema: GenerateContentInputSchema,
    outputSchema: GenerateContentOutputSchema,
  },
  async (input) => {
    const { output } = await contentFactoryPrompt({
      topic: input.topic,
      contentType: input.contentType,
      sourceMaterial: input.sourceMaterial,
    });

    const title = output?.title?.trim() || fallbackTitle(input.contentType, input.topic);
    const content = output?.content?.trim() || '';
    const prompt = [
      `Generate ${input.contentType} for: ${input.topic}`,
      input.sourceMaterial ? `Source material: ${input.sourceMaterial}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content,
      learningObject: createDraftLearningObject({
        type: input.contentType,
        title,
        content,
        prompt,
        generatorFlow: 'generateContentFlow',
        generatedBy: input.generatedBy,
        sourceMaterial: input.sourceMaterial,
        programmeContent: input.programmeContent,
      }),
    };
  }
);
