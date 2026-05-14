import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

export default function InstructorsLandingPage() {
  return <div className="flex min-h-screen flex-col bg-background"><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-muted-foreground">Home / For Instructors</p><section className="space-y-4"><h1 className="text-4xl font-bold">For Instructors</h1><p className="max-w-3xl text-muted-foreground">Teach with UnivAI, publish high-impact short courses, and reach learners through a professional digital classroom.</p><div className="flex gap-4"><Link href="/apply/instructor" className="font-semibold text-primary hover:underline">Apply as an instructor</Link><Link href="/login/instructor" className="font-semibold text-primary hover:underline">Instructor login</Link></div></section></main><SiteFooter /></div>;
}
