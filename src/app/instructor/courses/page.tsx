import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorCoursesPage() {
  return (
    <PlatformPage
      eyebrow="My Courses"
      title="Instructor short-course catalogue"
      description="Approved instructors can create manual courses, upload materials and submit course drafts for human review."
      items={['Draft courses', 'Submitted courses', 'Needs changes', 'Approved courses', 'Published courses']}
      actionHref="/instructor/courses/create"
      actionLabel="Create course"
    />
  );
}
