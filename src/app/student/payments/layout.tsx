import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/payments', label: 'Overview' },
  { href: '/student/payments/history', label: 'History' },
];

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
