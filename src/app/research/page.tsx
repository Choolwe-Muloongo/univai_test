'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  MessageSquareText,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getResearchPortalData, type ResearchPortalData } from '@/lib/research-portal';

const menu = [
  ['Research Dashboard', '/research'],
  ['Research Projects', '/research/projects'],
  ['Funding Opportunities', '/research/funding'],
  ['Research Communities', '/research/communities'],
  ['Living Labs', '/research/living-labs'],
  ['Research Fellows', '/research/fellows'],
  ['Publications', '/research/publications'],
  ['Innovation Challenges', '/research/challenges'],
  ['Startup Incubator', '/research/incubator'],
  ['Research Repository', '/research/repository'],
  ['Partnerships', '/research/partnerships'],
  ['Events', '/research/events'],
  ['Research Analytics', '/research/analytics'],
] as const;

const lifecycle = ['Interest', 'Community', 'Project', 'Fellow', 'Publication', 'Challenge', 'Startup', 'Alumni Mentor'];

function Stat({ icon: Icon, label, value, href }: { icon: typeof Award; label: string; value: string | number; href?: string }) {
  const content = <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold tracking-tight">{value}</p></div></CardContent></Card>;
  return href ? <Link href={href}>{content}</Link> : content;
}

function ResearchAi() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [template, setTemplate] = useState('Literature Review');
  const [output, setOutput] = useState('');
  const templates = ['Literature Review', 'Research Proposal', 'Concept Note', 'Grant Budget', 'Methodology', 'Research Questions', 'Survey Instrument'];
  function generate() {
    if (!topic.trim()) return;
    setOutput(`${template} workspace\n\nTopic: ${topic.trim()}\n\n1. Define the research problem and evidence gap.\n2. Identify the population, variables and measurable outcomes.\n3. Map recent literature and competing explanations.\n4. Select an appropriate methodology and sampling strategy.\n5. Specify ethical, data-management and reproducibility requirements.\n6. Convert the findings into a testable research plan.\n\nResearch AI has prepared a structured starting point. Validate sources and institutional requirements before submission.`);
  }
  return <>
    <Button className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg" size="lg" onClick={() => setOpen(true)}><Sparkles className="mr-2 h-4 w-4" /> Ask Research AI</Button>
    {open ? <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-4 md:items-center md:p-8" onClick={() => setOpen(false)}><Card className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Research AI</CardTitle><CardDescription>Generate a structured research starting point from any research page.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2">{templates.map((item) => <Button key={item} size="sm" variant={template === item ? 'default' : 'outline'} onClick={() => setTemplate(item)}>{item}</Button>)}</div><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI adoption among university students" /><Button onClick={generate} disabled={!topic.trim()}>Generate</Button>{output ? <div className="max-h-72 overflow-auto rounded-lg border bg-muted/40 p-4 text-sm leading-6 whitespace-pre-wrap">{output}</div> : null}<Button variant="ghost" onClick={() => setOpen(false)}>Close</Button></CardContent></Card></div> : null}
  </>;
}

