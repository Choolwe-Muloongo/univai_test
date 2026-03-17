'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AdminDecisionPanel, type DecisionActionOption } from '@/components/admin/admin-decision-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminRouteChangeRequests, reviewRouteChangeRequest } from '@/lib/api';
import type { RouteChangeRequest } from '@/lib/api/types';

const routeDecisionActions: DecisionActionOption[] = [
  {
    value: 'approved',
    label: 'Approve Route Change',
    consequence: 'Student enrollment path is switched to requested intake and schedule is recalculated.',
    nextFollowUp: 'Confirm timetable sync and notify student services desk.',
    highImpact: true,
    reasonCodes: [
      { value: 'CAPACITY_AVAILABLE', label: 'CAPACITY_AVAILABLE - Seat capacity available' },
      { value: 'ACADEMIC_FIT', label: 'ACADEMIC_FIT - Route aligns with academic plan' },
    ],
  },
  {
    value: 'rejected',
    label: 'Reject Route Change',
    consequence: 'Student remains on current intake and requested route change is closed.',
    nextFollowUp: 'Provide alternate support options to student advisor.',
    highImpact: true,
    reasonCodes: [
      { value: 'CAPACITY_BLOCKED', label: 'CAPACITY_BLOCKED - Intake capacity not available' },
      { value: 'POLICY_RESTRICTION', label: 'POLICY_RESTRICTION - Policy restricts route switch window' },
    ],
  },
  {
    value: 'needs_info',
    label: 'Request Additional Context',
    consequence: 'Decision is deferred while the student provides more information.',
    nextFollowUp: 'Review additional context and re-open approval decision.',
  },
];

export default function AdminRouteRequestDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [request, setRequest] = useState<RouteChangeRequest | null>(null);

  useEffect(() => {
    const load = async () => {
      const requests = await getAdminRouteChangeRequests();
      const found = requests.find((item) => String(item.id) === String(id));
      setRequest(found ?? null);
    };
    load();
  }, [id]);

  const situationSummary = useMemo(() => {
    if (!request) return '';
    return `${request.studentName ?? 'Student'} requested a route change from ${request.currentIntakeName ?? request.currentIntakeId ?? 'N/A'} to ${request.requestedIntakeName ?? request.requestedIntakeId}. Current status: ${request.status}.`;
  }, [request]);

  if (!request) {
    return <p className="text-sm text-muted-foreground">Loading route-change request...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Route-Change Review Details</h1>
          <p className="text-muted-foreground">Structured decision workflow for route-change requests.</p>
        </div>
        <Badge variant="secondary">{request.status.toUpperCase()}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
          <CardDescription>Review student request details before taking action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-medium">Student:</span> {request.studentName ?? 'Student'} ({request.studentEmail ?? 'N/A'})</p>
          <p><span className="text-foreground font-medium">Current route:</span> {request.currentIntakeName ?? request.currentIntakeId ?? 'N/A'}</p>
          <p><span className="text-foreground font-medium">Requested route:</span> {request.requestedIntakeName ?? request.requestedIntakeId}</p>
          <p><span className="text-foreground font-medium">Request reason:</span> {request.reason ?? 'No reason provided'}</p>
        </CardContent>
      </Card>

      <AdminDecisionPanel
        title="Route-Change Decision Panel"
        description="Apply the same decision structure used across admin decision pages."
        situationSummary={situationSummary}
        evidenceItems={[
          `Submission timestamp: ${request.createdAt ?? 'N/A'}`,
          `Current review notes: ${request.reviewNotes ?? 'None'}`,
          'Enrollment and intake capacity policy checks required',
        ]}
        actions={routeDecisionActions}
        requiredRecipients={[
          { value: 'student', label: 'Student' },
          { value: 'advising', label: 'Academic Advising Team' },
          { value: 'registrar', label: 'Registrar Office' },
        ]}
        onSubmitDecision={async (payload) => {
          if (payload.action === 'needs_info') {
            toast({
              title: 'Additional context requested',
              description: 'Decision deferred pending student clarification.',
            });
            return;
          }

          const reviewNotes = [
            payload.reasonCode ? `Reason Code: ${payload.reasonCode}` : null,
            `Decision Reason: ${payload.decisionReason}`,
            payload.escalate ? `Escalated: ${payload.escalationNote || 'Yes'}` : null,
            `Notify: ${payload.recipients.join(', ')}`,
          ]
            .filter(Boolean)
            .join('\n');

          const updated = await reviewRouteChangeRequest(request.id, {
            status: payload.action,
            reviewNotes,
          });
          setRequest(updated as RouteChangeRequest);
          toast({
            title: 'Route-change decision submitted',
            description: `Request marked as ${payload.action}.`,
          });
        }}
      />

      <Button variant="ghost" asChild>
        <Link href="/admin/route-requests">Back to requests</Link>
      </Button>
    </div>
  );
}
