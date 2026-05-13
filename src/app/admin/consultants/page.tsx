'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, FileText, X } from 'lucide-react';

import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getConsultantApplications } from '@/lib/api';
import type { ConsultantApplication } from '@/lib/api/types';

type RecordState = 'active' | 'archived' | 'deleted';

export default function ConsultantsApprovalPage() {
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordStates, setRecordStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const data = await getConsultantApplications();
        setApplications(data);
        setRecordStates(Object.fromEntries(data.map((app) => [String(app.id), 'active'])));
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const pushHistory = (id: string, action: string) => {
    setHistory((prev) => [
      {
        id: `${id}-${Date.now()}`,
        entity: 'Consultant',
        entityId: id,
        action,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleApprove = (id: string) => {
    setApplications((apps) => apps.map((app) => (String(app.id) === id ? { ...app, status: 'Approved' } : app)));
    pushHistory(id, 'approved');
  };

  const handleDeny = (id: string) => {
    setApplications((apps) => apps.map((app) => (String(app.id) === id ? { ...app, status: 'Rejected' } : app)));
    pushHistory(id, 'rejected');
  };

  const setLifecycleState = (id: string, next: RecordState) => {
    setRecordStates((prev) => ({ ...prev, [id]: next }));
    pushHistory(id, next === 'active' ? 'restored' : next === 'archived' ? 'archived' : 'hard deleted');
  };

  const visibleApplications = applications.filter((app) => (recordStates[String(app.id)] ?? 'active') !== 'deleted');
  const pendingApplications = visibleApplications.filter((app) => app.status === 'Pending');
  const reviewedApplications = visibleApplications.filter((app) => app.status !== 'Pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultant Applications</h1>
        <p className="text-muted-foreground">Review, update, archive, restore, and hard-delete consultant records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications ({pendingApplications.length})</CardTitle>
          <CardDescription>The following applications are awaiting your review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {loading ? (
            <p className="text-muted-foreground md:col-span-2">Loading applications...</p>
          ) : pendingApplications.length > 0 ? (
            pendingApplications.map((app) => {
              const id = String(app.id);
              const state = recordStates[id] ?? 'active';

              return (
                <Card key={id}>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={app.avatar} alt={app.name} />
                      <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>
                        {app.department} · {state}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/consultants/${id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Review Application
                      </Link>
                    </Button>
                  </CardContent>
                  <CardFooter className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDeny(id)}>
                      <X className="mr-2 h-4 w-4" />
                      Deny
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    {state === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => setLifecycleState(id, 'archived')}>
                        Archive
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setLifecycleState(id, 'active')}>
                        Restore
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => setLifecycleState(id, 'deleted')}>
                      Hard Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
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
        <CardHeader>
          <CardTitle>Reviewed Applications</CardTitle>
          <CardDescription>Approved and rejected consultant applications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviewedApplications.length > 0 ? (
            reviewedApplications.map((app) => {
              const id = String(app.id);
              const state = recordStates[id] ?? 'active';

              return (
                <div key={id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={app.avatar} alt={app.name} />
                      <AvatarFallback>{app.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{app.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.department} · {state}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={app.status === 'Approved' ? 'default' : 'destructive'}>{app.status}</Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/consultants/${id}`}>View</Link>
                    </Button>
                    {state === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => setLifecycleState(id, 'archived')}>
                        Archive
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setLifecycleState(id, 'active')}>
                        Restore
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => setLifecycleState(id, 'deleted')}>
                      Hard Delete
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No reviewed applications yet.</div>
          )}
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Consultant destructive history" entries={history} />
    </div>
  );
}
