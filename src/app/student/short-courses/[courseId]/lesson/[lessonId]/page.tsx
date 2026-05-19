import { redirect } from 'next/navigation';

export default async function LegacyStudentShortCourseLessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  redirect(`/student/courses/${courseId}/lessons/${lessonId}`);
}
