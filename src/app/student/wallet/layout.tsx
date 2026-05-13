import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/wallet', label: 'Overview' },
  { href: '/student/wallet/transactions', label: 'Transactions' },
  { href: '/student/wallet/rewards', label: 'Rewards' },
  { href: '/student/wallet/payouts', label: 'Payouts' },
];

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
