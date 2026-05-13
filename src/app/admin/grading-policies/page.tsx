import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function GradingPoliciesPage() {
  return (
    <AdminSectionPage
      title="Grading Policies"
      description="Configure pass marks, exam minimums, practical minimums, repeat rules, grade bands and progression policy."
      items={['Pass mark', 'Exam minimum', 'Practical minimum', 'Resit policy', 'Grade bands', 'GPA points']}
    />
  );
}
