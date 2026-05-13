import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function ContentStudioPage() {
  return (
    <AdminSectionPage
      title="Content Studio"
      description="Manage human-reviewed academic content, official lesson materials, assignments, quizzes and Class View publishing."
      items={['Lessons', 'Documents', 'Quizzes', 'Assignments', 'Media Library', 'Review Queue', 'Class View Builder']}
    />
  );
}
