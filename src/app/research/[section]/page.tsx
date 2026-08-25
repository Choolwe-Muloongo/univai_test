'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, CircleDollarSign, FileText, FlaskConical, Lightbulb, Plus, Rocket, Search, Users, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getResearchPortalData, type ResearchPortalData } from '@/lib/research-portal';

const definitions: Record<string, { title: string; description: string; icon: typeof FlaskConical }> = {
  projects: { title: 'Research Projects', description: 'Manage the complete project lifecycle from draft to archive.', icon: FlaskConical },
  funding: { title: 'Funding Opportunities', description: 'Discover calls, save opportunities, apply and build consortia.', icon: CircleDollarSign },
  communities: { title: 'Research Communities', description: 'Connect researchers around shared disciplines and research problems.', icon: Users },
  'living-labs': { title: 'Living Labs', description: 'Coordinate real-world research environments and participants.', icon: FlaskConical },
  fellows: { title: 'Research Fellows', description: 'Manage fellowship applications from submission to completion.', icon: Users },
  publications: { title: 'Publications', description: 'Manage papers, datasets, versions, citations and impact.', icon: BookOpen },
  challenges: { title: 'Innovation Challenges', description: 'Run competitions that move research ideas toward practical solutions.', icon: Lightbulb },
  incubator: { title: 'Startup Incubator', description: 'Move research results through prototype, MVP, pilot and investment.', icon: Rocket },
  repository: { title: 'Research Repository', description: 'A discoverable home for publications, datasets and research outputs.', icon: FileText },
  partnerships: { title: 'Partnerships', description: 'Track institutions, industry partners, consortium opportunities and collaboration.', icon: Users },
  events: { title: 'Research Events', description: 'Coordinate seminars, conferences, workshops and research deadlines.', icon: CalendarDays },
  analytics: { title: 'Research Analytics', description: 'Measure research activity, funding, publications, innovation and impact.', icon: Search },
};

const stages = ['Draft', 'Proposal', 'Approved', 'Funded', 'Active', 'Completed', 'Archived'];
const grantStages = ['Opportunity', 'Concept Note', 'Proposal', 'Review', 'Submission', 'Award', 'Implementation', 'Reporting', 'Closure'];

export default function ResearchSectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section;
  const definition = definitions[section] ?? { title: 'Research Workspace', description: 'Research & Innovation workspace.', icon: FlaskConical };
  const Icon = definition.icon;
  const [data, setData] = useState<ResearchPortalData | null>(null);
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => { getResearchPortalData('demo').then(setData); }, []);
  const filteredProjects = useMemo(() => data?.projects.filter((p) => `${p.title} ${p.category} ${p.status}`.toLowerCase().includes(search.toLowerCase())) ?? [], [data, search]);
  const filteredFunding = useMemo(() => data?.funding.filter((p) => `${p.title} ${p.organization} ${p.category}`.toLowerCase().includes(search.toLowerCase())) ?? [], [data, search]);

  if (!data) return <div className="p-8"><div className="h-10 w-72 animate-pulse rounded bg-muted" /></div>;

  return <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8"><div className="mb-6 flex items-start gap-4"><Link href="/research"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link><div><div className="flex items-center gap-2 text-primary"><Icon className="h-5 w-5" /><span className="text-sm font-medium">Research & Innovation Institute</span></div><h1 className="mt-1 text-3xl font-bold tracking-tight">{definition.title}</h1><p className="mt-1 text-muted-foreground">{definition.description}</p></div></div>

  {section === 'projects' ? <Projects data={data} search={search} setSearch={setSearch} filtered={filteredProjects} /> : null}
  {section === 'funding' ? <Funding data={data} search={search} setSearch={setSearch} filtered={filteredFunding} saved={saved} setSaved={setSaved} /> : null}
  {section === 'publications' || section === 'repository' ? <Publications data={data} /> : null}
  {section === 'communities' ? <Communities /> : null}
  {section === 'living-labs' ? <Labs data={data} /> : null}
  {section === 'fellows' ? <Fellows /> : null}
  {section === 'challenges' ? <Challenges data={data} /> : null}
  {section === 'incubator' ? <Incubator data={data} /> : null}
  {section === 'analytics' ? <Analytics data={data} /> : null}
  {section === 'partnerships' ? <SimpleWorkspace title="Partnerships" items={['University research partners', 'Industry partners', 'Government and development partners', 'Consortium opportunities']} /> : null}
  {section === 'events' ? <SimpleWorkspace title="Research Events" items={['Research seminars', 'Grant deadline briefings', 'Publication workshops', 'Innovation demo days']} /> : null}
  </div>;
}

