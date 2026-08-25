'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Award, BrainCircuit, BriefcaseBusiness, Check, ChevronRight, Globe2, GraduationCap, Lightbulb, Rocket, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';

import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { Button } from '@/components/ui/button';
import { getAdmissionsSettings, getCourses, getPrograms } from '@/lib/api';
import type { Course, Program } from '@/lib/api/types';

const schools = [
  ['School of Artificial Intelligence', 'AI, Data Science, Machine Learning', BrainCircuit, '/schools/ai'],
  ['School of Business & Entrepreneurship', 'Business, Leadership, Innovation', BriefcaseBusiness, '/schools/business'],
  ['School of ICT', 'Software Development, Cybersecurity, Cloud', Globe2, '/schools/ict'],
  ['School of Engineering', 'Civil, Electrical, Mechanical', Rocket, '/schools/engineering'],
  ['School of Health Sciences', 'Public Health, Nursing, Healthcare', Award, '/schools/health'],
  ['School of Education', 'Teaching, Learning Technologies', GraduationCap, '/schools/education'],
] as const;

const benefits = [
  ['Learn with AI', '24/7 AI tutors and study assistants.', BrainCircuit],
  ['Earn Recognized Credentials', 'Certificates, diplomas, and degree programs.', Award],
  ['Learn Anywhere', 'Mobile-first learning designed for Africa.', Globe2],
  ['Career Focused', 'Programs aligned to industry demand.', BriefcaseBusiness],
  ['Verified Credentials', 'Blockchain-secured certificates and transcripts.', ShieldCheck],
  ['Community & Networking', 'Connect with learners, mentors, employers, and innovators.', Users],
] as const;

const stats = [['10,000+', 'Learners'], ['500+', 'Courses'], ['100+', 'Instructors'], ['20+', 'Partner Organizations'], ['95%', 'Completion Rate']];

