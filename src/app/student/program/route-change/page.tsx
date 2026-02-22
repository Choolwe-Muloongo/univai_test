'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getAvailableIntakes, getRouteChangeRequests, submitRouteChangeRequest } from '@/lib/api';
import type { Intake, RouteChangeRequest } from '@/lib/api/types';

export default function RouteChangePage() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [requests, setRequests] = useState<RouteChangeRequest[]>([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [available, history] = await Promise.all([
        getAvailableIntakes(),
        getRouteChangeRequests(),
      ]);
      setIntakes(available);
      setRequests(history);
      setSelectedIntakeId(available[0]?.id ?? '');
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!selectedIntakeId) return;
    setSubmitting(true);
    await submitRouteChangeRequest({
      requestedIntakeId: selectedIntakeId,
      reason: reason || undefined,
    });
    const history = await getRouteChangeRequests();
    setRequests(history);
    setReason('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Route Change Request</h1>
          <p className="text-muted-foreground">
            Request to switch your intake or delivery mode (online/campus/hybrid).
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/student/program">Back to Program</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Request</CardTitle>
          <CardDescription>Pick the intake you want to move into and tell us why.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Available Intakes</Label>
            <Select value={selectedIntakeId} onValueChange={setSelectedIntakeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent>
                {intakes.map((intake) => (
                  <SelectItem key={intake.id} value={intake.id}>
                    {intake.name} - {intake.deliveryMode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why you need a route change."
              className="min-h-24"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!selectedIntakeId || submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Track approvals and admin notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border p-4 text-sm space-y-1">
              <div className="font-semibold">{request.requestedIntakeName ?? request.requestedIntakeId}</div>
              <div className="text-muted-foreground">Status: {request.status.toUpperCase()}</div>
              {request.reviewNotes && (
                <div className="text-muted-foreground">Admin note: {request.reviewNotes}</div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">No requests submitted yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
