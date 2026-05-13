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
          <div className="flex items-center gap-2">
            <Logo className="size-10 rounded-xl brand-logo-glow" />
            <span className="brand-gradient-text text-xl font-extrabold">UnivAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} UnivAI. AI-powered learning with human-reviewed academic content.
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
