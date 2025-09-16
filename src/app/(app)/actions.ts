'use server';

import { z } from 'zod';
import { generatePersonalizedStudyPlan } from '@/ai/flows/personalized-study-plan-generation';
import { aiTutor } from '@/ai/flows/ai-tutoring';
import { analyzeCode } from '@/ai/flows/code-analysis';
import { generateVideoLecture } from '@/ai/flows/video-generation';
import { generateCourseContent } from '@/ai/flows/content-generation';
import { GenerateContentInputSchema } from '@/lib/schemas';


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

const codeAnalysisSchema = z.object({
    code: z.string().min(10, { message: 'Please provide some code to analyze.' }),
    language: z.string(),
});

export async function analyzeCodeAction(prevState: any, formData: FormData) {
    const validatedFields = codeAnalysisSchema.safeParse({
        code: formData.get('code'),
        language: formData.get('language'),
    });

    if (!validatedFields.success) {
        return {
          message: 'Validation failed',
          errors: validatedFields.error.flatten().fieldErrors,
          feedback: null,
          correctedCode: null,
        };
      }
    
      try {
        const result = await analyzeCode(validatedFields.data);
        return { 
            message: 'Success', 
            errors: null,
            feedback: result.feedback,
            correctedCode: result.correctedCode,
        };
      } catch (error) {
        return { 
            message: 'An error occurred while analyzing the code.', 
            errors: null,
            feedback: null,
            correctedCode: null
        };
      }
}

const videoGenerationSchema = z.object({
    prompt: z.string().min(10, { message: 'Please provide a more detailed prompt for the video.' }),
});

export async function generateVideoAction(prevState: any, formData: FormData) {
    const validatedFields = videoGenerationSchema.safeParse({
        prompt: formData.get('prompt'),
    });

    if (!validatedFields.success) {
        return {
          message: 'Validation failed',
          errors: validatedFields.error.flatten().fieldErrors,
          videoUrl: null,
        };
      }
    
      try {
        const result = await generateVideoLecture(validatedFields.data);
        return { 
            message: 'Success', 
            errors: null,
            videoUrl: result.videoUrl,
        };
      } catch (error) {
        console.error('Video generation error:', error);
        return { 
            message: 'An error occurred while generating the video. Please try again later.', 
            errors: null,
            videoUrl: null
        };
      }
}

const contentGenerationSchema = GenerateContentInputSchema;

export async function generateContentAction(prevState: any, formData: FormData) {
    const validatedFields = contentGenerationSchema.safeParse({
        topic: formData.get('topic'),
        contentType: formData.get('contentType'),
    });

    if (!validatedFields.success) {
        return {
          message: 'Validation failed',
          errors: validatedFields.error.flatten().fieldErrors,
          content: null,
        };
      }
    
      try {
        const result = await generateCourseContent(validatedFields.data);
        return { 
            message: 'Success', 
            errors: null,
            content: result.content,
        };
      } catch (error) {
        console.error('Content generation error:', error);
        return { 
            message: 'An error occurred while generating content. Please try again later.', 
            errors: null,
            content: null
        };
      }
}
