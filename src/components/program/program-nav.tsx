'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const links = [
  { href: '/student/program', label: 'Overview' },
  { href: '/student/program/plan', label: 'Semester Plan' },
  { href: '/student/program/modules', label: 'Modules' },
  { href: '/student/program/assessments', label: 'Assessments' },
  { href: '/student/program/grades', label: 'Grades' },
  { href: '/student/program/attendance', label: 'Attendance' },
  { href: '/student/program/progress', label: 'Progress' },
  { href: '/student/program/support', label: 'Support' },
];

export function ProgramNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }),
              'rounded-full'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
