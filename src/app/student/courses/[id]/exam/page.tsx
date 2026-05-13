'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ExamClientPage from '@/app/student/exam/exam-client';
import { getCourseById, getCourseExamQuestions } from '@/lib/api';
import type { Course, ExamQuestion } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function ModuleExamPage() {
  const params = useParams();
  const id = readRouteParam(params, 'id');
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadExam() {
      if (!id) {
        setLoading(false);
        setError('Course route is missing an id.');
        return;
      }

      try {
        const [nextCourse, nextQuestions] = await Promise.all([
          getCourseById(id),
          getCourseExamQuestions(id),
        ]);
        if (!isMounted) return;
        setCourse(nextCourse);
        setQuestions(nextQuestions);
        setError(null);
      } catch (err) {
        console.error('Failed to load course exam', err);
        if (isMounted) {
          setCourse(null);
          setQuestions([]);
          setError('Course exam data is unavailable. Please refresh and try again.');
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
  }, [id]);

  if (loading) {
    return <PageLoading message="Loading course exam..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/exams" actionLabel="Back to Exams" />;
  }

  if (!course) {
    return (
      <PageError
        title="Course not found"
        message="This course exam is unavailable or has not been published yet."
        actionHref="/student/exams"
        actionLabel="Back to Exams"
      />
    );
  }

  return (
    <ExamClientPage
      examTitle={`Exam: ${course.title}`}
      questions={questions}
      courseId={course.id}
      courseTitle={course.title}
      backToDashboardPath={`/student/courses/${course.id}`}
    />
  );
}
