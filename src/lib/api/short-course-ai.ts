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
    request.courseTitle ? `Course: ${request.courseTitle}` : '',
    request.lessonTitle ? `Lesson: ${request.lessonTitle}` : '',
    request.currentCardTitle ? `Card: ${request.currentCardTitle}` : '',
    request.currentCardType ? `Card type: ${request.currentCardType}` : '',
    request.currentCardText ? `Card content: ${request.currentCardText}` : '',
    typeof request.progress === 'number' ? `Progress: ${request.progress}%` : '',
  ].filter(Boolean).join('\n');

  return apiFetch<ShortCourseAiResponse>(`/students/me/short-courses/${request.courseId}/ai`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: request.prompt,
      mode: request.mode ?? 'tutor',
      context: contextParts,
      accessTier: 'short-course',
      feature: 'short_course_ai',
      courseId: request.courseId,
      shortCourseId: request.courseId,
      audience: 'Short-course student.',
    }),
  });
}
