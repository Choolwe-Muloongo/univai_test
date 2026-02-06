// src/app/(app)/program/semester/[semesterId]/exam/page.tsx
import { notFound } from 'next/navigation';
import ExamClientPage from '@/app/student/exam/exam-client';
import { getSemesterExamQuestions } from '@/lib/api';

export default async function SemesterExamPage( props : { params: Promise<{ semesterId: string }> }) {
  const params = await props.params
  const { semesterId } = params;
  
  const semesterQuestions = await getSemesterExamQuestions(semesterId);

  if (semesterQuestions.length === 0) {
    notFound();
  }

  return (
    <ExamClientPage
      examTitle={`Semester ${semesterId} Exam`}
      questions={semesterQuestions}
      courseId={`semester-${semesterId}`}
      courseTitle={`Semester ${semesterId} Exam`}
      backToDashboardPath="/student/program"
    />
  );
}
