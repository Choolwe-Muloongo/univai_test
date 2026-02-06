// src/app/(app)/courses/[id]/exam/page.tsx
import { notFound } from 'next/navigation';
import ExamClientPage from '@/app/student/exam/exam-client';
import { getCourseById, getCourseExamQuestions } from '@/lib/api';

export default async function ModuleExamPage( props : { params: Promise<{ id: string }> }) {
  
  const params = await props.params
  const { id } = params
  
  const course = await getCourseById(id);
  
  if (!course) {
    notFound();
  }

  const courseQuestions = await getCourseExamQuestions(id);

  return (
    <ExamClientPage
      examTitle={`Exam: ${course.title}`}
      questions={courseQuestions}
      courseId={course.id}
      courseTitle={course.title}
      backToDashboardPath={`/student/courses/${course.id}`}
    />
  );
}
