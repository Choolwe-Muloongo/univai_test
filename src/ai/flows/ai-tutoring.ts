// Implemented by Gemini.
'use server';
/**
 * @fileOverview AI Tutoring flow that provides instant answers to student questions.
 *
 * - aiTutor - A function that handles the AI tutoring process.
 * - AITutorInput - The input type for the aiTutor function.
 * - AITutorOutput - The return type for the aiTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { createDraftLearningObject } from '@/lib/ai-content-factory';

const AITutorInputSchema = z.object({
  question: z.string().describe('The student\'s question about the course material.'),
  courseMaterial: z.string().describe('The relevant course material for answering the question.'),
});
export type AITutorInput = z.infer<typeof AITutorInputSchema>;

const AITutorPromptOutputSchema = z.object({
  answer: z.string().describe("The AI tutor's answer to the question."),
});

const AITutorOutputSchema = AITutorPromptOutputSchema.extend({
  learningObject: z.any().describe('Governed learning-object record with metadata and approval status.'),
});
export type AITutorOutput = z.infer<typeof AITutorOutputSchema>;

export async function aiTutor(input: AITutorInput): Promise<AITutorOutput> {
  return aiTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTutorPrompt',
  input: {schema: AITutorInputSchema},
  output: {schema: AITutorPromptOutputSchema},
  prompt: `You are an AI tutor specializing in answering student questions about course material.

  You will use the provided course material to answer the student's question accurately and concisely.

  Course Material: {{{courseMaterial}}}

  Question: {{{question}}}

  Answer:`,
});

const aiTutorFlow = ai.defineFlow(
  {
    name: 'aiTutorFlow',
    inputSchema: AITutorInputSchema,
    outputSchema: AITutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    const answer = output!.answer;
    return {
      answer,
      learningObject: createDraftLearningObject({
        type: 'TutorResponse',
        title: `Tutor response: ${input.question.slice(0, 60)}`,
        content: answer,
        prompt: `Question: ${input.question}\nCourse material: ${input.courseMaterial}`,
        generatorFlow: 'aiTutorFlow',
        sourceMaterial: input.courseMaterial,
        programmeContent: false,
      }),
    };
  }
);
