'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  const handleReview = async (request: RouteChangeRequest, status: 'approved' | 'rejected') => {
    const reviewNotes = notes[request.id]?.trim() || null;
    const updated = await reviewRouteChangeRequest(request.id, { status, reviewNotes });
    setRequests((prev) => prev.map((item) => (item.id === request.id ? (updated as RouteChangeRequest) : item)));
    toast({ title: 'Route request updated', description: 'The route decision has been saved.' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Route Change Requests</h1>
        <p className="text-muted-foreground">Review student route change requests.</p>
      </div>

      <AdminActionPanel
        title="Route Request Guidance"
        description="Use this guidance when route movement affects intake capacity or academic planning."
        scenarios={['intake_overcapacity']}
      />

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Review student requests and leave notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="space-y-5 rounded-lg border p-4">
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
                <Button variant="outline" onClick={() => handleReview(request, 'rejected')}>Decline</Button>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">No route-change requests pending</p>
              <p className="mt-1">Next action: review intake capacity and keep admissions communication up to date.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/intakes">Review intakes</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/admissions">Open admissions queue</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
