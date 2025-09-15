// src/ai/flows/personalized-study-plan-generation.ts
'use server';
/**
 * @fileOverview Generates a personalized study plan for a student based on their learning history and goals.
 *
 * - generatePersonalizedStudyPlan - A function that generates a personalized study plan.
 * - PersonalizedStudyPlanInput - The input type for the generatePersonalizedStudyPlan function.
 * - PersonalizedStudyPlanOutput - The return type for the generatePersonalizedStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedStudyPlanInputSchema = z.object({
  learningHistory: z
    .string()
    .describe('A summary of the student\'s learning history, including completed courses, grades, and areas of strength and weakness.'),
  goals: z
    .string()
    .describe('The student\'s learning goals, including specific topics they want to learn and career aspirations.'),
  availableTime: z
    .string()
    .describe('The amount of time the student has available to study each week.'),
});
export type PersonalizedStudyPlanInput = z.infer<typeof PersonalizedStudyPlanInputSchema>;

const PersonalizedStudyPlanOutputSchema = z.object({
  studyPlan: z.string().describe('A personalized study plan for the student, including specific topics to study, resources to use, and a schedule to follow.'),
});
export type PersonalizedStudyPlanOutput = z.infer<typeof PersonalizedStudyPlanOutputSchema>;

export async function generatePersonalizedStudyPlan(input: PersonalizedStudyPlanInput): Promise<PersonalizedStudyPlanOutput> {
  return generatePersonalizedStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedStudyPlanPrompt',
  input: {schema: PersonalizedStudyPlanInputSchema},
  output: {schema: PersonalizedStudyPlanOutputSchema},
  prompt: `You are an AI-powered study plan generator. You will take a student's learning history, goals, and available time, and generate a personalized study plan for them.

Learning History: {{{learningHistory}}}
Goals: {{{goals}}}
Available Time: {{{availableTime}}}

Based on this information, create a study plan that includes specific topics to study, resources to use, and a schedule to follow. The study plan should be realistic and achievable, given the student's available time and learning history.`,
});

const generatePersonalizedStudyPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedStudyPlanFlow',
    inputSchema: PersonalizedStudyPlanInputSchema,
    outputSchema: PersonalizedStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
