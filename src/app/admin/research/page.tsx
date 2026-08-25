'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, FileText, FlaskConical, Rocket, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getResearchAdminDashboard } from '@/lib/research-portal';

export default function AdminResearchPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getResearchAdminDashboard().then(setData).catch(() => setData(null)); }, []);
  const metrics = data?.metrics ?? { projects: 0, funding: 0, publications: 0, partnerships: 0, startups: 0, fellows: 0 };
  const cards = [
    ['Projects', metrics.projects, FlaskConical], ['Funding', metrics.funding, CircleDollarSign], ['Publications', metrics.publications, FileText],
    ['Partnerships', metrics.partnerships, BriefcaseBusiness], ['Startups', metrics.startups, Rocket], ['Research Fellows', metrics.fellows, Users],
  ] as const;
  return <div className="space-y-8"><div><Badge variant="secondary">Research Director</Badge><h1 className="mt-2 text-3xl font-bold tracking-tight">Research & Innovation Administration</h1><p className="text-muted-foreground">Approve projects, publications and grants, and manage the URII research ecosystem.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label,value,Icon])=><Card key={label}><CardContent className="p-6"><Icon className="mb-3 h-6 w-6 text-primary"/><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></CardContent></Card>)}</div><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Approvals</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Review pending projects, publications and grant submissions.</p><Button asChild className="mt-4"><Link href="/research/projects">Review Projects <ArrowRight className="ml-2 h-4 w-4"/></Link></Button></CardContent></Card><Card><CardHeader><CardTitle>Research Ecosystem</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Manage communities, labs, challenges and fellowships.</p><Button asChild className="mt-4" variant="outline"><Link href="/research/communities">Manage Ecosystem</Link></Button></CardContent></Card><Card><CardHeader><CardTitle>Analytics</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Monitor research activity, funding, publications and startup outcomes.</p><Button asChild className="mt-4" variant="outline"><Link href="/research/analytics">Open Analytics</Link></Button></CardContent></Card></div></div>;
}
