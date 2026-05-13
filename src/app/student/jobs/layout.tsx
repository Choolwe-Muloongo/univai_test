import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/jobs', label: 'Listings' },
  { href: '/student/jobs/applications', label: 'My Applications' },
];

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
