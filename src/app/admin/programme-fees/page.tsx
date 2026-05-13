import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function ProgrammeFeesPage() {
  return (
    <AdminSectionPage
      title="Programme Fees"
      description="Configure application, admission and tuition fee rules for formal programmes."
      items={['Application fee', 'Admission fee', 'Tuition fee', 'Programme scope', 'Currency', 'Active status']}
    />
  );
}
