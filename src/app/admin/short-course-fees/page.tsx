import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function ShortCourseFeesPage() {
  return (
    <AdminSectionPage
      title="Short Course Fees"
      description="Manage entry fees, certificate fees and pricing rules for first-class short courses."
      items={['Entry fee', 'Certificate fee', 'Course scope', 'Category pricing', 'Currency', 'Status']}
    />
  );
}
