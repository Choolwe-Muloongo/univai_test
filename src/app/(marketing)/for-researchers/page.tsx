import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

export default function ResearchersLandingPage() {
  return <div className="flex min-h-screen flex-col bg-background"><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-muted-foreground">Home / For Researchers</p><section className="space-y-4"><h1 className="text-4xl font-bold">For Researchers</h1><p className="max-w-3xl text-muted-foreground">Collaborate with UnivAI faculty and students, run applied research projects, and access the research portal built for academic partners.</p><div className="flex gap-4"><Link href="/register/researcher" className="font-semibold text-primary hover:underline">Apply as a researcher</Link><Link href="/login/researcher" className="font-semibold text-primary hover:underline">Researcher login</Link></div></section></main><SiteFooter /></div>;
}
