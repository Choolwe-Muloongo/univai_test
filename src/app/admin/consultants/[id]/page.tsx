'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getConsultantApplicationById } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminDecisionPanel, type DecisionActionOption } from '@/components/admin/admin-decision-panel';
import type { ConsultantApplication } from '@/lib/api/types';

const consultantActions: DecisionActionOption[] = [
  {
    value: 'approve',
    label: 'Approve Consultant',
    consequence: 'Consultant profile becomes active and discoverable for assignments.',
    nextFollowUp: 'Notify onboarding to issue contract and account permissions.',
    highImpact: true,
    reasonCodes: [
      { value: 'CREDENTIALS_VERIFIED', label: 'CREDENTIALS_VERIFIED - Credentials passed verification' },
      { value: 'DEPT_APPROVAL', label: 'DEPT_APPROVAL - Department approved staffing need' },
    ],
  },
  {
    value: 'needs_info',
    label: 'Request More Information',
    consequence: 'Application remains pending and applicant is asked for missing verification data.',
    nextFollowUp: 'Re-check submitted documents after applicant response.',
  },
  {
    value: 'reject',
    label: 'Reject Application',
    consequence: 'Application is closed and consultant cannot be onboarded.',
    nextFollowUp: 'Send rejection rationale and archive profile notes.',
    highImpact: true,
    reasonCodes: [
      { value: 'FAILED_VERIFICATION', label: 'FAILED_VERIFICATION - Verification failed' },
      { value: 'ROLE_MISMATCH', label: 'ROLE_MISMATCH - Skills do not match role requirements' },
    ],
  },
];

export default function ConsultantDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [application, setApplication] = useState<ConsultantApplication | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getConsultantApplicationById(id as string);
      setApplication(data);
    };
    load();
  }, [id]);

  if (!application) {
    return <p className="text-sm text-muted-foreground">Loading consultant application...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={application.avatar} alt={application.name} />
            <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{application.name}</h1>
            <p className="text-muted-foreground">{application.department}</p>
          </div>
        </div>
        <Badge variant={application.status === 'Approved' ? 'default' : application.status === 'Rejected' ? 'destructive' : 'secondary'}>
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
            <CardDescription>Review documents and verify credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This applicant has submitted required documentation for lecturer verification. Use the decision panel to
              complete approvals, escalation, and notifications.
            </p>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Curriculum Vitae</p>
                    <p className="text-xs text-muted-foreground">PDF uploaded</p>
                  </div>
                </div>
                <Button variant="outline">Preview</Button>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Identification Document</p>
                    <p className="text-xs text-muted-foreground">PDF uploaded</p>
                  </div>
                </div>
                <Button variant="outline">Preview</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Return to listings after review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/consultants">Back to Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <AdminDecisionPanel
        title="Consultant Decision Panel"
        description="Standardized review flow for consultant approvals and rejections."
        situationSummary={`Consultant ${application.name} from ${application.department} is currently ${application.status}.`}
        evidenceItems={['CV uploaded', 'Identification document uploaded', 'Department fit checklist pending final review']}
        actions={consultantActions}
        requiredRecipients={[
          { value: 'consultant', label: 'Consultant Applicant' },
          { value: 'hr_team', label: 'HR Team' },
          { value: 'department_head', label: 'Department Head' },
        ]}
        onSubmitDecision={async (payload) => {
          toast({
            title: 'Decision captured',
            description: `Action "${payload.action}" recorded with notifications queued.`,
          });
        }}
      />
    </div>
  );
}
