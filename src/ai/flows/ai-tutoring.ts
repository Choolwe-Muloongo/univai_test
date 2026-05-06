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

const AITutorInputSchema = z.object({
  question: z.string().describe('The student\'s question about the course material.'),
  courseMaterial: z.string().describe('The relevant course material for answering the question.'),
  accessTier: z.enum(['free', 'paid-certificate', 'premium', 'programme']).default('premium').describe('The student AI access tier.'),
  approvedModuleMaterials: z.string().optional().describe('Approved module materials that programme-student answers must be grounded in.'),
});
export type AITutorInput = z.infer<typeof AITutorInputSchema>;

const AITutorOutputSchema = z.object({
  answer: z.string().describe('The AI tutor\'s answer to the question.'),
});
export type AITutorOutput = z.infer<typeof AITutorOutputSchema>;

export async function aiTutor(input: AITutorInput): Promise<AITutorOutput> {
  return aiTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTutorPrompt',
  input: {schema: AITutorInputSchema},
  output: {schema: AITutorOutputSchema},
  prompt: `You are an AI tutor specializing in answering student questions about course material.

  Student AI access tier: {{{accessTier}}}

  You will use the provided course material to answer the student's question accurately and concisely.
  Free students receive limited, concise AI support and no cashback.
  Paid-certificate students receive certificate-focused explanations and revision support.
  Premium students receive advanced tutor, study plan, flashcards, mock exam, and weak-area support.
  Programme students must receive answers grounded in approved module materials; if the materials do not support the answer, say that and ask for the relevant approved material.

  Course Material: {{{courseMaterial}}}

  Approved Module Materials: {{{approvedModuleMaterials}}}

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
    return output!;
  }
);
