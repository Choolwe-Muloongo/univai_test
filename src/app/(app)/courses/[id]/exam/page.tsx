// src/app/(app)/courses/[id]/exam/page.tsx
import { notFound } from 'next/navigation';
import { courses, lessons } from '@/lib/data';
import ExamClientPage from '@/app/(app)/exam/exam-client';

const allQuestions = [
  {
    question: 'What is a key principle of software engineering?',
    options: ['Rapid Prototyping', 'Modularity and Separation of Concerns', 'Minimalism', 'Code Obfuscation'],
    answer: 'Modularity and Separation of Concerns',
  },
  {
    question: 'Which data structure operates on a Last-In, First-Out (LIFO) basis?',
    options: ['Queue', 'Stack', 'Linked List', 'Tree'],
    answer: 'Stack',
  },
  {
    question: 'What does SDLC stand for?',
    options: ['Software Design Life Cycle', 'System Development Life Cycle', 'Software Development Life Cycle', 'System Design Life Cycle'],
    answer: 'Software Development Life Cycle',
  },
  {
    question: 'What is the time complexity of a binary search algorithm?',
    options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
    answer: 'O(log n)',
  },
  {
    question: 'Which of the following is NOT a pillar of Object-Oriented Programming?',
    options: ['Inheritance', 'Polymorphism', 'Abstraction', 'Compilation'],
    answer: 'Compilation',
  }
];


// In a real app, you would fetch questions related to the course.
const getQuestionsForCourse = (courseId: string) => {
    // For now, return a shuffled subset of all questions.
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

export default async function ModuleExamPage({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id);
  
  if (!course) {
    notFound();
  }

  const courseQuestions = getQuestionsForCourse(params.id);

  return (
    <ExamClientPage
      examTitle={`Exam: ${course.title}`}
      questions={courseQuestions}
      courseId={course.id}
      courseTitle={course.title}
      backToDashboardPath={`/courses/${course.id}`}
    />
  );
}
