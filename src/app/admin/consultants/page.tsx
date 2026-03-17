'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { getConsultantApplications } from '@/lib/api';
import type { ConsultantApplication } from '@/lib/api/types';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived' | 'deleted';

export default function ConsultantsApprovalPage() {
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordStates, setRecordStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const loadApplications = async () => {
      const data = await getConsultantApplications();
      setApplications(data);
      setRecordStates(Object.fromEntries(data.map((app) => [app.id, 'active'])));
      setLoading(false);
    };
    loadApplications();
  }, []);

  const pushHistory = (id: string, action: string) => setHistory((prev) => [{ id: `${id}-${Date.now()}`, entity: 'Consultant', entityId: id, action, timestamp: new Date().toISOString() }, ...prev]);

  const handleApprove = (id: string) => setApplications((apps) => apps.map((app) => (app.id === id ? { ...app, status: 'Approved' } : app)));
  const handleDeny = (id: string) => setApplications((apps) => apps.map((app) => (app.id === id ? { ...app, status: 'Rejected' } : app)));
  const setLifecycleState = (id: string, next: RecordState) => {
    setRecordStates((prev) => ({ ...prev, [id]: next }));
    pushHistory(id, next === 'active' ? 'restored' : next === 'archived' ? 'archived' : 'hard deleted');
  };

  const pendingApplications = applications.filter((app) => app.status === 'Pending' && (recordStates[app.id] ?? 'active') !== 'deleted');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultant Applications</h1>
        <p className="text-muted-foreground">Review, update, archive/restore, and hard-delete consultant records.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Applications ({pendingApplications.length})</CardTitle><CardDescription>The following applications are awaiting your review.</CardDescription></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {loading ? <p className="text-muted-foreground md:col-span-2">Loading applications...</p> : pendingApplications.length > 0 ? pendingApplications.map((app) => {
            const state = recordStates[app.id] ?? 'active';
            return (
              <Card key={app.id}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0"><Avatar className="h-12 w-12"><AvatarImage src={app.avatar} alt={app.name} /><AvatarFallback>{app.name.charAt(0)}</AvatarFallback></Avatar><div><CardTitle>{app.name}</CardTitle><CardDescription>{app.department} · {state}</CardDescription></div></CardHeader>
                <CardContent><Button variant="outline" size="sm" asChild><Link href={`/admin/consultants/${app.id}`}><FileText className="mr-2 h-4 w-4" /> Review Application</Link></Button></CardContent>
                <CardFooter className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => handleDeny(app.id)}><X className="mr-2 h-4 w-4" /> Deny</Button><Button size="sm" onClick={() => handleApprove(app.id)}><Check className="mr-2 h-4 w-4" /> Approve</Button>{state === 'active' ? <Button size="sm" variant="outline" onClick={() => setLifecycleState(app.id, 'archived')}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => setLifecycleState(app.id, 'active')}>Restore</Button>}<Button size="sm" variant="destructive" onClick={() => setLifecycleState(app.id, 'deleted')}>Hard Delete</Button></CardFooter>
              </Card>
            );
          }) : <p className="text-muted-foreground md:col-span-2">No pending applications.</p>}
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 md:col-span-2">
              <p className="font-medium">No pending applications.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Next action: monitor this queue and review approved/rejected history for quality checks.
              </p>
              <div className="mt-3">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/lecturer-applications">Open lecturer applications</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Reviewed Applications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {applications.filter((app) => app.status !== 'Pending' && (recordStates[app.id] ?? 'active') !== 'deleted').map((app) => (
            <div key={app.id} className="flex items-center justify-between rounded-lg border p-4"><div className="flex items-center gap-4"><Avatar><AvatarImage src={app.avatar} alt={app.name} /><AvatarFallback>{app.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{app.name}</p><p className="text-sm text-muted-foreground">{app.department}</p></div></div><Badge variant={app.status === 'Approved' ? 'default' : 'destructive'}>{app.status}</Badge></div>
          ))}
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Consultant destructive history" entries={history} />
    </div>
  );
}
