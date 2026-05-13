import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function AiContentReportsPage() {
  return (
    <AdminSectionPage
      title="AI Content Reports"
      description="Report on AI-generated lessons, quizzes, notes, assignments, usage cost and human review status."
      items={['AI usage logs', 'Generated content', 'Review queue', 'Approved content', 'Estimated cost']}
    />
  );
}