function Projects({ data, search, setSearch, filtered }: { data: ResearchPortalData; search: string; setSearch: (v: string) => void; filtered: ResearchPortalData['projects'] }) {
  return <><div className="mb-6 grid gap-4 md:grid-cols-4"><Metric label="Total Projects" value={data.projects.length} /><Metric label="Active" value={data.projects.filter((p) => p.status === 'Active').length} /><Metric label="Funded" value={data.projects.filter((p) => p.status === 'Funded').length} /><Metric label="Portfolio Budget" value={`K${data.projects.reduce((a, p) => a + p.budget, 0).toLocaleString()}`} /></div><Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Project Portfolio</CardTitle><CardDescription>Draft → Proposal → Approved → Funded → Active → Completed → Archived</CardDescription></div><Button><Plus className="mr-2 h-4 w-4" /> Create Project</Button></div></CardHeader><CardContent><div className="mb-5 flex gap-2"><Search className="mt-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects" /></div><div className="space-y-4">{filtered.map((project) => <div key={project.projectId} className="rounded-xl border p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><Badge>{project.status}</Badge><h3 className="mt-2 text-lg font-semibold">{project.title}</h3><p className="mt-1 text-sm text-muted-foreground">{project.category} · PI: {project.principalInvestigator}</p><p className="mt-3 max-w-3xl text-sm">{project.abstract}</p></div><div className="text-right text-sm"><p className="font-semibold">K{project.budget.toLocaleString()}</p><p className="text-muted-foreground">{project.fundingSource}</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-3">{['Overview', 'Team', 'Milestones', 'Documents', 'Deliverables', 'Budget'].map((tab) => <Button key={tab} variant="outline" size="sm">{tab}</Button>)}</div><div className="mt-4 flex flex-wrap gap-2">{stages.map((stage) => <span key={stage} className={`rounded-full px-3 py-1 text-xs ${stage === project.status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{stage}</span>)}</div></div>)}</div></CardContent></Card></>;
}

function Funding({ data, search, setSearch, filtered, saved, setSaved }: { data: ResearchPortalData; search: string; setSearch: (v: string) => void; filtered: ResearchPortalData['funding']; saved: string[]; setSaved: (v: string[]) => void }) {
  return <><div className="mb-6 grid gap-4 md:grid-cols-3"><Metric label="Open Calls" value={data.funding.length} /><Metric label="Categories" value={new Set(data.funding.map((x) => x.category)).size} /><Metric label="Saved" value={saved.length} /></div><Card><CardHeader><CardTitle>Funding Calls</CardTitle><CardDescription>Horizon Europe, Erasmus+, AU-EU Innovation, World Bank, AfDB, UNDP and Mastercard Foundation opportunities can be represented here.</CardDescription></CardHeader><CardContent><div className="mb-5 flex gap-2"><Search className="mt-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search funder, category or call" /></div><div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="flex justify-between gap-4"><Badge variant="secondary">{item.category}</Badge><span className="text-xs text-muted-foreground">Deadline {item.deadline}</span></div><h3 className="mt-3 font-semibold">{item.title}</h3><p className="text-sm font-medium text-primary">{item.organization} · {item.amount}</p><p className="mt-2 text-sm text-muted-foreground">{item.description}</p><p className="mt-3 text-xs text-muted-foreground">Eligibility: {item.eligibility}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => setSaved(saved.includes(item.id) ? saved.filter((id) => id !== item.id) : [...saved, item.id])}>{saved.includes(item.id) ? 'Saved' : 'Save Opportunity'}</Button><Button size="sm" variant="outline">Share</Button><Button size="sm" variant="outline">Join Consortium</Button><Button size="sm" variant="ghost">Request Support</Button></div></CardContent></Card>)}</div></CardContent></Card></>;
}

function Publications({ data }: { data: ResearchPortalData }) { return <div className="grid gap-4 lg:grid-cols-2">{data.publications.map((pub) => <Card key={pub.publicationId}><CardHeader><div className="flex items-start justify-between gap-4"><div><Badge variant="secondary">Publication</Badge><CardTitle className="mt-2">{pub.title}</CardTitle><CardDescription>{pub.authors.join(', ')}</CardDescription></div><FileText className="h-6 w-6 text-primary" /></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{pub.abstract}</p><div className="mt-4 flex flex-wrap gap-2">{pub.keywords.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}</div><div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-center text-sm"><div><p className="font-bold">{pub.downloads}</p><p className="text-muted-foreground">Downloads</p></div><div><p className="font-bold">{pub.citations}</p><p className="text-muted-foreground">Citations</p></div><div><p className="font-bold">{pub.doi}</p><p className="text-muted-foreground">DOI</p></div></div><Button className="mt-4" variant="outline">Citation Export <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>)}</div> }

function Communities() { const communities = ['Artificial Intelligence', 'Digital Health', 'Blockchain', 'Fintech', 'Agriculture', 'Climate', 'Energy', 'Education']; return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{communities.map((name) => <Card key={name}><CardContent className="p-5"><Users className="mb-3 h-6 w-6 text-primary" /><h3 className="font-semibold">{name}</h3><p className="mt-1 text-sm text-muted-foreground">Discussion board, announcements, events, project recruitment and resource sharing.</p><Button className="mt-4 w-full" variant="outline">Open Community</Button></CardContent></Card>)}</div> }

function Labs({ data }: { data: ResearchPortalData }) { return <div className="grid gap-5 lg:grid-cols-2">{data.labs.map((lab) => <Card key={lab.labId}><CardHeader><CardTitle>{lab.name}</CardTitle><CardDescription>Managed by {lab.manager}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">{lab.description}</p><div className="mt-4 flex flex-wrap gap-2">{lab.participants.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}</div><p className="mt-4 text-sm"><strong>{lab.projects.length}</strong> linked project(s)</p><Button className="mt-4">Enter Living Lab</Button></CardContent></Card>)}</div> }

function Fellows() { const steps = ['Submitted', 'Screened', 'Reviewed', 'Approved', 'Awarded', 'Completed']; return <Card><CardHeader><CardTitle>Research Fellowship Applications</CardTitle><CardDescription>Biography, research interests, CV, proposal and references.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-6">{steps.map((step, i) => <div key={step} className="rounded-xl border p-4 text-center"><div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{i + 1}</div><p className="text-sm font-medium">{step}</p></div>)}</div><Button className="mt-6">Apply for Fellowship <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card> }

function Challenges({ data }: { data: ResearchPortalData }) { return <div className="grid gap-5 lg:grid-cols-2">{data.challenges.map((c) => <Card key={c.challengeId}><CardHeader><Badge className="w-fit">Open Challenge</Badge><CardTitle>{c.title}</CardTitle><CardDescription>Deadline {c.deadline} · Prize pool {c.prizePool}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">{c.description}</p><div className="mt-4 flex gap-2"><Button>Participate</Button><Button variant="outline">View Brief</Button></div></CardContent></Card>)}</div> }

function Incubator({ data }: { data: ResearchPortalData }) { const pipeline = ['Research Result', 'Innovation', 'Prototype', 'MVP', 'Pilot', 'Startup', 'Investment']; const current = data.startups[0]?.stage ?? 'Prototype'; const activeIndex = Math.max(0, pipeline.findIndex((x) => x.toLowerCase() === current.toLowerCase())); return <><Card className="mb-6"><CardHeader><CardTitle>Startup Incubator Pipeline</CardTitle><CardDescription>Turn validated research into investable ventures.</CardDescription></CardHeader><CardContent><div className="grid gap-2 md:grid-cols-7">{pipeline.map((stage, i) => <div key={stage} className={`rounded-xl p-4 text-center ${i <= activeIndex ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><p className="text-xs font-semibold">{i + 1}</p><p className="mt-1 text-xs">{stage}</p></div>)}</div></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.startups.map((startup) => <Card key={startup.startupId}><CardHeader><CardTitle>{startup.name}</CardTitle><CardDescription>{startup.industry} · {startup.stage}</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-4"><Metric label="Funding Raised" value={`$${startup.fundingRaised.toLocaleString()}`} /><Metric label="Valuation" value={startup.valuation ? `$${startup.valuation.toLocaleString()}` : 'Pre-seed'} /></div><div className="mt-5 grid grid-cols-2 gap-2">{['Overview','Founders','Documents','Funding','Mentors','Investors','Milestones'].map((tab) => <Button key={tab} variant="outline">{tab}</Button>)}</div></CardContent></Card>)}</div></> }

function Analytics({ data }: { data: ResearchPortalData }) { const totalBudget = data.projects.reduce((a, p) => a + p.budget, 0); return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"><Metric label="Research Score" value={data.profile.researchScore} /><Metric label="Projects" value={data.projects.length} /><Metric label="Publications" value={data.publications.length} /><Metric label="Portfolio Budget" value={`K${totalBudget.toLocaleString()}`} /><Card className="md:col-span-2 lg:col-span-4"><CardHeader><CardTitle>Research Performance</CardTitle><CardDescription>Core institutional indicators for the Research Director dashboard.</CardDescription></CardHeader><CardContent className="space-y-5">{[['Projects', data.projects.length, 10], ['Publications', data.publications.length, 10], ['Grants', data.profile.grants, 5], ['Patents', data.profile.patents, 5], ['Startups', data.profile.startups, 5]].map(([label, value, max]) => <div key={String(label)}><div className="mb-2 flex justify-between text-sm"><span>{String(label)}</span><strong>{String(value)}</strong></div><Progress value={Math.min(Number(value) / Number(max) * 100, 100)} /></div>)}</CardContent></Card></div> }

function SimpleWorkspace({ title, items }: { title: string; items: string[] }) { return <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <Card key={item}><CardContent className="flex items-center justify-between p-5"><div><h3 className="font-semibold">{item}</h3><p className="mt-1 text-sm text-muted-foreground">Track activity, documents, contacts and actions in this workspace.</p></div><Button variant="outline" size="icon"><ArrowRight className="h-4 w-4" /></Button></CardContent></Card>)}</div> }

function Metric({ label, value }: { label: string; value: string | number }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card> }
