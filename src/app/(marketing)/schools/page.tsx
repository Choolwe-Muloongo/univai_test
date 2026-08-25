import Link from 'next/link';
import { ArrowRight, BrainCircuit, BriefcaseBusiness, Code2, GraduationCap, HeartPulse, Settings2 } from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';

const schools = [
  ['School of Artificial Intelligence','AI, Data Science, Machine Learning',BrainCircuit,'/schools/ai'],
  ['School of Business & Entrepreneurship','Business, Leadership, Innovation',BriefcaseBusiness,'/schools/business'],
  ['School of ICT','Software Development, Cybersecurity, Cloud',Code2,'/schools/ict'],
  ['School of Engineering','Civil, Electrical, Mechanical',Settings2,'/schools/engineering'],
  ['School of Health Sciences','Public Health, Nursing, Healthcare',HeartPulse,'/schools/health'],
  ['School of Education','Teaching, Learning Technologies',GraduationCap,'/schools/education'],
] as const;
export default function SchoolsPage(){return <div className="min-h-screen bg-slate-50"><SiteHeader/><main><section className="bg-slate-950 py-24 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="font-semibold text-blue-400">OUR SCHOOLS</p><h1 className="mt-3 max-w-4xl text-5xl font-extrabold sm:text-6xl">Find the field where your future begins.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Explore disciplines built for Africa's changing economy, from artificial intelligence to healthcare and entrepreneurship.</p></div></section><section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{schools.map(([title,desc,Icon,href])=><Link key={title} href={href} className="group rounded-[2rem] border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon/></div><h2 className="mt-7 text-2xl font-bold">{title}</h2><p className="mt-3 leading-7 text-slate-600">{desc}</p><span className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-700">Explore school <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></Link>)}</div></section></main><SiteFooter/></div>}
