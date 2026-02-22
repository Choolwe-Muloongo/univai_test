'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getAdminRouteChangeRequests, reviewRouteChangeRequest } from '@/lib/api';
import type { RouteChangeRequest } from '@/lib/api/types';

export default function AdminRouteRequestsPage() {
  const [requests, setRequests] = useState<RouteChangeRequest[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      const data = await getAdminRouteChangeRequests();
      setRequests(data);
    };
    load();
  }, []);

  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    const reviewNotes = notes[id];
    const updated = await reviewRouteChangeRequest(id, { status, reviewNotes });
    setRequests((prev) => prev.map((item) => (item.id === id ? (updated as RouteChangeRequest) : item)));
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
            <div key={request.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.studentName ?? 'Student'}</p>
                  <p className="text-sm text-muted-foreground">{request.studentEmail}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Status: {request.status.toUpperCase()}
                </div>
              </div>
              <div className="text-sm">
                Current: {request.currentIntakeName ?? request.currentIntakeId ?? 'N/A'}
              </div>
              <div className="text-sm">
                Requested: {request.requestedIntakeName ?? request.requestedIntakeId}
              </div>
              {request.reason && (
                <div className="text-sm text-muted-foreground">Reason: {request.reason}</div>
              )}
              <Textarea
                placeholder="Review notes"
                value={notes[request.id] ?? request.reviewNotes ?? ''}
                onChange={(event) => setNotes((prev) => ({ ...prev, [request.id]: event.target.value }))}
                className="min-h-20"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleReview(request.id, 'approved')}>Approve</Button>
                <Button variant="outline" onClick={() => handleReview(request.id, 'rejected')}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
