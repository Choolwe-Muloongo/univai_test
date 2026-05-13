import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navLinks = [
  { href: '/#programmes', label: 'Programmes' },
  { href: '/#short-courses', label: 'Short Courses' },
  { href: '/#features', label: 'AI Learning' },
  { href: '/apply/instructor', label: 'Teach' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="glass-nav sticky top-0 z-50 w-full border-b">
      <div className="page-shell flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-primary sm:text-lg">
          <Logo className="size-9 rounded-lg brand-logo-glow sm:hidden" />
          <Logo className="hidden size-10 rounded-xl brand-logo-glow sm:block" />
          <span className="brand-gradient-text hidden text-xl font-extrabold sm:inline">UnivAI</span>
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm">
              <nav className="mt-8 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md px-2 py-2 text-base font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button variant="outline" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
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
