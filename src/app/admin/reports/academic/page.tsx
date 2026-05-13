import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function AcademicReportsPage() {
  return (
    <AdminSectionPage
      title="Academic Reports"
      description="Report on academic structure, course offerings, delivery groups, assessments and grading policy outcomes."
      items={['Departments', 'Course offerings', 'Assessments', 'Grade outcomes', 'Delivery modes']}
    />
  );
}
