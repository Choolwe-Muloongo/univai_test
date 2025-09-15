'use server';

import { z } from 'zod';
import { generatePersonalizedStudyPlan } from '@/ai/flows/personalized-study-plan-generation';
import { aiTutor } from '@/ai/flows/ai-tutoring';

const studyPlanSchema = z.object({
  learningHistory: z.string().min(10, { message: 'Please provide more details about your learning history.' }),
  goals: z.string().min(10, { message: 'Please provide more details about your goals.' }),
  availableTime: z.string().min(3, { message: 'Please specify your available time.' }),
});

export async function generateStudyPlanAction(prevState: any, formData: FormData) {
  const validatedFields = studyPlanSchema.safeParse({
    learningHistory: formData.get('learningHistory'),
    goals: formData.get('goals'),
    availableTime: formData.get('availableTime'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      studyPlan: null,
    };
  }

  try {
    const result = await generatePersonalizedStudyPlan(validatedFields.data);
    return { message: 'Success', studyPlan: result.studyPlan, errors: null };
  } catch (error) {
    return { message: 'An error occurred while generating the plan.', studyPlan: null, errors: null };
  }
}

const tutorSchema = z.object({
  question: z.string().min(5, { message: 'Please ask a more detailed question.' }),
  courseMaterial: z.string().min(10, { message: 'Please provide more context from your course material.' }),
});


export async function aiTutorAction(prevState: any, formData: FormData) {
    const validatedFields = tutorSchema.safeParse({
        question: formData.get('question'),
        courseMaterial: formData.get('courseMaterial'),
    });

    if (!validatedFields.success) {
        return {
          message: 'Validation failed',
          errors: validatedFields.error.flatten().fieldErrors,
          answer: null,
        };
      }
    
      try {
        const result = await aiTutor(validatedFields.data);
        return { message: 'Success', answer: result.answer, errors: null };
      } catch (error) {
        return { message: 'An error occurred while getting an answer.', answer: null, errors: null };
      }
}