export default function HomePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturerOpen, setLecturerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPrograms(), getCourses(), getAdmissionsSettings()]).then(([p, c, s]) => {
      if (!mounted) return;
      setPrograms(p);
      setCourses(c);
      setLecturerOpen(Boolean(s.lecturerApplicationsOpen));
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,175,.35),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,.3),transparent_35%)]" />
          <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100"><Sparkles className="h-4 w-4" /> Africa's AI-powered education ecosystem</div>
              <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">Africa's AI-Powered University for <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">Career Growth, Skills, and Opportunity.</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Learn with AI. Earn recognized credentials. Access career opportunities. Build the future.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-blue-600 px-7 hover:bg-blue-500"><Link href="/register">Start Learning <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white"><Link href="/programs">Explore Programs</Link></Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full text-white hover:bg-white/10 hover:text-white"><Link href="/opportunities">Find Opportunities</Link></Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">{['AI-Powered Learning', 'Blockchain Verified', 'Mobile First', 'Learn Anywhere'].map(x => <span key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />{x}</span>)}</div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.5rem] bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">AI Learning Hub</p><p className="mt-1 text-xl font-bold">Your next opportunity</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><BrainCircuit /></div></div>
                  <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm text-slate-400">Learning progress</p><div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" /></div><p className="mt-3 text-sm">AI & Data Science · 80% complete</p></div>
                  <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><Award className="h-5 w-5 text-violet-600" /><p className="mt-2 text-sm font-semibold">Verified credential</p></div><div className="rounded-2xl bg-slate-50 p-4"><BriefcaseBusiness className="h-5 w-5 text-emerald-600" /><p className="mt-2 text-sm font-semibold">3 new opportunities</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-white py-10"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-3 lg:grid-cols-5 sm:px-6 lg:px-8">{stats.map(([n,l]) => <div key={l} className="text-center"><p className="text-3xl font-extrabold text-slate-950">{n}</p><p className="mt-1 text-sm text-slate-500">{l}</p></div>)}</div></section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center"><p className="font-semibold text-blue-700">WHY UNIVAI</p><h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Education built around your future.</h2><p className="mt-4 text-lg text-slate-600">Everything you need to move from learning to earning, in one connected ecosystem.</p></div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(([title,desc,Icon]) => <div key={title} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600">{desc}</p></div>)}</div>
        </section>

        <section className="bg-slate-950 py-24 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="font-semibold text-emerald-400">THE TRANSFORMATION</p><h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">Turn uncertainty into momentum.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">UnivAI connects education, practical skills, research, career access and entrepreneurship so your learning has somewhere to go.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-white/5 p-6"><p className="text-sm text-slate-400">Before UnivAI</p>{['No clear career path','Expensive education','Limited access to experts','Skills mismatch','Few opportunities'].map(x=><p key={x} className="mt-4 text-slate-300">{x}</p>)}</div><div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6"><p className="text-sm text-emerald-300">After UnivAI</p>{['Industry-ready skills','Professional portfolio','AI productivity mastery','Career opportunities','Entrepreneurship pathways'].map(x=><p key={x} className="mt-4 flex gap-2 text-white"><Check className="mt-1 h-4 w-4 text-emerald-400" />{x}</p>)}</div></div></div></div></section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"><div className="text-center"><p className="font-semibold text-violet-700">THE UNIVAI ECOSYSTEM</p><h2 className="mt-3 text-4xl font-extrabold">Learn. Earn. Build. Work. Launch.</h2></div><div className="mt-14 grid gap-4 md:grid-cols-5">{[['Learn','Courses and programs',GraduationCap],['Earn','Scholarships and rewards',Award],['Build','Research and innovation',Lightbulb],['Work','Jobs and internships',BriefcaseBusiness],['Launch','Startup incubation',Rocket]].map(([t,d,I],i)=><div key={t as string} className="relative rounded-3xl border bg-white p-6 shadow-sm"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-700"><I /></div><p className="text-xs font-bold text-blue-700">0{i+1}</p><h3 className="mt-1 text-xl font-bold">{t as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{d as string}</p>{i<4 && <ChevronRight className="absolute -right-3 top-1/2 hidden h-6 w-6 text-slate-300 md:block" />}</div>)}</div></section>

        <section className="bg-slate-100 py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-semibold text-blue-700">EXPLORE OUR SCHOOLS</p><h2 className="mt-2 text-4xl font-extrabold">Find your field.</h2></div><Link href="/schools" className="font-semibold text-blue-700">View all schools <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{schools.map(([title,desc,Icon,href])=><Link href={href} key={title} className="group rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon /></div><ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-700" /></div><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-2 text-slate-600">{desc}</p></Link>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"><div className="grid overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 to-violet-700 lg:grid-cols-2"><div className="p-10 text-white sm:p-14"><p className="font-semibold text-blue-200">RESEARCH & INNOVATION HUB</p><h2 className="mt-3 text-4xl font-extrabold">Research That Solves Africa's Challenges.</h2><p className="mt-5 leading-7 text-blue-50">Collaborate on applied research across AI, fintech, agriculture, energy, climate innovation and digital transformation.</p><div className="mt-8 flex flex-wrap gap-2">{['Artificial Intelligence','Fintech','Agriculture','Energy','Climate Innovation','Digital Transformation'].map(x=><span key={x} className="rounded-full bg-white/10 px-3 py-2 text-sm">{x}</span>)}</div><Button asChild className="mt-8 rounded-full bg-white text-blue-700 hover:bg-blue-50"><Link href="/research">Join Research Projects <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div><div className="hidden items-center justify-center p-10 lg:flex"><div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur"><Search className="h-10 w-10 text-emerald-300" /><p className="mt-8 text-2xl font-bold text-white">Ideas into impact.</p><p className="mt-3 text-blue-100">Connect learners, lecturers, employers and researchers around problems that matter.</p></div></div></div></section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-[2rem] bg-slate-950 p-10 text-white"><p className="font-semibold text-emerald-400">FOR EMPLOYERS</p><h2 className="mt-3 text-4xl font-extrabold">Hire Skilled Talent.</h2><p className="mt-4 max-w-xl text-slate-300">Access graduates, professionals, researchers and consultants from across Africa.</p><Button asChild className="mt-8 rounded-full bg-white text-slate-950 hover:bg-slate-100"><Link href="/employers">Find Talent</Link></Button></div><div className="rounded-[2rem] border bg-white p-10"><p className="font-semibold text-violet-700">REWARDS & OPPORTUNITIES</p><h2 className="mt-3 text-4xl font-extrabold">Learn Today. Benefit Tomorrow.</h2><p className="mt-4 text-slate-600">Discover scholarships, achievement rewards, referral incentives, careers and the alumni network.</p><Button asChild variant="outline" className="mt-8 rounded-full"><Link href="/opportunities">Explore Opportunities</Link></Button></div></div></section>

        {lecturerOpen && <section className="border-y bg-blue-50 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><p className="font-semibold text-blue-700">LECTURER RECRUITMENT IS OPEN</p><p className="mt-1 text-slate-700">Bring your expertise to Africa's AI-powered university.</p></div><Button asChild className="rounded-full"><Link href="/lecturer/applications">Apply as Lecturer</Link></Button></div></section>}
      </main>
      <SiteFooter />
    </div>
  );
}
