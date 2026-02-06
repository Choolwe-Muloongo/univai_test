'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type SectionLink = {
  href: string;
  label: string;
};

export function SectionNav({ links }: { links: SectionLink[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
