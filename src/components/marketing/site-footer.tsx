import Link from 'next/link';

import { Logo } from '@/components/icons/logo';

const studentLinks = [
  { href: '/login', label: 'Student Login' },
  { href: '/register', label: 'Register' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
];

const staffLinks = [
  { href: '/login/lecturer', label: 'Lecturer Login' },
  { href: '/login/admin', label: 'Admin Login' },
  { href: '/login/employer', label: 'Employer Login' },
];

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="page-shell glass-card grid grid-cols-1 gap-8 p-6 md:grid-cols-4 md:p-8">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Logo className="size-6" />
            <span>UnivAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} UnivAI. Smart education with premium experience.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">Students</h4>
          {studentLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">Staff & Partners</h4>
          {staffLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold">Company</h4>
          {companyLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