export default function ResearchDashboard() {
  const { session } = useSession();
  const [data, setData] = useState<ResearchPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    getResearchPortalData(String(session?.user?.id ?? session?.user?.email ?? 'demo')).then((next) => { if (active) setData(next); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.user?.id, session?.user?.email]);

  const filteredFunding = useMemo(() => data?.funding.filter((item) => `${item.title} ${item.organization} ${item.category}`.toLowerCase().includes(search.toLowerCase())).slice(0, 10) ?? [], [data, search]);
  if (loading || !data) return <div className="mx-auto max-w-7xl space-y-6 p-6"><div className="h-10 w-72 animate-pulse rounded bg-muted" /><div className="h-40 animate-pulse rounded-xl bg-muted" /><div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div></div>;

  return <div className="min-h-full bg-muted/20"><div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><FlaskConical className="h-4 w-4" /> UNIVAI RESEARCH & INNOVATION INSTITUTE</div><h1 className="text-3xl font-bold tracking-tight md:text-4xl">Research & Innovation</h1><p className="mt-2 max-w-2xl text-muted-foreground">A single research lifecycle for projects, funding, publications, innovation and startups inside UnivAI.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href="/student/dashboard">Back to UnivAI</Link></Button><Button asChild><Link href="/research/projects">Start a Project <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>

    <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border bg-background p-2">{menu.map(([label, href]) => <Link key={href} href={href} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${href === '/research' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{label}</Link>)}</div>

    <Card className="mb-6 overflow-hidden border-primary/20 bg-background"><CardContent className="p-6 md:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_auto]"><div><Badge className="mb-3">{data.profile.currentRole}</Badge><h2 className="text-2xl font-semibold">My Research Score</h2><div className="mt-3 flex items-end gap-2"><span className="text-5xl font-bold">{data.profile.researchScore}</span><span className="pb-2 text-muted-foreground">points</span></div><Progress className="mt-5 max-w-xl" value={Math.min(data.profile.researchScore / 5, 100)} /><p className="mt-2 text-sm text-muted-foreground">Earn 50 for a publication, 20 for a project, 100 for a fellowship, 200 for a grant, 500 for a patent and 300 for a startup.</p></div><div className="flex items-center justify-center rounded-2xl bg-primary/5 p-6"><Trophy className="h-20 w-20 text-primary" /></div></div></CardContent></Card>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={FlaskConical} label="Active Projects" value={data.profile.projects} href="/research/projects" /><Stat icon={BookOpen} label="Publications" value={data.profile.publications} href="/research/publications" /><Stat icon={CircleDollarSign} label="Funding Calls" value={data.funding.length} href="/research/funding" /><Stat icon={Rocket} label="Startup Stage" value={data.startups[0]?.stage ?? 'Idea'} href="/research/incubator" /></div>

    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Your Research Lifecycle</h2><p className="text-sm text-muted-foreground">Track the journey from curiosity to impact.</p></div><Link className="text-sm font-medium text-primary" href="/research/analytics">View analytics</Link></div><div className="grid gap-2 md:grid-cols-4 lg:grid-cols-8">{lifecycle.map((item, index) => <div key={item} className="relative rounded-xl border bg-background p-4 text-center"><div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</div><p className="text-xs font-medium">{item}</p>{index < lifecycle.length - 1 ? <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground lg:block" /> : null}</div>)}</div></section>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Latest Funding Opportunities</CardTitle><CardDescription>Calls matched to your research ecosystem.</CardDescription></div><Button variant="ghost" size="sm" asChild><Link href="/research/funding">View all</Link></Button></div></CardHeader><CardContent className="space-y-3"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search funding calls" value={search} onChange={(e) => setSearch(e.target.value)} /></div>{filteredFunding.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><Badge variant="secondary">{item.category}</Badge><h3 className="mt-2 font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground">{item.organization} · {item.amount}</p><p className="mt-2 text-sm text-muted-foreground">{item.description}</p></div><div className="flex shrink-0 items-center gap-1 text-sm font-medium"><CalendarDays className="h-4 w-4" /> {item.deadline}</div></div></div>)}</CardContent></Card>

    <div className="space-y-6"><Card><CardHeader><CardTitle>Active Projects</CardTitle><CardDescription>Current research portfolio.</CardDescription></CardHeader><CardContent className="space-y-3">{data.projects.map((project) => <Link key={project.projectId} href={`/research/projects?project=${project.projectId}`} className="block rounded-xl border p-4 hover:bg-muted/50"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline">{project.status}</Badge><h3 className="mt-2 font-semibold">{project.title}</h3><p className="mt-1 text-xs text-muted-foreground">{project.category} · {project.fundingSource}</p></div><ChevronRight className="mt-1 h-4 w-4" /></div></Link>)}</CardContent></Card><Card><CardHeader><CardTitle>Innovation Challenges</CardTitle></CardHeader><CardContent className="space-y-3">{data.challenges.map((challenge) => <div key={challenge.challengeId} className="rounded-xl bg-muted/40 p-4"><p className="font-semibold">{challenge.title}</p><p className="mt-1 text-sm text-muted-foreground">Prize {challenge.prizePool} · closes {challenge.deadline}</p></div>)}</CardContent></Card></div></div>

    <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[[Users,'Communities','Find researchers, recruit participants and share resources.','/research/communities'],[Award,'Fellowships','Build your research profile and apply for fellowships.','/research/fellows'],[Lightbulb,'Innovation','Turn research results into prototypes and ventures.','/research/incubator'],[BarChart3,'Analytics','Measure funding, publications, projects and research impact.','/research/analytics']].map(([Icon,title,desc,href]) => { const I = Icon as typeof Award; return <Link key={String(title)} href={String(href)}><Card className="h-full hover:shadow-md"><CardContent className="p-5"><I className="mb-3 h-6 w-6 text-primary" /><h3 className="font-semibold">{String(title)}</h3><p className="mt-1 text-sm text-muted-foreground">{String(desc)}</p></CardContent></Card></Link> })}</section>

    <div className="mt-8 rounded-2xl border bg-background p-6"><div className="grid gap-6 md:grid-cols-3"><div><GraduationCap className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Research Fellows</p><p className="text-sm text-muted-foreground">Submitted → Screened → Reviewed → Awarded → Completed</p></div><div><BriefcaseBusiness className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Grant Management</p><p className="text-sm text-muted-foreground">Opportunity → Concept Note → Proposal → Award → Reporting</p></div><div><MessageSquareText className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Research Communities</p><p className="text-sm text-muted-foreground">Discussion, announcements, events and project recruitment.</p></div></div></div>
  </div><ResearchAi /></div>;
}
