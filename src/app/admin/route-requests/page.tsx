'use client';

import { useEffect, useState } from 'react';

import { AdminActionPanel } from '@/components/admin/admin-action-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getAdminRouteChangeRequests, reviewRouteChangeRequest } from '@/lib/api';
import type { RouteChangeRequest } from '@/lib/api/types';

export default function AdminRouteRequestsPage() {
  const [requests, setRequests] = useState<RouteChangeRequest[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const data = await getAdminRouteChangeRequests();
      setRequests(data);
    };
    load();
  }, []);

  const handleReview = async (
    request: RouteChangeRequest,
    status: 'approved' | 'rejected',
    metadata?: { decisionReason?: string }
  ) => {
    const explicitReason = metadata?.decisionReason?.trim();
    const note = notes[request.id]?.trim();
    const reviewNotes = [note, explicitReason ? `Decision reason: ${explicitReason}` : ''].filter(Boolean).join('\n\n');

    const updated = await reviewRouteChangeRequest(request.id, { status, reviewNotes });
    setRequests((prev) => prev.map((item) => (item.id === request.id ? (updated as RouteChangeRequest) : item)));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Route Change Requests</h1>
        <p className="text-muted-foreground">Approve or reject student route change requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Review student requests and leave notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border p-4 space-y-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.studentName ?? 'Student'}</p>
                  <p className="text-sm text-muted-foreground">{request.studentEmail}</p>
                </div>
                <div className="text-sm text-muted-foreground">Status: {request.status.toUpperCase()}</div>
              </div>
              <div className="text-sm">Current: {request.currentIntakeName ?? request.currentIntakeId ?? 'N/A'}</div>
              <div className="text-sm">Requested: {request.requestedIntakeName ?? request.requestedIntakeId}</div>
              {request.reason && <div className="text-sm text-muted-foreground">Reason: {request.reason}</div>}
              <Textarea
                placeholder="Reviewer notes"
                value={notes[request.id] ?? request.reviewNotes ?? ''}
                onChange={(event) => setNotes((prev) => ({ ...prev, [request.id]: event.target.value }))}
                className="min-h-20"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleReview(request, 'approved')}>Approve</Button>
                <Button variant="outline" onClick={() => handleReview(request, 'rejected')}>
                  Reject
                </Button>
              </div>

              <AdminActionPanel
                title="Route Request Decision Panel"
                situationSummary={`Student ${request.studentName ?? request.studentEmail ?? 'record'} requested a route change from ${request.currentIntakeName ?? request.currentIntakeId ?? 'N/A'} to ${request.requestedIntakeName ?? request.requestedIntakeId}.`}
                evidence={[
                  {
                    id: `request-${request.id}-reason`,
                    label: 'Student reason',
                    detail: request.reason ?? 'No explicit reason supplied by the student.',
                    kind: 'document',
                  },
                  {
                    id: `request-${request.id}-history`,
                    label: 'Review history',
                    detail: request.reviewNotes ?? 'No prior reviewer notes.',
                    kind: 'history',
                  },
                  {
                    id: `request-${request.id}-state`,
                    label: 'Workflow state',
                    detail: `Current status is ${request.status}.`,
                    kind: 'log',
                  },
                ]}
                actions={[
                  {
                    id: 'approve',
                    label: 'Approve Route Request',
                    description: 'Approve requested route/intake transfer.',
                    consequenceHint: 'Enrollment target intake updates and timetable changes follow.',
                    requiredNotifications: ['Student email', 'Program office', 'Finance office'],
                    reversible: true,
                    rollbackPath: 'Submit corrective transfer request and revert intake assignment.',
                    sensitive: true,
                  },
                  {
                    id: 'reject',
                    label: 'Reject Route Request',
                    description: 'Decline transfer request and keep current intake.',
                    consequenceHint: 'Student remains in existing route and may submit a new request.',
                    requiredNotifications: ['Student email', 'Student success team'],
                    reversible: true,
                    rollbackPath: 'Reopen request and resubmit with manager approval.',
                    sensitive: true,
                    variant: 'destructive',
                  },
                  {
                    id: 'request_info',
                    label: 'Request More Information',
                    description: 'Ask student for supporting evidence before decision.',
                    consequenceHint: 'Request remains pending while review clock pauses.',
                    requiredNotifications: ['Student email', 'Route review queue'],
                    reversible: true,
                    rollbackPath: 'Resume decision after evidence arrives.',
                    variant: 'outline',
                  },
                  {
                    id: 'escalate',
                    label: 'Escalate for Program Board Review',
                    description: 'Escalate complex transfers needing board adjudication.',
                    consequenceHint: 'Local reviewer cannot finalize until board verdict is posted.',
                    requiredNotifications: ['Program board', 'Academic advisor'],
                    reversible: true,
                    rollbackPath: 'Close escalation and continue local review.',
                    variant: 'secondary',
                  },
                ]}
                onSubmitAction={async (actionId, metadata) => {
                  if (actionId === 'approve') {
                    await handleReview(request, 'approved', metadata);
                    toast({ title: 'Route request approved', description: 'Decision metadata saved.' });
                    return;
                  }
                  if (actionId === 'reject') {
                    await handleReview(request, 'rejected', metadata);
                    toast({ title: 'Route request rejected', description: 'Decision metadata saved.' });
                    return;
                  }

                  toast({
                    title: `Action logged: ${actionId.replace('_', ' ')}`,
                    description: metadata.decisionReason
                      ? `Decision reason captured: ${metadata.decisionReason}`
                      : 'Metadata captured for follow-up workflow.',
                  });
                }}
              />
            </div>
          ))}
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
