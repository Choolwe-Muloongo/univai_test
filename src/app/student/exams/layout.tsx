import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/exams', label: 'Overview' },
  { href: '/student/exams/bookings', label: 'Bookings' },
  { href: '/student/exams/history', label: 'History' },
];

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
