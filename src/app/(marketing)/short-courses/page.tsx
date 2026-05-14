import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

export default function ShortCoursesLandingPage() {
  return <div className="flex min-h-screen flex-col bg-background"><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm text-muted-foreground">Home / Short Courses</p><section className="space-y-4"><h1 className="text-4xl font-bold">Short Courses</h1><p className="max-w-3xl text-muted-foreground">Build practical skills quickly with focused courses designed for immediate workplace use.</p><Link href="/student/short-courses" className="font-semibold text-primary hover:underline">Browse available short courses</Link></section></main><SiteFooter /></div>;
}
