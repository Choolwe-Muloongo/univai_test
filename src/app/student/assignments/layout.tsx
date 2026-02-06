import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/assignments', label: 'Overview' },
  { href: '/student/assignments/submissions', label: 'Submissions' },
  { href: '/student/assignments/calendar', label: 'Calendar' },
];

export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
