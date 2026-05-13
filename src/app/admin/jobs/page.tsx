'use client';

import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getJobs } from '@/lib/api';
import type { Job } from '@/lib/api/types';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived' | 'deleted';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recordStates, setRecordStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getJobs();
      setJobs(data);
      setRecordStates(Object.fromEntries(data.map((job) => [job.id, 'active'])));
    };
    load();
  }, []);

  const pushHistory = (id: string, action: string) => setHistory((prev) => [{ id: `${id}-${Date.now()}`, entity: 'Job', entityId: id, action, timestamp: new Date().toISOString() }, ...prev]);

  const applyBulkModeration = (action: 'archive' | 'restore' | 'hard_delete') => {
    const nextState: RecordState = action === 'archive' ? 'archived' : action === 'restore' ? 'active' : 'deleted';
    setRecordStates((prev) => {
      const copy = { ...prev };
      selectedIds.forEach((id) => { copy[id] = nextState; pushHistory(id, `bulk moderation: ${action}`); });
      return copy;
    });
    setSelectedIds([]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job & Career Hub</h1>
        <p className="text-muted-foreground">Moderate listings with explicit archive, restore, and hard-delete actions.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Bulk moderation actions</CardTitle><CardDescription>Operationally required moderation controls for jobs.</CardDescription></CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => applyBulkModeration('archive')} disabled={selectedIds.length === 0}>Archive selected</Button>
          <Button variant="outline" onClick={() => applyBulkModeration('restore')} disabled={selectedIds.length === 0}>Restore selected</Button>
          <Button variant="destructive" onClick={() => applyBulkModeration('hard_delete')} disabled={selectedIds.length === 0}>Hard-delete selected</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const state = recordStates[job.id] ?? 'active';
          if (state === 'deleted') return null;
          return (
            <Card key={job.id} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between"><Checkbox checked={selectedIds.includes(job.id)} onCheckedChange={(checked) => setSelectedIds((prev) => checked ? [...prev, job.id] : prev.filter((id) => id !== job.id))} /><Badge variant={state === 'active' ? 'outline' : 'secondary'}>{state}</Badge></div>
                <div className="flex justify-between"><CardTitle>{job.title}</CardTitle><Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>{job.type}</Badge></div>
                <CardDescription>{job.company}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1"><div className="flex items-center text-sm text-muted-foreground"><MapPin className="mr-1.5 h-4 w-4" />{job.location}</div></CardContent>
              <CardFooter className="flex-col gap-2">
                <Button asChild className="w-full"><Link href={`/admin/jobs/${job.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                {state === 'active' ? <Button variant="outline" className="w-full" onClick={() => { setRecordStates((prev) => ({ ...prev, [job.id]: 'archived' })); pushHistory(job.id, 'archived'); }}>Archive</Button> : <Button variant="outline" className="w-full" onClick={() => { setRecordStates((prev) => ({ ...prev, [job.id]: 'active' })); pushHistory(job.id, 'restored'); }}>Restore</Button>}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <ImmutableHistoryPanel title="Job moderation history" entries={history} />
    </div>
  );
}
