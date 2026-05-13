import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function LearnerReportsPage() {
  return (
    <AdminSectionPage
      title="Learner Reports"
      description="Report on programme students, short-course learners, progress, certificate eligibility and support needs."
      items={['Programme students', 'Short-course learners', 'Progress', 'Certificates', 'Support flags']}
    />
  );
}
