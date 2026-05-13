'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ExamClientPage from '@/app/student/exam/exam-client';
import { getSemesterExamQuestions } from '@/lib/api';
import type { ExamQuestion } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function SemesterExamPage() {
  const params = useParams();
  const semesterId = readRouteParam(params, 'semesterId');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadExam() {
      if (!semesterId) {
        setLoading(false);
        setError('Semester route is missing an id.');
        return;
      }

      try {
        const semesterQuestions = await getSemesterExamQuestions(semesterId);
        if (!isMounted) return;
        setQuestions(semesterQuestions);
        setError(null);
      } catch (err) {
        console.error('Failed to load semester exam', err);
        if (isMounted) {
          setQuestions([]);
          setError('Semester exam questions are unavailable. Please refresh or check your exam access.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExam();

    return () => {
      isMounted = false;
    };
  }, [semesterId]);

  if (loading) {
    return <PageLoading message="Loading semester exam..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/exams" actionLabel="Back to Exams" />;
  }

  if (questions.length === 0) {
    return (
      <PageError
        title="Exam not available"
        message="This semester exam has no published questions yet."
        actionHref="/student/exams"
        actionLabel="Back to Exams"
      />
    );
  }

  return (
    <ExamClientPage
      examTitle={`Semester ${semesterId} Exam`}
      questions={questions}
      courseId={`semester-${semesterId}`}
      courseTitle={`Semester ${semesterId} Exam`}
      backToDashboardPath="/student/program"
    />
  );
}
