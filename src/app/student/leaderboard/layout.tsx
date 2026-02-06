import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/leaderboard', label: 'Global' },
  { href: '/student/leaderboard/class', label: 'Cohort' },
  { href: '/student/leaderboard/badges', label: 'Badges' },
];

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
