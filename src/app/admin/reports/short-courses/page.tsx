import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function ShortCourseReportsPage() {
  return (
    <AdminSectionPage
      title="Short Course Reports"
      description="Report on catalogue performance, enrolments, certificates, reviews and instructor-owned courses."
      items={['Catalogue', 'Enrolments', 'Completions', 'Reviews', 'Certificates', 'Instructor courses']}
    />
  );
}
