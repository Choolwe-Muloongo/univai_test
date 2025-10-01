// src/app/(app)/program/semester/[semesterId]/exam/page.tsx
import { notFound } from 'next/navigation';
import { semester1ExamQuestions } from '@/lib/data';
import ExamClientPage from '@/app/(app)/exam/exam-client';


// In a real app, you'd fetch questions based on semesterId
const getQuestionsForSemester = (semesterId: string) => {
    if(semesterId === '1') {
        // For now, return a shuffled subset of all questions.
        const shuffled = semester1ExamQuestions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }
    return []; // Return empty for other semesters for now
}

export default async function SemesterExamPage( props : { params: { semesterId: string } }) {
  const params = await props.params
  const { semesterId } = params;
  
  const semesterQuestions = getQuestionsForSemester(semesterId);

  if (semesterQuestions.length === 0) {
    notFound();
  }

  return (
    <ExamClientPage
      examTitle={`Semester ${semesterId} Exam`}
      questions={semesterQuestions}
      courseId={`semester-${semesterId}`}
      courseTitle={`Semester ${semesterId} Exam`}
      backToDashboardPath="/program"
    />
  );
}
