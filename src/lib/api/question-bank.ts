import { apiFetch } from '@/lib/api/client';

export type QuestionBankItem = {
  id?: number;
  courseId?: string | null;
  lessonId?: string | null;
  semester?: number | null;
  question: string;
  questionType?: string;
  options?: string[];
  answer?: string | null;
  explanation?: string | null;
  difficulty?: string;
  timeSeconds?: number;
  source?: string;
  tags?: string[];
};

export async function getQuestionBank(params: { courseId?: string; difficulty?: string; questionType?: string } = {}): Promise<QuestionBankItem[]> {
  const query = new URLSearchParams();
  if (params.courseId) query.set('courseId', params.courseId);
  if (params.difficulty) query.set('difficulty', params.difficulty);
  if (params.questionType) query.set('questionType', params.questionType);
  return apiFetch(`/admin/short-courses/question-bank${query.toString() ? `?${query.toString()}` : ''}`);
}

export async function createQuestionBankItem(payload: QuestionBankItem): Promise<QuestionBankItem> {
  return apiFetch('/admin/short-courses/question-bank', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function bulkCreateQuestionBankItems(questions: QuestionBankItem[]): Promise<{ created: QuestionBankItem[]; count: number }> {
  return apiFetch('/admin/short-courses/question-bank/bulk', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  });
}
