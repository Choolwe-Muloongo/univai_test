import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/study-plan', label: 'Overview' },
  { href: '/student/study-plan/daily', label: 'Daily Plan' },
  { href: '/student/study-plan/weekly', label: 'Weekly Plan' },
  { href: '/student/study-plan/revisions', label: 'Revisions' },
];

export default function StudyPlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
