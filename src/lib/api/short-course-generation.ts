import { apiFetch } from '@/lib/api/client';

export type ShortCourseGenerationResponse = {
  text?: string;
  output?: string;
  content?: string;
  [key: string]: unknown;
};

export async function generateShortCourseContent(payload: {
  prompt: string;
  mode?: string;
  model?: string;
  context?: string;
  approvedMaterials?: string;
  accessTier?: string;
  feature?: string;
  audience?: string;
  brandContext?: string;
}): Promise<ShortCourseGenerationResponse> {
  return apiFetch('/admin/short-courses/ai-generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
