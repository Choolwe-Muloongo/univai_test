import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorPayoutsPage() {
  return (
    <PlatformPage
      eyebrow="Payouts"
      title="Instructor payout requests"
      description="Request and monitor payouts for approved marketplace earnings."
      items={['Request payout', 'Payout method', 'Requested status', 'Paid status', 'Reference tracking']}
    />
  );
}
