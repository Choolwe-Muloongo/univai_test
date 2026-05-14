import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

export default function ProgramsLandingPage() {
  return <div className="flex min-h-screen flex-col bg-background"><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-muted-foreground">Home / Programs</p><section className="space-y-4"><h1 className="text-4xl font-bold">Programs</h1><p className="max-w-3xl text-muted-foreground">Explore formal academic programs with clear entry requirements and graduation pathways.</p><Link href="/register" className="font-semibold text-primary hover:underline">Start your application</Link></section></main><SiteFooter /></div>;
}
