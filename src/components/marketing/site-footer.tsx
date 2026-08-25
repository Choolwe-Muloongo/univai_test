import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

import { Logo } from '@/components/icons/logo';

const columns = [
  { title: 'Platform', links: [['/programs', 'Programs'], ['/schools', 'Schools'], ['/ai-learning', 'AI Learning'], ['/opportunities', 'Opportunities']] },
  { title: 'Discover', links: [['/research', 'Research'], ['/employers', 'For Employers'], ['/about', 'About'], ['/blog', 'Blog']] },
  { title: 'Support', links: [['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/login', 'Login']] },
];

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5"><Logo className="size-10 rounded-xl" /><span className="text-2xl font-extrabold">Univ<span className="text-blue-400">AI</span></span></div>
            <p className="mt-5 max-w-md leading-7 text-slate-400">World-Class Education, Career Opportunities, and AI-Powered Learning for Every African.</p>
            <div className="mt-6 flex flex-wrap gap-3"><a href="mailto:support@univai.aftacoin.biz" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><Mail className="h-4 w-4" />support@univai.aftacoin.biz</a><span className="inline-flex items-center gap-2 text-sm text-slate-400"><MessageCircle className="h-4 w-4" />African learner community</span></div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">{columns.map(column => <div key={column.title}><h3 className="font-semibold text-white">{column.title}</h3><div className="mt-4 space-y-3">{column.links.map(([href,label]) => <Link key={href} href={href} className="block text-sm text-slate-400 transition hover:text-white">{label}</Link>)}</div></div>)}</div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row"><p>© {new Date().getFullYear()} UnivAI. All rights reserved.</p><p>Learn. Earn. Advance.</p></div>
      </div>
    </footer>
  );
}
