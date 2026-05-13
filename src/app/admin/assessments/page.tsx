import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function AssessmentsPage() {
  return (
    <AdminSectionPage
      title="Assessments"
      description="Define tests, exams and practical assessments with the same academic standard for all learners in a course offering."
      items={['All-students scope by default', 'Delivery group scope for practicals', 'Coverage', 'Marks and weight', 'Delivery mode', 'Status']}
    />
  );
}
