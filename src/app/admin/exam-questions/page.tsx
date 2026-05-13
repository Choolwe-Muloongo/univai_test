import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function QuestionBankPage() {
  return (
    <AdminSectionPage
      title="Question Bank"
      description="Manage approved questions, exam coverage and lecturer-supervised assessment material for formal programme courses."
      items={['Question coverage', 'Approved questions', 'Marking guides', 'Exam standards']}
    />
  );
}
