import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function CourseOfferingsPage() {
  return (
    <AdminSectionPage
      title="Course Offerings"
      description="Create semester or intake offerings with one main lecturer, shared content and optional delivery groups."
      items={['Programme course', 'Academic year', 'Semester', 'Intake', 'Main lecturer', 'Offering status']}
    />
  );
}
