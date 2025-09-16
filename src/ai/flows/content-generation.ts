// src/ai/flows/content-generation.ts
'use server';
/**
 * @fileOverview A flow for generating educational content like quizzes and exercises using AI.
 *
 * - generateCourseContent - A function that handles the content generation process.
 * - GenerateContentInput - The input type for the function.
 * - GenerateContentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateContentInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate content.'),
  contentType: z.enum(['Quiz', 'Exercise']).describe('The type of content to generate.'),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

export const GenerateContentOutputSchema = z.object({
  content: z.string().describe('The generated content, formatted as a string. For quizzes, this should be a JSON string with questions and options.'),
});
export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

export async function generateCourseContent(
  input: GenerateContentInput
): Promise<GenerateContentOutput> {
  return generateContentFlow(input);
}

const quizPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    input: { schema: z.object({ topic: z.string() }) },
    output: { schema: z.object({ content: z.string() }) },
    prompt: `You are an expert quiz designer for university-level courses. Generate a 5-question multiple-choice quiz about the following topic: {{{topic}}}.

    Provide the output as a JSON string in the following format:
    {
      "title": "Quiz on {{{topic}}}",
      "questions": [
        {
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "answer": "..."
        }
      ]
    }
    
    The 'content' field in your output schema should contain this JSON as a string.
    `,
});

const exercisePrompt = ai.definePrompt({
    name: 'exerciseGenerationPrompt',
    input: { schema: z.object({ topic: z.string() }) },
    output: { schema: z.object({ content: z.string() }) },
    prompt: `You are an expert curriculum designer for university-level computer science courses. Create a simple Python coding exercise for the following topic: {{{topic}}}.

    Provide a function signature and a comment indicating where the student should write their code. Include a brief description of the task.
    
    The 'content' field in your output schema should contain only the Python code block as a string.
    `,
});


const generateContentFlow = ai.defineFlow(
  {
    name: 'generateContentFlow',
    inputSchema: GenerateContentInputSchema,
    outputSchema: GenerateContentOutputSchema,
  },
  async (input) => {
    if (input.contentType === 'Quiz') {
      const { output } = await quizPrompt({ topic: input.topic });
      return output!;
    } else {
      const { output } = await exercisePrompt({ topic: input.topic });
      return output!;
    }
  }
);
