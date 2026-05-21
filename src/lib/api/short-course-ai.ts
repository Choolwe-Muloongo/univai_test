import { apiFetch } from '@/lib/api/client';

export type ShortCourseAiRequest = {
  prompt: string;
  courseId: string;
  lessonId?: string | null;
  courseTitle?: string | null;
  lessonTitle?: string | null;
  currentCardTitle?: string | null;
  currentCardType?: string | null;
  currentCardText?: string | null;
  progress?: number | null;
  mode?: 'tutor' | 'summary' | 'quiz' | 'lesson' | 'general';
  context?: string;
};

export type ShortCourseAiResponse = {
  text: string;
  quota?: unknown;
};

export async function askShortCourseAi(request: ShortCourseAiRequest): Promise<ShortCourseAiResponse> {
  const contextParts = [
    request.context,
    request.courseTitle ? `Course/Journey: ${request.courseTitle}` : '',
    request.lessonTitle ? `Current lesson/mission: ${request.lessonTitle}` : '',
    request.currentCardTitle ? `Current card: ${request.currentCardTitle}` : '',
    request.currentCardType ? `Current card type: ${request.currentCardType}` : '',
    request.currentCardText ? `Current card content: ${request.currentCardText}` : '',
    typeof request.progress === 'number' ? `Learner progress: ${request.progress}%` : '',
  ].filter(Boolean).join('\n');

  return apiFetch<ShortCourseAiResponse>('/ai/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt: request.prompt,
      mode: request.mode ?? 'tutor',
      context: contextParts,
      accessTier: 'short-course',
      feature: 'short_course_ai',
      courseId: request.courseId,
      shortCourseId: request.courseId,
      audience: 'Short-course student using the UnivAI student Journey interface.',
    }),
  });
}
