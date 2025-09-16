// src/app/(app)/exam/actions.ts
'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const ExamResultSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  score: z.number(),
  studentName: z.string(),
});

type ExamResultInput = z.infer<typeof ExamResultSchema>;

export async function saveExamResult(data: ExamResultInput) {
  const validatedFields = ExamResultSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data provided.' };
  }

  try {
    const userRole = 'premium-student'; // Placeholder
    
    const docRef = await addDoc(collection(db, "examResults"), {
      userId: userRole,
      ...validatedFields.data,
      completedAt: serverTimestamp(),
    });
    return { success: true, examId: docRef.id };
  } catch (error) {
    console.error("Error saving exam result: ", error);
    return { success: false, error: 'There was an error saving your exam result.' };
  }
}
