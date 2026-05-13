import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/virtual-lab', label: 'Overview' },
  { href: '/student/virtual-lab/sessions', label: 'Sessions' },
  { href: '/student/virtual-lab/booking', label: 'Booking' },
  { href: '/student/virtual-lab/history', label: 'History' },
];

export default function VirtualLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
