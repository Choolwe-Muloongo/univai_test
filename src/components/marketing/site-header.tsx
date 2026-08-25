import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navLinks = [
  { href: '/programs', label: 'Programs' },
  { href: '/schools', label: 'Schools' },
  { href: '/ai-learning', label: 'AI Learning' },
  { href: '/research', label: 'Research' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/employers', label: 'For Employers' },
  { href: '/about', label: 'About' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo className="size-9 rounded-xl" />
          <span className="text-xl font-extrabold tracking-tight text-slate-950">Univ<span className="text-blue-700">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-5 xl:flex">
          {navLinks.map((link) => <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-blue-700">{link.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex"><Link href="/login">Login</Link></Button>
          <Button asChild size="sm" className="rounded-full bg-blue-700 px-5 hover:bg-blue-800"><Link href="/register">Sign Up</Link></Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm bg-white">
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => <SheetClose asChild key={link.href}><Link href={link.href} className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-100">{link.label}</Link></SheetClose>)}
                <SheetClose asChild><Link href="/login" className="mt-4 rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-100">Login</Link></SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
