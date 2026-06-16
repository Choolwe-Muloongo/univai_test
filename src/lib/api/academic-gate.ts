import { apiFetch } from '@/lib/api/client';

export type StudentAcademicGate = Record<string, any> & {
  academicStatus: string;
  today?: string;
  intake?: Record<string, any>;
  enrollment?: Record<string, any>;
  calendar?: Record<string, string | null>;
  deliveryRules?: Record<string, any>;
  permissions?: Record<string, boolean>;
  locks?: Record<string, boolean>;
  reasons?: Record<string, string>;
  finance?: Record<string, any>;
  nextEvents?: Array<Record<string, any>>;
};

export async function getStudentAcademicGate(): Promise<StudentAcademicGate | null> {
  try {
    return await apiFetch('/students/me/academic-gate');
  } catch (error) {
    console.error('Failed to load student academic gate', error);
    return null;
  }
}
