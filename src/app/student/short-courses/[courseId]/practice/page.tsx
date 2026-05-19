import { redirect } from 'next/navigation';

export default async function LegacyStudentShortCoursePracticePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  redirect(`/student/courses/${courseId}/practice`);
}
