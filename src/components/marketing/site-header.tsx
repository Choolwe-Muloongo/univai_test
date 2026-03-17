import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="glass-nav sticky top-0 z-50 w-full border-b">
      <div className="page-shell flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-primary sm:text-lg">
          <Logo className="size-8" />
          <span>UnivAI</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="sm:h-10 sm:px-4">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
