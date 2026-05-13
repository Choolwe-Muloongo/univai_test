'use server';

import { z } from 'zod';
import { GenerateContentInputSchema } from '@/lib/schemas';
import { createDraftLearningObject } from '@/lib/ai-content-factory';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

async function callAi(prompt: string, mode: string, context?: string | null, approvedMaterials?: string | null, accessTier?: string | null, feature?: string | null, brandContext?: string | null, audience?: string | null) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      mode,
      context: context || undefined,
      approvedMaterials: approvedMaterials || undefined,
      accessTier: accessTier || undefined,
      feature: feature || undefined,
      brandContext: brandContext || undefined,
      audience: audience || undefined,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'AI request failed');
  }

  const data = await response.json();
  return data.text as string;
}


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
    const { learningHistory, goals, availableTime } = validatedFields.data;
    const context = (formData.get('context') as string) || null;
    const accessTier = (formData.get('accessTier') as string) || null;
    const prompt = `Create a 4-week study plan for a university student.
Learning history: ${learningHistory}
Goals: ${goals}
Weekly time allocation: ${availableTime}
Return a structured plan with weeks and bullet points.`;
    const plan = await callAi(prompt, 'lesson', context, null, accessTier, 'studyPlan');
    return { message: 'Success', studyPlan: plan, errors: null };
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
        const { question, courseMaterial } = validatedFields.data;
        const context = (formData.get('context') as string) || null;
        const accessTier = (formData.get('accessTier') as string) || null;
        const moduleContext = (formData.get('moduleContext') as string) || '';
        const moduleBlock = moduleContext ? `Module context: ${moduleContext}\n` : '';
        const prompt = `Student question: ${question}
${moduleBlock}Course material: ${courseMaterial}
Respond with a clear, step-by-step explanation and a short check-for-understanding question.`;
        const answer = await callAi(prompt, 'tutor', context, courseMaterial, accessTier, 'tutor');
        return { message: 'Success', answer, errors: null };
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
        const { code } = validatedFields.data;
        const context = (formData.get('context') as string) || null;
        const prompt = `Review the following code for issues, improvements, and best practices. Provide feedback and a corrected version.
Code:
${code}`;
        const feedback = await callAi(prompt, 'summary', context);
        return {
          message: 'Success',
          errors: null,
          feedback,
          correctedCode: code,
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
        const sourceMaterial = (formData.get('sourceMaterial') as string) || '';
        const intakeName = (formData.get('intakeName') as string) || '';
        void sourceMaterial;
        void intakeName;
        return { 
          message: 'Success', 
          errors: null,
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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

const lectureScriptSchema = z.object({
  topic: z.string().min(5, { message: 'Please provide a clearer lesson topic.' }),
});

export async function generateLectureScriptAction(prevState: any, formData: FormData) {
  const validatedFields = lectureScriptSchema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      script: null,
    };
  }

  try {
    const { topic } = validatedFields.data;
    const context = (formData.get('context') as string) || null;
    const sourceMaterial = (formData.get('sourceMaterial') as string) || '';
    const intakeName = (formData.get('intakeName') as string) || '';
    const intakeBlock = intakeName ? `Intake context: ${intakeName}\n` : '';
    const sourceBlock = sourceMaterial ? `Use the following source material:\n${sourceMaterial}\n` : '';
    const prompt = `${intakeBlock}${sourceBlock}Create a clear lecture script for "${topic}".
Include:
1) Hook (1-2 sentences)
2) Learning objectives (3-5 bullets)
3) Section-by-section narration with timestamps (approximate)
4) Visual cues or slides per section
5) 3 quick check questions
6) Short wrap-up summary.
Return in markdown with headings.`;
    const script = await callAi(prompt, 'lesson', context);
    const learningObject = createDraftLearningObject({
      type: 'VideoScript',
      title: `Lecture script: ${topic}`,
      content: script,
      prompt,
      generatorFlow: 'generateLectureScriptAction',
      generatedBy: 'lecturer-ai-console',
      sourceMaterial,
      programmeContent: true,
    });
    return { message: 'Success', errors: null, script, learningObject };
  } catch (error) {
    console.error('Lecture script generation error:', error);
    return {
      message: 'An error occurred while generating the lecture script.',
      errors: null,
      script: null,
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
        const { topic, contentType } = validatedFields.data;
        const context = (formData.get('context') as string) || null;
        const sourceMaterial = (formData.get('sourceMaterial') as string) || '';
        const intakeName = (formData.get('intakeName') as string) || '';
        const intakeBlock = intakeName ? `Intake context: ${intakeName}\n` : '';
        const sourceBlock = sourceMaterial ? `Use the following source material:\n${sourceMaterial}\n` : '';
        const brandContext = 'Apply UnivAI branding. For any material that goes to students or the public, include review-required status, support contact, accessible language, and do not invent policy/accreditation claims.';
        const modeByType: Record<string, string> = {
          Quiz: 'quiz',
          VideoScript: 'video',
          Video: 'video',
          PublicNotice: 'public-notice',
          AdmissionsLetter: 'admissions-letter',
          Email: 'email',
          Document: 'document',
          Notes: 'document',
          Slides: 'document',
          Assignment: 'lesson',
          Rubric: 'document',
          StudyGuide: 'document',
          Flashcards: 'quiz',
          Exercise: 'lesson',
        };
        const promptByType: Record<string, string> = {
          Quiz: `${intakeBlock}${sourceBlock}Create a 5-question multiple-choice UnivAI quiz about "${topic}". Return strict JSON only in this schema: {"title":"string","questions":[{"question":"string","options":["A","B","C","D"],"answer":"string","rationale":"string"}]}`,
          VideoScript: `${intakeBlock}${sourceBlock}Create a UnivAI-branded video package for "${topic}" with objectives, narration script, storyboard, on-screen text, captions, thumbnail prompt, and production notes.`,
          Video: `${intakeBlock}${sourceBlock}Create a UnivAI-branded video package for "${topic}" with objectives, narration script, storyboard, on-screen text, captions, thumbnail prompt, and production notes.`,
          PublicNotice: `${intakeBlock}${sourceBlock}Create a UnivAI public notice about "${topic}" with headline, plain-language summary, details, next steps, support contact, and review-required note.`,
          AdmissionsLetter: `${intakeBlock}${sourceBlock}Create a UnivAI admissions letter draft about "${topic}" using only provided facts. Include placeholders for missing reference/program/intake data and mark as review-required.`,
          Email: `${intakeBlock}${sourceBlock}Create a UnivAI-branded email about "${topic}" with subject, preview text, greeting, body, CTA, support contact, and footer.`,
          Document: `${intakeBlock}${sourceBlock}Create a UnivAI-branded document about "${topic}" with purpose, audience, body, next steps, review status, and support contact.`,
          Notes: `${intakeBlock}${sourceBlock}Create UnivAI study notes about "${topic}" with outcomes, explanation, examples, key terms, and review questions.`,
          Slides: `${intakeBlock}${sourceBlock}Create a UnivAI slide outline about "${topic}" with slide titles, bullets, speaker notes, accessibility notes, and activity prompts.`,
          Assignment: `${intakeBlock}${sourceBlock}Create a UnivAI assignment brief for "${topic}" with instructions, deliverables, rubric summary, due-date placeholder, and academic integrity note.`,
          Rubric: `${intakeBlock}${sourceBlock}Create a UnivAI assessment rubric for "${topic}" with criteria, levels, points, feedback guidance, and moderation note.`,
          StudyGuide: `${intakeBlock}${sourceBlock}Create a UnivAI study guide for "${topic}" with weekly plan, resources, practice tasks, and self-check questions.`,
          Flashcards: `${intakeBlock}${sourceBlock}Create UnivAI flashcards for "${topic}" as strict JSON: {"title":"string","cards":[{"front":"string","back":"string"}]}`,
          Exercise: `${intakeBlock}${sourceBlock}Create a practical UnivAI exercise for "${topic}". Provide instructions, expected outcome, support notes, and marking guidance.`,
        };
        const prompt = promptByType[contentType] ?? promptByType.Document;
        const mode = modeByType[contentType] ?? 'document';
        const content = await callAi(prompt, mode, context, sourceMaterial, 'programme', 'publicComms', brandContext, 'students and public stakeholders');
        const learningObject = createDraftLearningObject({
          type: contentType,
          title: `${contentType}: ${topic}`,
          content,
          prompt,
          generatorFlow: 'generateContentAction',
          generatedBy: 'lecturer-ai-console',
          sourceMaterial,
          programmeContent: true,
        });
        return { message: 'Success', errors: null, content, learningObject };
      } catch (error) {
        console.error('Content generation error:', error);
        return { 
            message: 'An error occurred while generating content. Please try again later.', 
            errors: null,
            content: null
        };
      }
}


export async function updateLessonContent(courseId: string, lessonId: string, data: Record<string, any>) {
  try {
    void courseId;
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to update lesson content');
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { success: false, error: "Failed to update lesson content." };
  }
}
