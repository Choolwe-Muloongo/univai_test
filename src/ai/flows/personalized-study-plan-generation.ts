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
import { createDraftLearningObject } from '@/lib/ai-content-factory';

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
  accessTier: z.enum(['free', 'paid-certificate', 'premium', 'programme']).default('premium').describe('The student AI access tier.'),
  approvedModuleMaterials: z.string().optional().describe('Approved module materials that programme-student plans should use as boundaries.'),
});
export type PersonalizedStudyPlanInput = z.infer<typeof PersonalizedStudyPlanInputSchema>;

const PersonalizedStudyPlanPromptOutputSchema = z.object({
  studyPlan: z.string().describe('A personalized study plan for the student, including specific topics to study, resources to use, and a schedule to follow.'),
});

const PersonalizedStudyPlanOutputSchema = PersonalizedStudyPlanPromptOutputSchema.extend({
  learningObject: z.any().describe('Governed learning-object record with metadata and approval status.'),
});
export type PersonalizedStudyPlanOutput = z.infer<typeof PersonalizedStudyPlanOutputSchema>;

export async function generatePersonalizedStudyPlan(input: PersonalizedStudyPlanInput): Promise<PersonalizedStudyPlanOutput> {
  return generatePersonalizedStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedStudyPlanPrompt',
  input: {schema: PersonalizedStudyPlanInputSchema},
  output: {schema: PersonalizedStudyPlanPromptOutputSchema},
  prompt: `You are an AI-powered study plan generator. You will take a student's learning history, goals, available time, and AI access tier to generate an appropriate study plan.

Free students should receive only brief next-step guidance and no cashback. Paid-certificate students should receive certificate-focused plans. Premium students should receive advanced tutor, study plan, flashcard, mock exam, and weak-area support. Programme students should receive plans grounded in approved module materials.

Learning History: {{{learningHistory}}}
Goals: {{{goals}}}
Available Time: {{{availableTime}}}
AI Access Tier: {{{accessTier}}}
Approved Module Materials: {{{approvedModuleMaterials}}}

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
    const studyPlan = output!.studyPlan;
    return {
      studyPlan,
      learningObject: createDraftLearningObject({
        type: 'StudyPlan',
        title: 'Personalized Study Plan',
        content: studyPlan,
        prompt: `Learning history: ${input.learningHistory}\nGoals: ${input.goals}\nAvailable time: ${input.availableTime}`,
        generatorFlow: 'generatePersonalizedStudyPlanFlow',
        sourceMaterial: input.learningHistory,
        programmeContent: false,
      }),
    };
  }
);
