import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function InstructorsPage() {
  return (
    <AdminSectionPage
      title="Teachers & Instructors"
      description="Manage lecturers, external instructor applications, documents, course submissions and marketplace readiness."
      items={['Lecturers', 'Lecturer applications', 'External instructors', 'Instructor documents', 'Instructor courses']}
    />
  );
}
