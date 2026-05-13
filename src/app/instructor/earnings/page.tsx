import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorEarningsPage() {
  return (
    <PlatformPage
      eyebrow="Earnings"
      title="Instructor earnings"
      description="Track gross sales, UnivAI platform commission, instructor net earnings and pending payout balance."
      items={['Gross amount', '70% instructor share', '30% platform commission', 'Pending earnings', 'Paid earnings']}
    />
  );
}
