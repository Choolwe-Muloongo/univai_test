import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

export default function EmployersLandingPage() {
  return <div className="flex min-h-screen flex-col bg-background"><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-muted-foreground">Home / For Employers</p><section className="space-y-4"><h1 className="text-4xl font-bold">For Employers</h1><p className="max-w-3xl text-muted-foreground">Access graduates, professionals, researchers, and consultants from across Africa. Post roles, review verified credentials, and hire with confidence.</p><div className="flex gap-4"><Link href="/register/employer" className="font-semibold text-primary hover:underline">Find talent</Link><Link href="/login/employer" className="font-semibold text-primary hover:underline">Employer login</Link></div></section></main><SiteFooter /></div>;
}
