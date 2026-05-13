import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function TodayTasksPage() {
  return (
    <AdminSectionPage
      title="Today's Tasks"
      description="A focused operations queue for admissions, academic approvals, learner support, finance checks and content review."
      items={['Admissions follow-ups', 'Pending content review', 'Finance exceptions', 'System health checks']}
    />
  );
}
