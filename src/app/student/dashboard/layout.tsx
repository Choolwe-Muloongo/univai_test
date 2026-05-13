import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/dashboard', label: 'Overview' },
  { href: '/student/dashboard/insights', label: 'Insights' },
  { href: '/student/dashboard/alerts', label: 'Alerts' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
